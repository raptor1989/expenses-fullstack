#!/usr/bin/env node
// Minimal browser driver for apps/web, built on playwright-core.
// Launches the system Edge (channel: 'msedge') instead of downloading a
// Chromium build -- avoids a multi-hundred-MB Playwright browser install.
//
// Usage:
//   node driver.mjs <command> [args...]
//
// Commands:
//   screenshot <url> <out.png>                                          - nav + screenshot, no auth
//   login-screenshot <email> <password> <out.png>                       - fill+submit login form, screenshot result
//   add-expense-screenshot <email> <password> <description> <amount> <out.png>
//       - login, then fill+submit the dashboard's inline expense form, screenshot result
//
// Env:
//   WEB_URL  (default http://localhost:5173)

import { chromium } from 'playwright-core';

const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

async function withPage(fn) {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        // Workaround: the axios response interceptor hard-redirects to /login on ANY 401,
        // including the initial "am I logged in" check fired from /login itself. Without
        // a session cookie that 401s immediately, causing window.location.href = '/login'
        // to fire on /login -> reload -> re-check -> 401 -> reload forever. Fulfilling this
        // one request with a non-401 status keeps the page from ever hard-navigating.
        await page.route('**/api/users/profile', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) })
        );
        await fn(page);
    } finally {
        await browser.close();
    }
}

const [, , cmd, ...args] = process.argv;

if (cmd === 'screenshot') {
    const [url, out] = args;
    await withPage(async (page) => {
        const errors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('body :is(input, h1, h5, [role="heading"])', { timeout: 15000 });
        await page.screenshot({ path: out });
        console.log(`saved ${out}`);
        if (errors.length) console.log('console errors:', errors.join(' | '));
    });
} else if (cmd === 'login-screenshot') {
    const [email, password, out] = args;
    await withPage(async (page) => {
        const errors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(`${WEB_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#email', { timeout: 15000 });
        await page.fill('#email', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${WEB_URL}/`, { timeout: 10000 });
        await page.waitForSelector('text=Add Expense', { timeout: 15000 });
        await page.screenshot({ path: out });
        console.log(`saved ${out}`);
        if (errors.length) console.log('console errors:', errors.join(' | '));
    });
} else if (cmd === 'add-expense-screenshot') {
    const [email, password, description, amount, out] = args;
    await withPage(async (page) => {
        const errors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(`${WEB_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#email', { timeout: 15000 });
        await page.fill('#email', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${WEB_URL}/`, { timeout: 10000 });
        await page.waitForSelector('text=Add Expense', { timeout: 15000 });

        try {
            // Category is a MUI Select (not a native <select>) -- click the combobox div
            // (id is fixed: "mui-component-select-<fieldName>") to open the popup, then use
            // keyboard nav to pick the first option. Clicking a specific li[role=option] by
            // text is flaky here -- the popup's position/timing isn't always settled the
            // instant it appears, so the click can land before it registers.
            await page.click('#mui-component-select-categoryId');
            await page.waitForSelector('li[role="option"]');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            await page.fill('input[name="amount"]', amount);
            await page.fill('input[name="description"]', description);
            await page.click('button:has-text("Save")');
            await page.waitForSelector(`text=${description}`, { timeout: 10000 });
        } finally {
            await page.screenshot({ path: out });
            console.log(`saved ${out}`);
            if (errors.length) console.log('console errors:', errors.join(' | '));
        }
    });
} else {
    console.error(
        'unknown command. use: screenshot <url> <out> | login-screenshot <email> <password> <out> | add-expense-screenshot <email> <password> <description> <amount> <out>'
    );
    process.exit(1);
}
