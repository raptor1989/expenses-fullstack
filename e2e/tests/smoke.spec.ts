import { createHash, randomBytes } from 'crypto';
import { test, expect, Page } from '@playwright/test';
import { Client } from 'pg';
import { API_URL, DB } from '../env';

// One fresh account per run, so repeated local runs never collide.
const runId = Date.now().toString(36);
// `password` changes when the reset test sets a new one; the tests after it sign in with that.
const account = { email: `smoke-${runId}@example.com`, password: 'Password123!' };
const expenseDescription = `Smoke expense ${runId}`;
const categoryName = `Smoke category ${runId}`;

// The flows build on each other (register → add data → read it back → log out).
test.describe.configure({ mode: 'serial' });

async function login(page: Page) {
    await page.goto('/login');
    await page.locator('#email').fill(account.email);
    await page.locator('#password').fill(account.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Add Expense')).toBeVisible();
}

// The API runs without SMTP here and only logs the reset link, so the test stores a token it knows,
// exactly like POST /users/forgot-password does (SHA-256 of the raw token, 1 h expiry).
async function plantResetToken(email: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const db = new Client(DB);
    await db.connect();
    try {
        await db.query(
            "UPDATE users SET reset_token_hash = $1, reset_token_expires_at = NOW() + INTERVAL '1 hour' WHERE email = $2",
            [tokenHash, email]
        );
    } finally {
        await db.end();
    }
    return rawToken;
}

test('API answers /health and reports no session for anonymous callers', async ({ request }) => {
    const health = await request.get(`${API_URL}/health`);
    expect(health.status()).toBe(200);
    expect(await health.json()).toMatchObject({ status: 'ok' });

    const session = await request.get(`${API_URL}/users/session`);
    expect(session.status()).toBe(200);
    expect(await session.json()).toEqual({ user: null });
});

test('anonymous visit to the dashboard redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('registers a new account and lands on the dashboard', async ({ page }) => {
    await page.goto('/register');
    await page.locator('#email').fill(account.email);
    await page.locator('#password').fill(account.password);
    await page.locator('#confirmPassword').fill(account.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Add Expense')).toBeVisible();
    // The drawer is rendered twice (permanent + mobile variant kept mounted), so pick the visible copy.
    await expect(page.getByText(account.email, { exact: true }).filter({ visible: true })).toBeVisible();
});

test('rejects a wrong password with the API message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(account.email);
    await page.locator('#password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
});

test('adds an expense from the dashboard and sees it in the recent list', async ({ page }) => {
    await login(page);

    await page.locator('#mui-component-select-categoryId').click();
    await page.getByRole('option', { name: 'General' }).click();
    await page.locator('input[name="amount"]').fill('12.34');
    await page.locator('input[name="description"]').fill(expenseDescription);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Expense added successfully!')).toBeVisible();
    // The dashboard refetches after the inline form saves — no reload needed.
    await expect(page.getByRole('cell', { name: expenseDescription })).toBeVisible();
});

test('lists the expense on the Expenses page', async ({ page }) => {
    await login(page);
    await page.goto('/expenses');

    const table = page.getByRole('table', { name: 'expenses table' });
    await expect(table.getByRole('cell', { name: expenseDescription })).toBeVisible();
});

test('searches expenses by a description fragment', async ({ page }) => {
    await login(page);
    await page.goto('/expenses');

    const search = page.getByPlaceholder('Search expenses…');
    // Upper-cased run id: a fragment of the description, matched case-insensitively.
    await search.fill(runId.toUpperCase());
    await search.press('Enter');
    const table = page.getByRole('table', { name: 'expenses table' });
    await expect(table.getByRole('cell', { name: expenseDescription })).toBeVisible();

    await search.fill(`no-such-expense-${runId}`);
    await search.press('Enter');
    await expect(page.getByText(/No expenses found/)).toBeVisible();
});

test('creates and deletes a category', async ({ page }) => {
    await login(page);
    await page.goto('/categories');

    await page.getByRole('button', { name: 'Add Category' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(categoryName);
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('Category created!')).toBeVisible();
    await expect(page.getByText(categoryName, { exact: true })).toBeVisible();

    const card = page.getByText(categoryName, { exact: true }).locator('..');
    await card.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Category deleted!')).toBeVisible();
    await expect(page.getByText(categoryName, { exact: true })).toHaveCount(0);
});

test('changes the currency in settings and keeps it after a reload', async ({ page }) => {
    await login(page);
    await page.goto('/settings');

    const currency = () => page.getByRole('combobox').filter({ hasText: /^(PLN|USD|EUR|GBP)$/ });
    await currency().click();
    await page.getByRole('option', { name: 'USD' }).click();
    await expect(page.getByText('Currency updated!')).toBeVisible();

    await page.reload();
    await expect(currency()).toHaveText('USD');
});

test('resets the password from a reset link and signs out existing sessions', async ({ page, browser }) => {
    // A session opened before the reset, which the reset must revoke.
    await login(page);

    const visitor = await browser.newPage();
    try {
        await visitor.goto('/login');
        await visitor.getByRole('link', { name: 'Forgot password?' }).click();
        await visitor.locator('#email').fill(account.email);
        await visitor.getByRole('button', { name: 'Send reset link' }).click();
        // No SMTP in the suite: the page must not promise an e-mail.
        await expect(visitor.getByRole('alert')).toContainText('Ask the administrator for the link');

        const newPassword = 'NewPassword456!';
        const token = await plantResetToken(account.email);
        await visitor.goto(`/reset-password?token=${token}`);
        await visitor.locator('#newPassword').fill(newPassword);
        await visitor.locator('#confirmPassword').fill(newPassword);
        await visitor.getByRole('button', { name: 'Reset password' }).click();

        await expect(visitor).toHaveURL(/\/login$/);
        await expect(visitor.getByRole('alert')).toContainText('Your password has been reset');
        account.password = newPassword;

        // The token works only once.
        await visitor.goto(`/reset-password?token=${token}`);
        await visitor.locator('#newPassword').fill('AnotherPassword789!');
        await visitor.locator('#confirmPassword').fill('AnotherPassword789!');
        await visitor.getByRole('button', { name: 'Reset password' }).click();
        await expect(visitor.getByRole('alert')).toContainText('Invalid or expired reset token');
        await expect(visitor.getByRole('link', { name: 'Request a new link' })).toBeVisible();
    } finally {
        await visitor.close();
    }

    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);

    await login(page);
});

test('changes the password in settings, stays signed in and signs out other sessions', async ({ page, browser }) => {
    const otherDevice = await browser.newPage();
    try {
        await login(otherDevice);
        await login(page);
        await page.goto('/settings');

        const newPassword = 'ChangedPassword789!';
        await page.getByLabel('Current Password', { exact: true }).fill(account.password);
        await page.getByLabel('New Password', { exact: true }).fill(newPassword);
        await page.getByLabel('Confirm Password', { exact: true }).fill(newPassword);
        await page.getByRole('button', { name: 'Change Password' }).click();
        await expect(page.getByText('Password changed! Other devices have been signed out.')).toBeVisible();
        account.password = newPassword;

        // This browser got a fresh cookie with the change, so a reload keeps the session.
        await page.reload();
        await expect(page).toHaveURL(/\/settings$/);

        await otherDevice.goto('/');
        await expect(otherDevice).toHaveURL(/\/login$/);
    } finally {
        await otherDevice.close();
    }
});

test('logs out and protects the dashboard again', async ({ page }) => {
    await login(page);

    await page.getByText(account.email, { exact: true }).filter({ visible: true }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
});
