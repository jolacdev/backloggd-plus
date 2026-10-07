/**
 * Compares the original Firefox build with a rebuild from its sources ZIP for byte-for-byte files equality.
 *
 * Note that this check needs (`pnpm zip:firefox`) fresh and existing Firefox
 * sources ZIP and the original build to exist in `.output/` before running.
 *
 * Run from the repository root; requires pnpm and unzip. No arguments needed.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { name, version } from '../package.json'; // Values used in the sources ZIP filename.

const sourcesZipPath = resolve(`.output/${name}-${version}-sources.zip`); // Get the existing sources ZIP path.
const tempSourcesDirectory = mkdtempSync(join(tmpdir(), 'toolkittd-sources-')); // Create a temporary directory to extract the sources ZIP into.

/**
 * Returns a sorted list of file paths in a directory, including subdirectories and using relative paths.
 * @example getSortedRelativeFilePaths(".output/firefox-mv2") // ['assets/popup.css', 'assets/popup.js', ..., 'manifest.json']
 */
const getSortedRelativeFilePaths = (directory: string) =>
  readdirSync(directory, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(directory, join(entry.parentPath, entry.name)))
    .sort();

try {
  execFileSync('unzip', ['-q', sourcesZipPath, '-d', tempSourcesDirectory]); // Extract sources into the temporary directory.

  // Check that prerequisite files and Firefox reviewer instructions files are present.
  for (const filePath of [
    '.node-version',
    'pnpm-lock.yaml',
    'docs/FIREFOX_REVIEWER_INSTRUCTIONS.md',
  ]) {
    assert.ok(
      readFileSync(join(tempSourcesDirectory, filePath)).length, // Require the file to exist and be non-empty.
      `Missing ${filePath}`,
    );
  }

  // Install dependencies from the extracted sources.
  execFileSync('pnpm', ['install', '--frozen-lockfile'], {
    cwd: tempSourcesDirectory,
    stdio: 'inherit', // Show output log.
  });
  // Type-check and build Firefox MV2 from the extracted sources.
  execFileSync('pnpm', ['build:firefox'], {
    cwd: tempSourcesDirectory,
    stdio: 'inherit', // Show output log.
  });

  // Compare all generated files.
  const buildDirectory = resolve('.output/firefox-mv2'); // Original build produced during packaging.
  const rebuiltDirectory = join(tempSourcesDirectory, '.output/firefox-mv2'); // Path of the build produced by the extracted sources.

  const buildDirectoryFilePaths = getSortedRelativeFilePaths(buildDirectory);

  // Require rebuild to produce exactly the same file paths.
  assert.deepEqual(
    getSortedRelativeFilePaths(rebuiltDirectory),
    buildDirectoryFilePaths,
    'Source rebuild changed filenames',
  );

  // Compare the contents of each file in the original build and the build from the extracted sources.
  for (const filePath of buildDirectoryFilePaths) {
    const originalContents = readFileSync(join(buildDirectory, filePath));
    const rebuiltContents = readFileSync(join(rebuiltDirectory, filePath));

    assert.ok(
      originalContents.equals(rebuiltContents), // Require identical bytes.
      `Source rebuild changed ${filePath}`,
    );
  }
} finally {
  // Always run a cleanup.
  rmSync(tempSourcesDirectory, {
    force: true,
    recursive: true,
  });
}
