const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // Directory where test files are located (current e2e folder)
  testDir: '.',

  // Pattern to match test files
  testMatch: '*.spec.js',

  // Run tests sequentially instead of in parallel
  fullyParallel: false,

  // Number of worker processes to use for running tests
  workers: 1,

  // Number of retries on test failure
  retries: 1,

  // Reporter for test results (list format shows test names and status)
  reporter: 'list',

  // Global settings for all tests
  use: {
    // Base URL for navigation (app runs on localhost:3001)
    baseURL: 'http://localhost:3001',

    // Show browser window during tests (not headless)
    headless: false,

    // Collect traces on first retry for debugging
    trace: 'on-first-retry',
  },

  // Browser configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});