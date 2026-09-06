const { test, expect } = require('@playwright/test');

test('AUREXA auth screen — Android visual baseline', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toHaveScreenshot('aurexa-auth-android.png', {
    fullPage: true,
  });
});
