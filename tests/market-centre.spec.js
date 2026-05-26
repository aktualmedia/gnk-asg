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
  { path: '/', panelTitle: 'Globalna mreža: 33 postojeća društva i +12 planiranih lokacija' },
  { path: '/en/', panelTitle: 'Global network: 33 existing companies and +12 planned locations' }
];

for (const route of homepageRoutes) {
  test(`${route.path} prikazuje globus s kompaktnim demografskim kontekstom neposredno ispod prikaza`, async ({ page, isMobile }) => {
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
      const layout = document.querySelector('#global-network .network-layout');
      const dock = document.getElementById('networkLocationContext');
      const facts = dock && dock.querySelector('.network-sidebar .location-insights');
      const visual = layout && (layout.querySelector('.globe-panel') || layout.querySelector('.network-canvas'));
      if (!layout || !dock || !facts || !visual) return false;
      const visualBottom = visual.getBoundingClientRect().bottom;
      const dockTop = dock.getBoundingClientRect().top;
      return dockTop >= visualBottom - 4 && dockTop - visualBottom < 24 &&
        !dock.querySelector('#googleLocationMap') && !dock.querySelector('#locationWeatherPanel');
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
