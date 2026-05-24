const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/trzista/', heading: 'Stablecoini, burze i digitalna imovina' },
  { path: '/en/markets/', heading: 'Stablecoins, exchanges and digital assets' }
];

for (const route of routes) {
  test(`${route.path} prikazuje tržišni centar i 3D vizualizaciju`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(route.heading);
    await expect(page.locator('#marketCentreCoins')).toBeVisible();
    await expect(page.locator('#stablecoinRows')).toBeVisible();
    await expect(page.locator('#exchangeRows')).toBeVisible();
    await expect(page.locator('#indexCards')).toBeVisible();
    await expect(page.locator('#briefTitle')).toBeVisible();
    const canvas = page.locator('#marketConstellation');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.48);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.64, box.y + box.height * 0.38, { steps: 7 });
    await page.mouse.up();
    await expect(page.locator('#constellationDetail')).toBeVisible();
  });
}

test('početna stranica povezuje Market Intelligence i korporativni 3D globus', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('a[href="/gnk-asg/trzista/"]')).toBeVisible();
  await expect(page.locator('#global-network')).toBeVisible();
});
