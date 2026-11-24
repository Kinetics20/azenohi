import { defineConfig, devices } from '@playwright/test';
const externalBaseURL = process.env['PLAYWRIGHT_BASE_URL'];
export default defineConfig({
  testDir: './e2e', fullyParallel: false, forbidOnly: true, retries: 0, workers: 1,
  timeout: 30_000, globalTimeout: 10 * 60_000, expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }]], outputDir: 'test-results',
  use: { baseURL: externalBaseURL ?? 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  ...(externalBaseURL ? {} : { webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 60_000 } }),
});
