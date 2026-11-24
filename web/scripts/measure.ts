import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cpus, platform, release } from 'node:os';
interface Metrics {
  lcp: number;
  cls: number;
  rafFPS: number;
  p95FrameMs: number;
  transferBytes: number;
  requests: number;
}
interface Profile {
  name: string;
  width: number;
  height: number;
  dpr: number;
  motion: 'no-preference' | 'reduce';
}
declare global {
  interface Window {
    azenohiMetrics: { lcp: number; cls: number };
  }
}
const root = fileURLToPath(new URL('../../', import.meta.url));
const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://127.0.0.1:4173';
await mkdir(root + 'docs/qa', { recursive: true });
await mkdir(root + 'docs/assets/screenshots', { recursive: true });
await mkdir(root + 'docs/assets/recordings', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const profiles: Profile[] = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1, motion: 'no-preference' },
  { name: 'mobile-emulation', width: 390, height: 844, dpr: 2, motion: 'no-preference' },
  { name: 'reduced', width: 1440, height: 900, dpr: 1, motion: 'reduce' },
];
const measurements: (Profile & Metrics & { cache: string; renderer: string })[] = [];
for (const profile of profiles) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: profile.dpr,
    reducedMotion: profile.motion,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.azenohiMetrics = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const item of list.getEntries()) window.azenohiMetrics.lcp = item.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const item of list.getEntries())
        if (
          'hadRecentInput' in item &&
          !item.hadRecentInput &&
          'value' in item &&
          typeof item.value === 'number'
        )
          window.azenohiMetrics.cls += item.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(baseURL);
  await page
    .locator(`[data-scene="${profile.motion === 'reduce' ? 'reduced' : 'ready'}"]`)
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  const renderer =
    profile.motion === 'reduce'
      ? 'No WebGL requested'
      : await page.locator('canvas').evaluate((canvas) => {
          if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Expected canvas');
          const gl = canvas.getContext('webgl2');
          const info = gl?.getExtension('WEBGL_debug_renderer_info');
          if (!gl || !info) return 'Renderer unavailable';
          const value: unknown = gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
          return String(value);
        });
  const stats = await page.evaluate(
    () =>
      new Promise<Metrics>((resolve) => {
        let frames = 0;
        let start: number | undefined;
        let previous: number | undefined;
        const intervals: number[] = [];
        function tick(now: number) {
          start ??= now;
          if (previous !== undefined) intervals.push(now - previous);
          previous = now;
          frames++;
          if (now - start >= 4000) {
            const resources = performance
              .getEntriesByType('resource')
              .filter(
                (item): item is PerformanceResourceTiming =>
                  item instanceof PerformanceResourceTiming,
              );
            resolve({
              ...window.azenohiMetrics,
              rafFPS: Math.round(((frames - 1) * 10000) / (now - start)) / 10,
              p95FrameMs: intervals.toSorted((a, b) => a - b)[Math.floor(intervals.length * 0.95)]!,
              transferBytes: resources.reduce((sum, item) => sum + item.transferSize, 0),
              requests: resources.length,
            });
          } else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }),
  );
  measurements.push({
    ...profile,
    ...stats,
    renderer,
    cache:
      'Fresh context; localhost; no network or CPU throttling. Mobile is viewport/DPR emulation on the same desktop GPU.',
  });
  console.log(profile.name, stats);
  await context.close();
}
const context = await browser.newContext({
  viewport: { width: 1672, height: 941 },
  recordVideo: { dir: root + 'web/test-results/recordings', size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
await page.goto(baseURL);
await page.locator('[data-scene="ready"]').waitFor();
await page.waitForTimeout(8000);
await page.getByRole('button', { name: 'Pause animation' }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: root + 'docs/assets/screenshots/home-live.png' });
const video = page.video();
await context.close();
await video!.saveAs(root + 'docs/assets/recordings/scene-browser.webm');
const memoryPage = await browser.newPage();
const client = await memoryPage.context().newCDPSession(memoryPage);
await client.send('Performance.enable');
const navigation: { cycle: number; heap: number | undefined; canvasCount: number }[] = [];
await memoryPage.goto(baseURL);
for (let i = 0; i < 12; i++) {
  if (i > 0) await memoryPage.getByRole('link', { name: 'AzenoHI.dev — Home' }).click();
  await memoryPage.locator('[data-scene="ready"]').waitFor();
  await memoryPage.getByRole('link', { name: 'Projects', exact: true }).click();
  await memoryPage.waitForURL('**/projects');
  await memoryPage.locator('canvas').waitFor({ state: 'detached' });
  // R3F asynchronously tears down its renderer; measure after that cleanup window.
  await memoryPage.waitForTimeout(700);
  await client.send('HeapProfiler.collectGarbage');
  const metrics = await client.send('Performance.getMetrics');
  navigation.push({
    cycle: i + 1,
    heap: metrics.metrics.find((item) => item.name === 'JSHeapUsedSize')?.value,
    canvasCount: await memoryPage.locator('canvas').count(),
  });
}
await browser.close();
await writeFile(
  root + 'docs/qa/performance.json',
  JSON.stringify(
    {
      date: new Date().toISOString(),
      browser: browser.version(),
      host: `${platform()} ${release()}; ${cpus()[0]?.model}`,
      profiles: measurements,
      navigation,
    },
    null,
    2,
  ) + '\n',
);
