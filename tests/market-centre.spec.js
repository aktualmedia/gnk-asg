const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/trzista/', heading: 'Stablecoini, burze i digitalna imovina' },
  { path: '/en/markets/', heading: 'Stablecoins, exchanges and digital assets' }
];

for (const route of routes) {
  test(`${route.path} prikazuje tržišni centar i 3D vizualizaciju`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText(route.heading, { timeout: 15000 });
    await expect(page.locator('#marketCentreCoins')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#stablecoinRows')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#exchangeRows')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#indexCards')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#briefTitle')).toBeVisible({ timeout: 15000 });
    const canvas = page.locator('#marketConstellation');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.48);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.64, box.y + box.height * 0.38, { steps: 7 });
    await page.mouse.up();
    await expect(page.locator('#constellationDetail')).toBeVisible({ timeout: 15000 });
  });
}

const homepageRoutes = [
  { path: '/', panelTitle: 'Globalna mreža u jednom brendiranom kadru' },
  { path: '/en/', panelTitle: 'Global network in one branded frame' }
];

for (const route of homepageRoutes) {
  test(`${route.path} prikazuje činjenični vizualni panel između mreže i lokacijskog konteksta`, async ({ page, isMobile }) => {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    if (isMobile) {
      const toggle = page.locator('#menuToggle');
      await expect(toggle).toBeVisible({ timeout: 15000 });
      await toggle.click();
    }
    await expect(page.locator('#global-network')).toBeVisible({ timeout: 15000 });
    const panel = page.locator('#networkOverviewVisual');
    await expect(panel).toBeVisible({ timeout: 15000 });
    await expect(panel.locator('h3')).toContainText(route.panelTitle);
    await expect(panel.locator('.network-overview-kpis strong').nth(0)).toContainText('33');
    await expect(panel.locator('.network-overview-kpis strong').nth(1)).toContainText('+12');
    await expect(panel.locator('.network-overview-kpis strong').nth(2)).toContainText('45');
    await expect.poll(async () => page.evaluate(() => {
      const dock = document.getElementById('networkLocationContext');
      if (!dock) return false;
      const ids = Array.from(dock.children).map(node => node.id);
      return ids.indexOf('networkOverviewVisual') !== -1 &&
        ids.indexOf('googleLocationMap') > ids.indexOf('networkOverviewVisual') &&
        ids.indexOf('locationWeatherPanel') > ids.indexOf('googleLocationMap');
    }), { timeout: 15000 }).toBe(true);
  });
}

test('početna stranica povezuje Market Intelligence i korporativni 3D globus', async ({ page, isMobile }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  if (isMobile) {
    const toggle = page.locator('#menuToggle');
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await toggle.click();
  }
  await expect(page.locator('a[href$="/trzista/"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#global-network')).toBeVisible({ timeout: 15000 });
});