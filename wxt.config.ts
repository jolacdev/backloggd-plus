/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, InlineConfig, UserConfig } from 'wxt';

// Extends Vite’s UserConfig type to include Vitest-specific options (`test` field).
interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  plugins: [react(), tailwindcss()],
  build: {
    assetsDir: '',
    emptyOutDir: true,
    outDir: '../frontend_dist',
    sourcemap: false,
  },
  // NOTE: Module resolution at build and runtime.
  // resolve: {
  //   alias: {
  //     "@components": path.resolve(__dirname, "./src/shared/components"),
  //     "@constants": path.resolve(__dirname, "./src/shared/constants.ts"),
  //     "@features": path.resolve(__dirname, "./src/features"),
  //     "@hooks": path.resolve(__dirname, "./src/shared/hooks"),
  //     "@icons": path.resolve(__dirname, "./src/shared/icons"),
  //     "@screens": path.resolve(__dirname, "./src/screens"),
  //     "@store": path.resolve(__dirname, "./src/store"),
  //     "@utils": path.resolve(__dirname, "./src/shared/utils"),
  //     types: path.resolve(__dirname, "./src/types"),
  //   },
  // },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom', // Sets the test environment to `jsdom` to simulate a browser.
    globals: true, // Enables global test APIs like `describe`, `it`, etc.
    setupFiles: './setupTests.ts', // Specifies a setup file to run before tests.
  },
} as VitestConfigExport);
