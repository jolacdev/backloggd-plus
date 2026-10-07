/**
 * Checks browser ZIP build manifests, expected manifest format, and Firefox extension ID.
 *
 * Run after ZIP packaging. Usage: `pnpm check:packages [chrome|firefox|all] [vX.Y.Z]`
 *
 * CI supplies the browser from its matrix and the tag is reserved for release runs.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { name, version } from '../package.json'; // Values used in the package ZIP filename.

type PackageManifest = {
  manifest_version: number;
  version: string;
  browser_specific_settings?: { gecko: { id: string } };
};

// First two arguments are reserved for Node and this script paths.
const browser = process.argv[2] ?? 'all';
const releaseTag: string | undefined = process.argv[3]; // Must be prefixed with `v`.
const expectedManifestVersions = { chrome: 3, firefox: 2 };

assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/); // Require X.Y.Z without prefixes, suffixes, or leading zeros.
assert.ok(version.split('.').every((part) => Number(part) <= 65535)); // Keep each version within Chrome's limit.

// Require the supplied release tag to match `package.json`.
if (releaseTag) {
  assert.equal(releaseTag, `v${version}`, 'Tag and package version differ');
}

// Reject unknown browsers.
assert.ok(
  browser === 'all' || browser in expectedManifestVersions,
  'Unknown browser',
);

// Per-browser versioning and Firefox ID checks.
for (const [browserName, manifestVersion] of Object.entries(
  expectedManifestVersions,
)) {
  const shouldCheck = browser === 'all' || browser === browserName;
  if (!shouldCheck) continue;

  // Read manifest.json without extracting the ZIP to disk (`p`).
  const packageZipPath = `.output/${name}-${version}-${browserName}.zip`;
  const manifestJson = execFileSync(
    'unzip',
    ['-p', packageZipPath, 'manifest.json'],
    { encoding: 'utf8' },
  );
  const manifest: PackageManifest = JSON.parse(manifestJson);

  // Require both manifest version and package version to match the expected values.
  assert.equal(manifest.version, version);
  assert.equal(manifest.manifest_version, manifestVersion);

  // Preserve the extension ID used by the existing Firefox listing.
  if (browserName === 'firefox') {
    assert.equal(
      manifest.browser_specific_settings?.gecko.id,
      'backloggd-plus@jolacdev',
    );
  }
}
