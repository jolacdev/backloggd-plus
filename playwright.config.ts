import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: 0,
  testDir: './e2e',
  use: { trace: 'retain-on-failure' },
});
