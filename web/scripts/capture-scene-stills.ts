import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Capture only the application's transparent WebGL layer, never its HTML interface.
// Regenerate after changing the scene model, materials, lighting or camera.
const destination = fileURLToPath(new URL('../public/images/scene/', import.meta.url));
const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 1672, height: 941 },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => console.error(error.message));
    // Keep the full design-space canvas while choosing the mobile model/maps.
    await page.addInitScript((compact) => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const media = original(query);
        if (query === '(max-width: 600px)' || query === '(max-width: 700px)')
          Object.defineProperty(media, 'matches', { value: compact });
        return media;
      };
    }, mobile);
    let releaseTextures!: () => void;
    const textures = new Promise<void>((resolve) => {
      releaseTextures = resolve;
    });
    await page.route('**/textures/**', async (route) => {
      await textures;
      await route.continue();
    });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Pause animation' }).click();
    releaseTextures();
    await page.locator('[data-scene="ready"]').waitFor();
    await page.addStyleTag({
      content: `
        :root, body, .home-page { background: transparent !important; }
        body * { visibility: hidden !important; }
        canvas { visibility: visible !important; }
        .scene-live { opacity: 1 !important; transition: none !important; }
      `,
    });
    const png = await page.locator('canvas').screenshot({ omitBackground: true });
    const webp = await page.evaluate(async (encoded) => {
      const image = new Image();
      image.src = `data:image/png;base64,${encoded}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      return canvas.toDataURL('image/webp', 0.94).split(',')[1]!;
    }, png.toString('base64'));
    const filename = `still-${mobile ? 'mobile' : 'desktop'}.webp`;
    await writeFile(destination + filename, Buffer.from(webp, 'base64'));
    console.log(`Captured ${filename} at 1672×941 (RGBA)`);
    await context.close();
  }
} finally {
  await browser.close();
}
