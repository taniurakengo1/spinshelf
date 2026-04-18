import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  outputDir: './evidence',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'off', // We use screencapture instead
  },
  projects: [
    {
      name: 'spinshelf-e2e',
      testDir: './tests',
    },
  ],
});
