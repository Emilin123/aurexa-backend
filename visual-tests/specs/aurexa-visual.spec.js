const { test, expect } = require('@playwright/test');

test('AUREXA auth screen — Android visual evidence', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 393, height: 937 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toContainText('AUREXA');
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('NaN');
  await page.screenshot({
    path: testInfo.outputPath('aurexa-auth-android.png'),
    fullPage: true,
  });
});
