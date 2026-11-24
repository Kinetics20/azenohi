import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(root, 'web/package.json'));
const { chromium } = require('playwright');
const dir = path.join(root, 'artifacts/demo');
const work = path.join(dir, '.work');
const rehearsal = process.argv.includes('--rehearsal');
const name = rehearsal ? 'rehearsal' : 'capture';
const url = process.env.DEMO_URL || 'http://127.0.0.1:4176';
const display = process.env.DEMO_DISPLAY || ':98';
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const xdotool = process.env.XDOTOOL || 'xdotool';
const env = { ...process.env, DISPLAY: display };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { env, stdio: 'ignore' });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command}: ${code}`)));
});
mkdirSync(work, { recursive: true });
mkdirSync(path.join(dir, 'screenshots'), { recursive: true });
const source = readFileSync(path.join(root, 'web/src/components/scene/motion.ts'), 'utf8');
const earthPeriod = Number(source.match(/EARTH_PERIOD = (\d+)/)[1]);
const stationPeriod = Number(source.match(/STATION_PERIOD = (\d+)/)[1]);
const holdSeconds = 10; // Latest user instruction: exactly ten seconds of Home in the final cut.
const manifest = { rehearsal, earthPeriod, stationPeriod, holdSeconds, marks: [], captions: [], errors: [], failedRequests: [], externalRequests: [] };
let browser;
let recorder;
let epoch;
let finished = false;
let point = { x: 1878, y: 1040 };
const mark = (id, extra = {}) => {
  const item = { id, rawTime: Date.now() / 1000 - epoch, ...extra };
  manifest.marks.push(item);
  writeFileSync(path.join(work, `${name}.json`), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(item));
  return item.rawTime;
};
async function moveTo(x, y, seconds = 1.15) {
  const steps = Math.round(seconds * 60), args = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, ease = t * t * (3 - 2 * t);
    const arc = Math.sin(t * Math.PI) * 16;
    args.push('mousemove', String(Math.round(point.x + (x - point.x) * ease)), String(Math.round(point.y + (y - point.y) * ease + arc)), 'sleep', String(seconds / steps));
  }
  await run(xdotool, args);
  point = { x, y };
}

try {
  browser = await chromium.launch({
    headless: false, env,
    args: ['--ozone-platform=x11', '--kiosk', '--window-size=1920,1080', '--window-position=0,0', '--force-device-scale-factor=1', '--enable-gpu', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=vulkan', '--enable-features=Vulkan', '--disable-vulkan-surface', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--no-first-run', '--disable-session-crashed-bubble'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', colorScheme: 'dark', locale: 'en-US' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const { windowId } = await cdp.send('Browser.getWindowForTarget');
  await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'fullscreen' } });
  await wait(800);
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => manifest.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') manifest.errors.push(message.text()); });
  page.on('requestfailed', request => manifest.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { if (!request.url().startsWith(url) && !request.url().startsWith('data:')) manifest.externalRequests.push(request.url()); });
  // Observe timing only. No styles, components, clocks or animation values are modified.
  await context.addInitScript(() => {
    window.__demoObservation = { readyAt: null, simulatedSeconds: 0, intervals: [], states: [], visibility: [], input: [] };
    const state = window.__demoObservation;
    const observer = new MutationObserver(() => {
      const scene = document.querySelector('[data-scene]')?.getAttribute('data-scene');
      if (scene && state.states.at(-1)?.value !== scene) state.states.push({ value: scene, at: performance.now() });
      if (scene === 'ready' && state.readyAt === null) state.readyAt = performance.now();
    });
    observer.observe(document, { subtree: true, attributes: true, childList: true, attributeFilter: ['data-scene'] });
    document.addEventListener('visibilitychange', () => state.visibility.push({ hidden: document.hidden, at: performance.now() }));
    for (const event of ['pointermove', 'pointerdown', 'wheel', 'keydown']) document.addEventListener(event, () => state.input.push({ event, at: performance.now() }), { passive: true });
    let previous;
    function tick(now) {
      if (state.readyAt !== null && previous >= state.readyAt && !state.introComplete) {
        const delta = now - previous;
        state.intervals.push(delta);
        state.simulatedSeconds += Math.min(delta / 1000, 0.05);
      }
      previous = now;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  await page.bringToFront();
  await run(xdotool, ['mousemove', String(point.x), String(point.y)]);
  await wait(300);
  const log = createWriteStream(path.join(work, `${name}-ffmpeg.log`));
  recorder = spawn(ffmpeg, ['-hide_banner', '-y', '-thread_queue_size', '1024', '-f', 'x11grab', '-draw_mouse', '1', '-framerate', '60', '-video_size', '1920x1080', '-i', `${display}.0+0,0`, '-an', '-vf', 'scale=out_color_matrix=bt709,format=yuv420p', '-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr', '-cq', '12', '-b:v', '0', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-fps_mode', 'cfr', '-r', '60', '-g', '120', path.join(work, `${name}.mkv`)], { env, stdio: ['pipe', 'ignore', 'pipe'] });
  const stopped = new Promise((resolve, reject) => {
    recorder.on('error', reject);
    recorder.on('exit', code => code === 0 ? resolve() : reject(new Error(`Capture exited: ${code}`)));
  });
  stopped.catch(() => {});
  let stderr = '';
  recorder.stderr.on('data', data => {
    log.write(data);
    stderr += data.toString();
    const found = stderr.match(/Duration: N\/A, start: ([0-9.]+)/);
    if (found) epoch = Number(found[1]);
  });
  for (let i = 0; !epoch && i < 100; i++) await wait(100);
  if (!epoch) throw new Error(`Capture did not initialize: ${stderr.slice(-1500)}`);
  manifest.captureEpoch = epoch;
  await wait(500);
  mark('navigation-start');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-scene="ready"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  manifest.browser = await browser.version();
  manifest.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, hidden: document.hidden }));
  manifest.renderer = await page.locator('canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2'), extension = gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(extension.UNMASKED_RENDERER_WEBGL);
  });
  manifest.timing = await page.evaluate(() => ({ timeOrigin: performance.timeOrigin, firstPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime, initialAssetsReadyAt: Math.max(...performance.getEntriesByType('resource').filter(entry => /\/images\/scene\//.test(entry.name) || /woff2/.test(entry.name)).map(entry => entry.responseEnd)), readyAt: window.__demoObservation.readyAt }));
  mark('animation-ready', { observedRawTime: (manifest.timing.timeOrigin + manifest.timing.readyAt) / 1000 - epoch });
  let lastProgress = 0;
  while (true) {
    const elapsed = await page.evaluate(() => window.__demoObservation.simulatedSeconds);
    if (elapsed >= holdSeconds) break;
    if (elapsed - lastProgress >= 30) { console.log(`Uninterrupted animation: ${elapsed.toFixed(1)} / ${holdSeconds}s`); lastProgress = elapsed; }
    await wait(Math.min(1000, (holdSeconds - elapsed) * 1000 + 50));
    if (recorder.exitCode !== null) throw new Error('Recorder stopped during animation');
  }
  manifest.intro = await page.evaluate(() => {
    const state = window.__demoObservation;
    state.introComplete = true;
    const values = [...state.intervals].sort((a, b) => a - b);
    const sum = state.intervals.reduce((a, b) => a + b, 0);
    return { readyAt: state.readyAt, endAt: performance.now(), seconds: (performance.now() - state.readyAt) / 1000, simulatedSeconds: state.simulatedSeconds, frameCount: values.length, rafFps: values.length * 1000 / sum, p95FrameMs: values[Math.floor(values.length * .95)], maxFrameMs: Math.max(...values), over50ms: values.filter(x => x > 50).length, states: state.states, visibility: state.visibility, input: state.input };
  });
  mark('intro-end');
  if (manifest.intro.input.length || manifest.intro.visibility.some(item => item.hidden) || manifest.viewport.reducedMotion) throw new Error('Intro was interrupted');
  const shot = async id => {
    if (!rehearsal) await page.screenshot({ path: path.join(dir, 'screenshots', `${id}.png`) });
  };
  const ready = async () => {
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    await page.evaluate(() => document.fonts.ready);
    await wait(300);
  };
  const click = async locator => {
    await locator.waitFor({ state: 'visible' });
    const box = await locator.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > 1080) throw new Error('Target needs explicit smooth scroll');
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await moveTo(x, y);
    await wait(250);
    await page.mouse.click(x, y);
  };
  const nav = name => page.getByRole('navigation').getByRole('link', { name, exact: true });
  const caption = (text, seconds, x, y, width) => {
    const start = mark(`caption:${text}`);
    manifest.captions.push({ text, rawStart: start, duration: seconds, x, y, width });
  };
  const scroll = async delta => {
    await moveTo(1855, 600, .8);
    const steps = 90;
    for (let i = 1; i <= steps; i++) {
      const previous = (i - 1) / steps, current = i / steps;
      const ease = t => t * t * (3 - 2 * t);
      await page.mouse.wheel(0, delta * (ease(current) - ease(previous)));
      await wait(1000 / 60);
    }
    await wait(350);
  };
  await shot('01-home');
  // Control footage is available in the raw take; the 60-second cut uses only ten seconds of Home.
  caption('Motion, at your pace', 5.5, 1100, 970, 365);
  await click(page.getByRole('button', { name: 'Pause animation', exact: true }));
  await page.getByRole('button', { name: 'Resume animation', exact: true }).waitFor();
  mark('paused'); await wait(1800);
  await click(page.getByRole('button', { name: 'Resume animation', exact: true }));
  await page.getByRole('button', { name: 'Pause animation', exact: true }).waitFor();
  mark('resumed'); await wait(1700);
  await click(nav('Team')); await page.waitForURL('**/team'); await ready();
  mark('team'); caption('Meet the people behind AzenoHI', 6, 100, 985, 575);
  await moveTo(1855, 600, .7); await shot('02-team'); await wait(6500);
  await click(nav('Projects')); await page.waitForURL('**/projects'); await ready();
  mark('projects'); caption('Six projects. Explore every story.', 5, 100, 365, 585);
  await moveTo(1855, 600, .7); await shot('03-projects'); await wait(5400);
  for (const [slug, title] of [['captrace', 'CapTrace']]) {
    await click(page.locator(`#project-${slug}`));
    await page.waitForURL(`**/projects/${slug}`); await ready();
    mark(slug);
    if (slug === 'captrace') caption('Project stories, one click away', 4.5, 100, 970, 555);
    await moveTo(1855, 600, .65); await shot(`04-${slug}`); await wait(4500);
    await click(page.getByRole('link', { name: 'Back to projects', exact: true }).first());
    await page.waitForURL(`**/projects#project-${slug}`); await ready();
    const focus = await page.evaluate(() => document.activeElement.id);
    if (focus !== `project-${slug}`) throw new Error(`Return focus failed: ${title}`);
    mark(`return-${slug}`, { restoredFocus: focus });
    if (await page.evaluate(() => scrollY > 0)) await scroll(-200);
    await wait(500);
  }
  await click(page.locator('#project-risk-miner'));
  await page.waitForURL('**/projects/risk-miner'); await ready();
  mark('risk-miner'); caption('Risk Miner · Project concept', 4.5, 100, 550, 510);
  await moveTo(1855, 600, .7); await shot('05-risk-miner'); await wait(5000);
  await scroll(147); mark('risk-miner-details');
  // At this scroll position the caption occupies the empty gap above capabilities.
  caption('Concept views · Technology · Team', 5, 100, 403, 605);
  await shot('06-risk-miner-details'); await wait(5600);
  await click(page.getByRole('link', { name: 'Back to projects', exact: true }).last());
  await page.waitForURL('**/projects#project-risk-miner'); await ready();
  mark('return-risk-miner', { restoredFocus: await page.evaluate(() => document.activeElement.id) });
  await scroll(-200);
  await click(nav('Journey')); await page.waitForURL('**/journey'); await ready();
  mark('journey'); caption('Follow the journey', 6, 100, 475, 360);
  await moveTo(1855, 960, .7); await shot('07-journey'); await wait(7500);
  await click(page.getByRole('link', { name: 'AzenoHI.dev — Home', exact: true }));
  await page.waitForURL(url + '/'); await page.locator('[data-scene="ready"]').waitFor();
  await moveTo(1878, 1040, 1); mark('home-return'); await wait(5000);
  await shot('08-home-finish');
  mark('end');
  if (manifest.errors.length || manifest.failedRequests.length || manifest.externalRequests.length) throw new Error('Runtime validation failed; inspect manifest');
  recorder.stdin.write('q\n');
  await stopped; log.end();
  finished = true;
  manifest.success = true;
  writeFileSync(path.join(work, `${name}.json`), JSON.stringify(manifest, null, 2));
  console.log(`Recorded ${name}.mkv`);
} finally {
  if (recorder && !finished && recorder.exitCode === null) { recorder.stdin.write('q\n'); await wait(1000); if (recorder.exitCode === null) recorder.kill('SIGTERM'); }
  await browser?.close();
}
