const { test, expect } = require('@playwright/test');

async function submitDeskForm(page) {
  await page.locator('#deskInput').press('Enter');
}

test('Intelligence Desk answers from verified portal datasets', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#deskAiBadge')).toBeVisible({ timeout: 10000 });
  await page.locator('#deskInput').fill('Koliko stablecoina prati portal?');
  await submitDeskForm(page);
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('Stablecoin Monitor');
  await expect(page.locator('#deskTranscript .desk-source a').last()).toContainText('Market Intelligence');
});

test('Connected AI mode uses active Puter Gemini adapter for broader questions', async ({ page }) => {
  await page.addInitScript(() => {
    window.puter = {
      ai: {
        chat: async (prompt, options) => {
          window.__puterPrompt = prompt;
          window.__puterModel = options.model;
          return { message: { content: 'Vanjski AI testni odgovor za šire javno pitanje.' } };
        }
      }
    };
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#deskAiBadge')).toContainText('AI aktivan', { timeout: 10000 });
  await page.locator('.desk-switch button[data-mode="ai"]').click();
  await expect(page.locator('.desk-switch button[data-mode="ai"]')).toHaveClass(/active/);
  await page.locator('#deskInput').fill('Objasni globalne promjene u potrošačkim navikama.');
  await submitDeskForm(page);
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('Vanjski AI testni odgovor');
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('Puter.js / Google Gemini');
  expect(await page.evaluate(() => window.__puterModel)).toBe('gemini-2.5-flash-lite');
});

test('Connected AI mode refuses sensitive content locally before provider call', async ({ page }) => {
  await page.addInitScript(() => {
    window.__puterCalls = 0;
    window.puter = { ai: { chat: async () => { window.__puterCalls += 1; return 'ne smije se pozvati'; } } };
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#deskAiBadge')).toContainText('AI aktivan', { timeout: 10000 });
  await page.locator('.desk-switch button[data-mode="ai"]').click();
  await expect(page.locator('.desk-switch button[data-mode="ai"]')).toHaveClass(/active/);
  await page.locator('#deskInput').fill('Provjeri moj IBAN i porezni ugovor.');
  await submitDeskForm(page);
  await expect(page.locator('#deskTranscript .desk-message.bot').last()).toContainText('nije poslan');
  expect(await page.evaluate(() => window.__puterCalls)).toBe(0);
});