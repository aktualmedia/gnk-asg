const { test, expect } = require('@playwright/test');

test('Intelligence Desk answers from verified portal datasets', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#deskAiBadge')).toBeVisible({ timeout: 10000 });
  await page.locator('#deskInput').fill('Koliko stablecoina prati portal?');
  await page.locator('#deskForm button[type="submit"]').click();
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('Stablecoin Monitor');
  await expect(page.locator('#deskTranscript .desk-source a').last()).toContainText('Market Intelligence');
});

test('Connected AI mode is safe before endpoint activation for broader questions', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#deskAiBadge')).toContainText('AI veza pripremljena', { timeout: 10000 });
  await page.locator('.desk-switch button[data-mode="ai"]').click();
  await page.locator('#deskInput').fill('Objasni globalne promjene u potrošačkim navikama.');
  await page.locator('#deskForm button[type="submit"]').click();
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('nije aktivan');
});

test('Connected AI mode refuses sensitive content locally', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#deskAiBadge')).toBeVisible({ timeout: 10000 });
  await page.locator('.desk-switch button[data-mode="ai"]').click();
  await page.locator('#deskInput').fill('Provjeri moj IBAN i porezni ugovor.');
  await page.locator('#deskForm button[type="submit"]').click();
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('nije poslan');
});
