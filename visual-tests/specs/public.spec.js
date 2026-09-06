const { test, expect } = require('@playwright/test');

test('AUREXA public mobile screen — capture evidence', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.screenshot({
    path: testInfo.outputPath('aurexa-public-mobile.png'),
    fullPage: true,
  });
  await expect(page.locator('body')).toContainText('AUREXA');
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('NaN');
});
