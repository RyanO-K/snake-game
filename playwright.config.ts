import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 10_000,
  expect: { timeout: 3_000 },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
