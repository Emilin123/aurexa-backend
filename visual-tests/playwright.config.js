const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 45_000,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixels: 250,
    },
  },
  use: {
    baseURL: process.env.AUREXA_URL || 'https://aurexa-v3-frontend.onrender.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'android-chrome',
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
      },
    },
  ],
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
});
