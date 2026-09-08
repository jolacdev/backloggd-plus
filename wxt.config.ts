import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'wxt';

const HLTB_HOST_PERMISSION = 'https://howlongtobeat.com/*';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  // NOTE: WXT targets MV3 for Chromium but MV2 for Firefox, and the two need different APIs
  // to set the `Referer` header HowLongToBeat requires. See `background/index.ts`.
  manifest: ({ manifestVersion }) => ({
    browser_specific_settings: {
      gecko: {
        id: 'backloggd-plus@jolacdev',
        // `websiteContent`: game titles read from the Backloggd page are sent to
        // HowLongToBeat to look up completion times. Nothing else leaves the browser.
        // NOTE: `data_collection_permissions` is required by Firefox.
        data_collection_permissions: {
          required: ['websiteContent'],
        },
      },
    },
    permissions: [
      'storage',
      ...(manifestVersion === 3
        ? // `WithHostAccess` limits rules to hosts already granted below, which is a
          // narrower ask than the unrestricted `declarativeNetRequest` permission.
          ['declarativeNetRequestWithHostAccess']
        : // MV2 has no declarativeNetRequest; host access lives in `permissions` too.
          ['webRequest', 'webRequestBlocking', HLTB_HOST_PERMISSION]),
    ],
    ...(manifestVersion === 3
      ? { host_permissions: [HLTB_HOST_PERMISSION] }
      : {}),
  }),

  vite: () => ({
    plugins: [tailwindcss(), tsconfigPaths()],
    // Manual mode resolution for build and runtime is not needed as it is handled by by vite-tsconfig-paths.
    // Read its docs to know the limitations (e.g. CSS imports).
    // resolve: { alias: { '@background': path.resolve(__dirname, './entrypoints/background') } },
    server: {
      port: 3000,
    },
  }),
});
