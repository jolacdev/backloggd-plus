# Firefox source review

Toolkittd is built with WXT, React, TypeScript, and Tailwind. The submitted sources ZIP contains the files required to reproduce the unsigned Firefox package.

## Build locally

CI uses Ubuntu 24.04 (x64), Node **24.21.0**, and pnpm **12.3.4**. Install those versions, extract the sources ZIP, and run from its root:

```bash
npm install --global pnpm@12.3.4
pnpm install --frozen-lockfile
pnpm build:firefox
```

Compare `.output/firefox-mv2/` with the unpacked submitted Firefox ZIP. Mozilla signatures are added later and are not part of this comparison. No environment variables, secrets, private packages, or external build services are required.

`pnpm zip:firefox` also creates the extension and source ZIPs. Release CI runs `pnpm check:firefox-sources` after packaging to verify that an extracted source archive builds identical files; this check requires `unzip`.

## Test the feature

Temporarily load `.output/firefox-mv2/manifest.json` from Firefox's `about:debugging` > **This Firefox** > **Load Temporary Add-on**. Sign in to your own Backloggd account and open **Settings > Data** (`https://backloggd.com/settings/data/`). Click **Export**, choose statuses, and confirm that CSV and JSON files download. The extension popup configures the default statuses.

The feature reads game collection pages and game logs from Backloggd using the user's existing session. It exports files locally and saves preferences in extension-local storage. It has no backend, analytics, or third-party data destination.
