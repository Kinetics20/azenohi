import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(root, 'web/package.json'));
const { chromium } = require('playwright');
const demo = path.join(root, 'artifacts/demo');
const rehearsal = process.argv.includes('--rehearsal');
const qa = path.join(demo, rehearsal ? '.work/rehearsal-qa' : 'qa');
const verification = JSON.parse(readFileSync(path.join(qa, 'verification.json'), 'utf8'));
mkdirSync(qa, { recursive: true });
const player = path.join(demo, '.work', 'playback-player.html');
writeFileSync(player, `<!doctype html><meta charset="utf-8"><title>Local movie verification</title><video controls muted playsinline width="1920" height="1080" src="${pathToFileURL(verification.file).href}"></video>`);
const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(player).href);
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2, null, { timeout: 30000 });
  const results = [];
  for (const second of [0, verification.duration / 2, verification.duration - 1.2]) {
    await page.evaluate(async second => {
      const video = document.querySelector('video');
      video.currentTime = second;
      if (video.seeking) await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
      await video.play();
    }, second);
    await page.waitForTimeout(550);
    const state = await page.evaluate(() => {
      const video = document.querySelector('video');
      const quality = video.getVideoPlaybackQuality();
      return { currentTime: video.currentTime, duration: video.duration, width: video.videoWidth, height: video.videoHeight, error: video.error?.message ?? null, paused: video.paused, decodedFrames: quality.totalVideoFrames, droppedFrames: quality.droppedVideoFrames };
    });
    if (state.error || state.currentTime <= second + .2 || state.width !== 1920 || state.height !== 1080) throw new Error(JSON.stringify(state));
    results.push({ seekTo: second, ...state });
  }
  await page.waitForFunction(() => document.querySelector('video').ended, null, { timeout: 10000 });
  writeFileSync(path.join(qa, 'playback.json'), JSON.stringify({ sha256: verification.sha256, browser: browser.version(), checks: results, ended: true }, null, 2));
  if (!rehearsal) {
    const report = path.join(demo, 'recording-report.md');
    const content = readFileSync(report, 'utf8').split('\n## Browser playback')[0];
    writeFileSync(report, content + '\n## Browser playback\n\nThe actual final MP4 played in Chromium at the beginning, midpoint and end. Playback advanced after each seek, decoded at 1920 × 1080, and reached the `ended` event without a media error. See `qa/playback.json`, bound to the same SHA-256 as this report.\n');
    const inventory = path.join(qa, 'files.txt');
    const files = new Set(readFileSync(inventory, 'utf8').trim().split('\n'));
    files.add('artifacts/demo/qa/playback.json');
    writeFileSync(inventory, [...files].sort().join('\n') + '\n');
  }
  console.log('Browser playback passed at beginning, midpoint and end; ended event received.');
} finally {
  await browser.close();
}
