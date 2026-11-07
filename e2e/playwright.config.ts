import { defineConfig, devices } from '@playwright/test';
import { API_DIR, API_URL, WEB_DIR, WEB_URL, apiEnv } from './env';

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './tests',
    globalSetup: './global-setup.ts',
    // The smoke flows share one account and build on each other, so they run serially.
    fullyParallel: false,
    workers: 1,
    retries: isCI ? 1 : 0,
    forbidOnly: isCI,
    timeout: 30_000,
    expect: { timeout: 10_000 },
    reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
    use: {
        baseURL: WEB_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        // E2E_BROWSER_CHANNEL=msedge (or chrome) reuses a system browser instead of the
        // downloaded Chromium — handy on Windows dev machines without `playwright install`.
        channel: process.env.E2E_BROWSER_CHANNEL || undefined
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // Both servers are started from the build output, exactly like production:
    // the compiled API on 4000 against the e2e database and the static server from
    // `serve:dist` (sirv, SPA fallback) on 5173.
    // A port that is already taken fails the run instead of silently reusing a dev
    // server (which would point at the developer's database).
    webServer: [
        {
            command: 'node dist/index.js',
            cwd: API_DIR,
            url: `${API_URL}/health`,
            reuseExistingServer: false,
            timeout: 30_000,
            env: apiEnv
        },
        {
            command: 'npm run serve:dist',
            cwd: WEB_DIR,
            url: WEB_URL,
            reuseExistingServer: false,
            timeout: 30_000
        }
    ]
});
