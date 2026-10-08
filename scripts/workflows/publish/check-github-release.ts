/**
 * Verify a published release's tag and required ZIPs.

 * The workflow provides RELEASE_TAG, GH_TOKEN, and GITHUB_OUTPUT.
 * Uses Node's built-in TypeScript support, git, and gh; no dependencies to install.
 * Writes the validated release_tag and commit SHA as GitHub Actions step outputs.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import { readCommandOutput } from '../shared/read-command-output.ts';
import { releaseTagRegex } from '../shared/version-regex.ts';

type PublishedRelease = {
  assets: { name: string }[];
  isDraft: boolean;
  isPrerelease: boolean;
};

type PackageMetadata = {
  name: string;
  version: string;
};

const releaseTag = process.env.RELEASE_TAG ?? '';
const githubOutputFile = process.env.GITHUB_OUTPUT;

// Require a stable release tag and a destination for the validated step outputs.
assert.match(releaseTag, releaseTagRegex);
assert.ok(githubOutputFile, 'GITHUB_OUTPUT is required to pass validation results');

// Resolve commit SHA from the release tag version and check that the tagged commit exists in master.
const commitSha = readCommandOutput('git', ['rev-parse', `${releaseTag}^{commit}`]).trim();
execFileSync('git', ['merge-base', '--is-ancestor', commitSha, 'origin/master']);

// Obtain release data from GitHub (draft status, prerelease status, assets attached).
const release: PublishedRelease = JSON.parse(
  readCommandOutput('gh', ['release', 'view', releaseTag, '--json', 'isDraft,isPrerelease,assets']),
);

// Reject drafts and prereleases, including manual submission requests.
assert.equal(release.isDraft, false, 'Release must be published');
assert.equal(release.isPrerelease, false, 'Prereleases cannot be submitted');

// Require both browser ZIPs and the Firefox source ZIP before submission.
const packageData: PackageMetadata = JSON.parse(readCommandOutput('git', ['show', `${releaseTag}:package.json`]));
const assetPrefix = `${packageData.name}-${packageData.version}`;

for (const suffix of ['chrome.zip', 'firefox.zip', 'sources.zip']) {
  const assetName = `${assetPrefix}-${suffix}`;
  assert.ok(
    release.assets.some((asset) => asset.name === assetName),
    `Missing release asset: ${assetName}`,
  );
}

// Append validated `release_tag` and `sha` to the GITHUB_OUTPUT.
appendFileSync(githubOutputFile, `release_tag=${releaseTag}\nsha=${commitSha}\n`);
