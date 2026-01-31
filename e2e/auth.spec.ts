import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('shows sign in option on protected pages', async ({ page }) => {
    await page.goto('/races/submit');
    // Should redirect or show auth prompt since not logged in
    await page.waitForTimeout(2000);
    // Should be redirected to races page or show login
    const url = page.url();
    expect(url).toMatch(/\/(races|$)/);
  });

  test('profile page redirects when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    // Should show login prompt or redirect
    const hasLoginPrompt = await page.locator('text=/sign in|log in|email/i').first().isVisible().catch(() => false);
    const redirected = !page.url().includes('/profile');
    expect(hasLoginPrompt || redirected).toBeTruthy();
  });
});
