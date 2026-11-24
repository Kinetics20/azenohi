import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
const routes = [
  ['home', '/'],
  ['team', '/team'],
  ['projects', '/projects'],
  ['journey', '/journey'],
  ['risk-miner', '/projects/risk-miner'],
] as const;
test.use({ reducedMotion: 'reduce' });
test('all core routes refresh, remain accessible and load their images', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [, path] of routes) {
    await page.goto(path);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page
        .locator('img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations)).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test('navigation, project order, details, browser history and 404', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  const cards = page.locator('.project-card');
  await expect(cards).toHaveCount(6);
  await expect(cards.nth(5)).toContainText('Risk Miner');
  await cards.nth(5).click();
  await expect(page).toHaveURL(/\/projects\/risk-miner$/);
  await expect(page.getByRole('heading', { name: 'Detect' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Projects', exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/risk-miner$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/projects$/);
  for (let i = 0; i < 5; i++) {
    await cards.nth(i).click();
    await expect(
      page.getByText('Project overview from the AzenoHI portfolio concept.'),
    ).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Projects', exact: true }).click();
  }
  await page.getByRole('link', { name: 'AzenoHI.dev — Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/missing');
  await page.getByRole('link', { name: 'Return to Home' }).click();
  await expect(page).toHaveURL(/\/$/);
});
test('keyboard skip link and mobile menu Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const toggle = page.getByRole('button', { name: /menu/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.getByRole('navigation').getByRole('link', { name: 'Team' }).click();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});
test('responsive layouts at all acceptance widths', async ({ page }, testInfo) => {
  for (const width of [360, 390, 768, 1440, 1672]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 941 });
    for (const [name, path] of routes) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${name} at ${width}`,
      ).toBe(true);
      if (testInfo.project.name === 'chromium')
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${width}.png`),
          fullPage: true,
        });
    }
  }
});
test('no API, external runtime requests or 3D chunk in reduced motion', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('[data-scene]')).toHaveAttribute('data-scene', 'reduced');
  await page.getByRole('link', { name: 'AzenoHI.dev — Home' }).click();
  expect(
    requests.filter((url) => /SpaceCanvas|\/api\/|localhost:800|http.*ollama/.test(url)),
  ).toEqual([]);
  expect(requests.every((url) => url.startsWith('http://127.0.0.1:4173/'))).toBe(true);
});
