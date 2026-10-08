import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Include hidden build configuration for AMO rebuilds; exclude downloaded release assets.
  zip: {
    excludeSources: ['release-assets/**'], // Exclude release packages downloaded by GitHub workflows.
    includeSources: ['.node-version', '.gitignore', '.prettierrc.ts'], // Include hidden files needed to reproduce the build.
  },
  manifest: ({ browser, manifestVersion }) => ({
    name: 'Toolkittd',
    permissions: [
      'storage',
      ...(manifestVersion === 3
        ? ['declarativeNetRequestWithHostAccess']
        : ['webRequest', 'webRequestBlocking', 'https://howlongtobeat.com/*']),
    ],
    ...(manifestVersion === 3 && {
      host_permissions: ['https://howlongtobeat.com/*'],
    }),
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // Firefox ID should be preserved for existing listings.
          id: 'backloggd-plus@jolacdev',
          // `data_collection_permissions` is required by Firefox but not yet in WXT's manifest types.
          data_collection_permissions: {
            required: ['websiteContent'],
          },
        },
      },
    }),
    description:
      'Enhance Backloggd with game collection export and HowLongToBeat completion estimates.',
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
