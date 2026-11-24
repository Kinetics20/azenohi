import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('mobile cards and timeline keep their text, art and footer inside the available width', async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 600, 640, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['team', 'projects', 'journey']) {
      await page.goto(`/${route}`);
      await page.evaluate(() => document.fonts.ready);
      const issues = await page.evaluate(() => {
        const failures: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth) failures.push('Page overflow');
        for (const node of document.querySelectorAll<HTMLElement>(
          'main h1, main h2, .person-label, .project-copy p, .project-footer, .milestones p',
        )) {
          const rect = node.getBoundingClientRect();
          if (
            rect.left < -1 ||
            rect.right > innerWidth + 1 ||
            node.scrollWidth > node.clientWidth + 1
          )
            failures.push(`Clipped: ${node.textContent}`);
        }
        for (const card of document.querySelectorAll('.person-card')) {
          const name = card.querySelector('h2')!.getBoundingClientRect();
          const icon = card.querySelector('svg')!.getBoundingClientRect();
          if (name.right + 4 > icon.left) failures.push('Name touches its icon');
        }
        for (const card of document.querySelectorAll('.project-card')) {
          const image = card.querySelector('img')!.getBoundingClientRect();
          const copy = card.querySelector('.project-copy')!.getBoundingClientRect();
          const event = card
            .querySelector('.project-footer > span:nth-child(2)')!
            .getBoundingClientRect();
          const year = card.querySelector('time')!.getBoundingClientRect();
          const footer = card.querySelector('.project-footer')!.getBoundingClientRect();
          if (image.bottom > copy.top + 1) failures.push('Illustration overlaps project text');
          if (copy.bottom > footer.top + 1) failures.push('Copy overlaps project footer');
          if (event.right + 4 > year.left) failures.push('Event overlaps year');
        }
        let previousBottom = 0;
        for (const milestone of document.querySelectorAll('.milestones li')) {
          const rect = milestone.getBoundingClientRect();
          const image = milestone.querySelector('img')!.getBoundingClientRect();
          const copy = milestone.querySelector('div')!.getBoundingClientRect();
          if (rect.top < previousBottom + 12) failures.push('Timeline rows touch');
          if (image.right + 8 > copy.left) failures.push('Timeline image overlaps copy');
          previousBottom = rect.bottom;
        }
        const title = document.querySelector('.page-title')!.getBoundingClientRect();
        const content = document
          .querySelector('.team-grid, .projects-grid, .milestones')!
          .getBoundingClientRect();
        if (content.top < title.bottom + 24) failures.push('Content touches the title');
        return failures;
      });
      expect(issues, `${route} at ${width}px`).toEqual([]);
      if (testInfo.project.name === 'chromium' && (width === 320 || width === 390 || width === 768))
        await page.screenshot({
          path: testInfo.outputPath(`${route}-${width}.png`),
          fullPage: true,
        });
    }
  }
});

test('mobile navigation stays reachable on long pages and closes without leaving hidden focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const toggle = page.getByRole('button', { name: 'Open menu' });
  await toggle.click();
  const navigation = page.getByRole('navigation');
  const menu = await navigation.boundingBox();
  expect(menu!.x).toBeGreaterThanOrEqual(0);
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(390);
  expect(menu!.y + menu!.height).toBeLessThanOrEqual(844);
  for (const link of await navigation.getByRole('link').all())
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await navigation.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.mouse.click(5, 430);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await navigation.getByRole('link', { name: 'Journey' }).click();
  await expect(page).toHaveURL(/\/journey$/);
  await expect(page.getByRole('main')).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
