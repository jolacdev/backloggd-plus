import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

// NOTE: Mock Considerations - https://wxt.dev/guide/essentials/unit-testing
export default defineConfig({
  plugins: [WxtVitest()],

  test: {
    include: ['**/__tests__/**/*.ts', '**/*.{test,spec}.ts'],
    mockReset: true,
    restoreMocks: true,
  },
});
