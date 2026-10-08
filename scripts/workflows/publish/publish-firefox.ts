/* eslint-disable no-console */

/**
 * Submit a published release's Firefox ZIP, sources, and notes to AMO.
 * The workflow provides RELEASE_TAG, DRY_RUN, GH_TOKEN, and AMO credentials.
 * DRY_RUN=true checks access without uploads; submitted versions still need Mozilla review.
 */
import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { submit } from 'publish-browser-extension';

import { readCommandOutput } from '../shared/read-command-output.ts';
import { releaseTagRegex } from '../shared/version-regex.ts';

type PackageMetadata = {
  name: string;
  version: string;
};

type FirefoxManifest = {
  browser_specific_settings: { gecko: { id: string } };
  version: string;
};

// Require a stable vX.Y.Z release tag.
const releaseTag = process.env.RELEASE_TAG ?? '';
assert.match(releaseTag, releaseTagRegex);

// Read package.json from the release tag, even if master has advanced.
const packageData: PackageMetadata = JSON.parse(readCommandOutput('git', ['show', `${releaseTag}:package.json`]));

// Ensure the tag matches the version recorded in its commit.
assert.equal(releaseTag, `v${packageData.version}`, 'Tag and package version differ');

// Require the matching source ZIP for Mozilla review.
const assetPrefix = `release-assets/${packageData.name}-${packageData.version}`;
const firefoxZipPath = `${assetPrefix}-firefox.zip`;
const sourcesZipPath = `${assetPrefix}-sources.zip`;
assert.ok(existsSync(sourcesZipPath), 'Firefox source ZIP is missing');

// Verify the downloaded package version and preserve the existing Firefox listing ID.
const firefoxManifestJson = readCommandOutput('unzip', ['-p', firefoxZipPath, 'manifest.json']);
const firefoxManifest: FirefoxManifest = JSON.parse(firefoxManifestJson);

assert.equal(firefoxManifest.version, packageData.version);
assert.equal(firefoxManifest.browser_specific_settings.gecko.id, 'backloggd-plus@jolacdev');

// Reuse the GitHub Release body as the Firefox version notes.
const releaseNotes = readCommandOutput('gh', ['release', 'view', releaseTag, '--json', 'body', '--jq', '.body']);
const amoMetadataFile = 'release-assets/amo-metadata.json';

// Write user release notes and reviewer guidance in AMO JSON format.
writeFileSync(
  amoMetadataFile,
  JSON.stringify({
    version: {
      release_notes: { 'en-US': releaseNotes },
      // TODO: Update if the extension gains new features.
      approval_notes:
        'Build instructions are in docs/FIREFOX_REVIEWER_INSTRUCTIONS.md. Sign in to your own Backloggd account, open Settings > Data, and use Export to download CSV and JSON. Preferences are in the extension popup.',
    },
  }),
);

// Submit the verified package and sources; dry runs only check access to AMO.
const isDryRun = process.env.DRY_RUN === 'true';
const submissionResults = await submit({
  dryRun: isDryRun, // true checks access; false submits the release.
  firefox: {
    extensionId: firefoxManifest.browser_specific_settings.gecko.id,
    amoMetadataFile, // Metadata file containing user notes and reviewer guidance.
    channel: 'listed', // Publish through the public Firefox Add-ons Store.
    compatibility: ['firefox'], // Desktop Firefox.
    jwtIssuer: process.env.FIREFOX_JWT_ISSUER,
    jwtSecret: process.env.FIREFOX_JWT_SECRET,
    sourcesZip: sourcesZipPath,
    zip: firefoxZipPath,
  },
});

// Fail the job on errors; check AMO before retrying because an upload may already exist.
assert.ok(submissionResults.firefox?.success, 'Firefox submission failed. Check AMO before retrying.');

const statusMessage = isDryRun
  ? 'credentials checked; nothing uploaded'
  : 'submitted to AMO; check the dashboard for review status';
console.log(`${releaseTag}: ${statusMessage}`);
