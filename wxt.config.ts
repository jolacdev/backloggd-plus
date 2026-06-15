import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage'],
    browser_specific_settings: {
      // `data_collection_permissions` is required by Firefox but not yet in WXT's manifest types.
      gecko: {
        id: 'backloggd-plus@jolacdev',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
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
