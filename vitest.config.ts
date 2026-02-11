import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

// NOTE: Mock Considerations - https://wxt.dev/guide/essentials/unit-testing
export default defineConfig({
  plugins: [WxtVitest()],

  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['vitest.setup.ts'],
  },
});
