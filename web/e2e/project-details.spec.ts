import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const slugs = ['captrace', 'done', 'privymeet', 'productivity-suite', 'risktrace', 'risk-miner'];
test.use({ reducedMotion: 'reduce' });

test('all project details fit phone and tablet widths without colliding sections', async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 640, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const slug of slugs) {
      await page.goto(`/projects/${slug}`);
      await page.evaluate(() => document.fonts.ready);
      const issues = await page.evaluate(() => {
        const failures: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth) failures.push('Page overflow');
        for (const node of document.querySelectorAll<HTMLElement>(
          'main h1, main h2, main p, main img, main figcaption, .back-link, .technology-list li',
        )) {
          const rect = node.getBoundingClientRect();
          if (
            rect.left < -1 ||
            rect.right > innerWidth + 1 ||
            node.scrollWidth > node.clientWidth + 1
          )
            failures.push(`Clipped: ${node.textContent || node.getAttribute('alt')}`);
        }
        const checkSeparation = (first: Element, second: Element, gap: number, message: string) => {
          const a = first.getBoundingClientRect();
          const b = second.getBoundingClientRect();
          if (a.bottom + gap > b.top && a.right + gap > b.left) failures.push(message);
        };
        const hero = document.querySelector('.risk-hero');
        if (hero) {
          checkSeparation(
            hero.querySelector('.risk-heading')!,
            hero.querySelector('img')!,
            16,
            'Risk artwork touches the heading',
          );
          checkSeparation(
            hero,
            document.querySelector('.risk-lower')!,
            28,
            'Hero touches capabilities',
          );
          const capabilities = document.querySelector('.capabilities')!;
          const screens = document.querySelector('.risk-screens')!;
          checkSeparation(capabilities, screens, 28, 'Capabilities touch screenshots');
          for (const feature of document.querySelectorAll('.capability')) {
            checkSeparation(
              feature.querySelector('svg')!,
              feature.querySelector('h2')!,
              6,
              'Capability icon touches heading',
            );
            checkSeparation(
              feature.querySelector('h2')!,
              feature.querySelector('p')!,
              8,
              'Capability heading touches description',
            );
          }
          const sections = document.querySelectorAll('.risk-aside > section');
          checkSeparation(sections[0]!, sections[1]!, 24, 'Technology touches team');
        } else {
          const layout = document.querySelector('.generic-layout')!;
          checkSeparation(
            layout.firstElementChild!,
            layout.querySelector('figure')!,
            20,
            'Project description touches artwork',
          );
        }
        for (const link of document.querySelectorAll('.back-link')) {
          if (link.getBoundingClientRect().height < 44) failures.push('Return target is too small');
        }
        return failures;
      });
      expect(issues, `${slug} at ${width}px`).toEqual([]);
      if (testInfo.project.name === 'chromium' && (width === 390 || slug === 'risk-miner'))
        await page.screenshot({
          path: testInfo.outputPath(`${slug}-${width}.png`),
          fullPage: true,
        });
    }
  }
});

test('both return links work on direct entry and restore the matching project card', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of slugs) {
    for (const position of ['first', 'last'] as const) {
      await page.goto(`/projects/${slug}`);
      const links = page.getByRole('main').getByRole('link', { name: 'Back to projects' });
      await expect(links).toHaveCount(2);
      await links[position]().click();
      await expect(page).toHaveURL(`/projects#project-${slug}`);
      const card = page.locator(`#project-${slug}`);
      await expect(card).toBeFocused();
      const bounds = await card.boundingBox();
      const header = await page.locator('.site-header').boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(header!.height);
      expect(bounds!.y).toBeLessThan(800);
      await page.goBack();
      await expect(page).toHaveURL(`/projects/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  }
});

test('detail pages keep accessible content and navigation on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const slug of slugs) {
    await page.goto(`/projects/${slug}`);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations, slug).toEqual([]);
  }
});
