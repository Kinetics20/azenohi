import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Real software-WebGL verification runs in Chromium; other engines verify fallback and layout.',
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});
test('real WebGL changes Earth and station pixels independently, pauses and survives context loss', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('[data-scene]')).toHaveAttribute('data-scene', 'ready');
  const station = { x: 960, y: 85, width: 300, height: 200 };
  const earth = { x: 650, y: 400, width: 90, height: 80 };
  const stationBefore = await page.screenshot({ clip: station });
  const earthBefore = await page.screenshot({ clip: earth });
  await page.waitForTimeout(700);
  expect((await page.screenshot({ clip: station })).equals(stationBefore)).toBe(false);
  expect((await page.screenshot({ clip: earth })).equals(earthBefore)).toBe(false);
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await page.waitForTimeout(150);
  const paused = await page.locator('canvas').screenshot();
  await page.waitForTimeout(400);
  expect((await page.locator('canvas').screenshot()).equals(paused)).toBe(true);
  await page.getByRole('button', { name: 'Resume animation' }).click();
  await page.waitForTimeout(400);
  expect((await page.locator('canvas').screenshot()).equals(paused)).toBe(false);
  await page.locator('canvas').evaluate((canvas) => {
    if (canvas instanceof HTMLCanvasElement)
      canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.locator('[data-scene]')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
});
test('missing texture gracefully restores the poster', async ({ page }) => {
  await page.route('**/textures/earth-day.webp', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-scene]')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Team', exact: true }).click();
  await expect(page).toHaveURL(/\/team$/);
});
test('WebGL disabled leaves working content and navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
      configurable: true,
    });
  });
  await page.goto('/');
  await expect(page.locator('[data-scene]')).toHaveAttribute('data-scene', 'unsupported');
  await expect(page.locator('.scene-poster')).toBeVisible();
  await page.getByRole('link', { name: 'Journey', exact: true }).click();
  await expect(page).toHaveURL(/\/journey$/);
});
test('slow scene assets never block navigation', async ({ page }) => {
  await page.route('**/textures/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue().catch(() => undefined);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Team', exact: true }).click();
  await expect(page).toHaveURL(/\/team$/);
});
