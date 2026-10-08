/* eslint-disable no-console */

/**
 * Attach CI's verified ZIPs to a GitHub release draft and set its title.
 * Runs in .github/workflows/release.yml after release CI succeeds; publication stays manual.
 * Run from the repository root with package.json and downloaded ZIPs in release-assets/.
 * The workflow provides RELEASE_TAG, GH_TOKEN, and GITHUB_STEP_SUMMARY.
 * Uses Node's built-in TypeScript support and gh; no dependencies to install.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, statSync } from 'node:fs';

import { readCommandOutput } from '../shared/read-command-output.ts';

type GitHubRelease = {
  isDraft: boolean;
};

type PackageMetadata = {
  name: string;
  version: string;
};

const releaseTag = process.env.RELEASE_TAG ?? '';
const release: GitHubRelease = JSON.parse(
  readCommandOutput('gh', ['release', 'view', releaseTag, '--json', 'isDraft']),
);

// Reruns must leave already published downloads unchanged.
if (release.isDraft === false) {
  console.log(`${releaseTag} is already published; its assets will not be changed.`);
  process.exit(0);
}
assert.equal(release.isDraft, true, 'Only draft releases can be prepared');

const releasePackage: PackageMetadata = JSON.parse(readFileSync('package.json', 'utf8'));
const assetPrefix = `release-assets/${releasePackage.name}-${releasePackage.version}`;
const packageZipPaths = ['chrome.zip', 'firefox.zip', 'sources.zip'].map((suffix) => `${assetPrefix}-${suffix}`);

// Require every expected ZIP before uploading any files.
for (const packageZipPath of packageZipPaths) {
  assert.ok(statSync(packageZipPath).isFile(), `Expected ZIP file: ${packageZipPath}`);
}

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
assert.ok(summaryFile, 'GITHUB_STEP_SUMMARY is required to report draft readiness');

// Replace only the expected draft ZIPs, then set the title without publishing.
execFileSync('gh', ['release', 'upload', releaseTag, ...packageZipPaths, '--clobber'], { stdio: 'inherit' });
execFileSync('gh', ['release', 'edit', releaseTag, '--title', `Toolkittd ${releaseTag}`], { stdio: 'inherit' });

// Show the maintainer's next step in the Actions summary.
appendFileSync(
  summaryFile,
  `Draft ${releaseTag} is ready. Review its ZIPs in GitHub Releases, then select Publish release.\n`,
);
