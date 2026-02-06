/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

// TODO: in case of TS error check if there are multiple vite versions installed:
// https://github.com/sveltejs/kit/issues/13102

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    // TODO: Check build config
    // build: {
    //   assetsDir: '',
    //   emptyOutDir: true,
    //   outDir: '../frontend_dist',
    //   sourcemap: false,
    // },

    // NOTE: Module resolution at build and runtime.
    resolve: {
      alias: {
        '@background': path.resolve(__dirname, './entrypoints/background'),
        '@content': path.resolve(__dirname, './entrypoints/backloggd.content'),
        '@globalShared': path.resolve(__dirname, './entrypoints/shared'),
        '@popup': path.resolve(__dirname, './entrypoints/popup'),
      },
    },
    server: {
      port: 3000,
    },
  }),
});
