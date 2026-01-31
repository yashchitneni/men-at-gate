import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads homepage with hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Men in the Arena|MTA|MITA/i);
    // Hero section should be visible
    await expect(page.locator('text=/arena|brothers|men/i').first()).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    // Check nav exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('races page loads', async ({ page }) => {
    await page.goto('/races');
    await expect(page.locator('text=/race/i').first()).toBeVisible();
  });

  test('men page loads', async ({ page }) => {
    await page.goto('/men');
    await expect(page.locator('text=/member|men|roster/i').first()).toBeVisible();
  });

  test('workouts page loads', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page.locator('text=/workout/i').first()).toBeVisible();
  });

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('text=/not found|404/i').first()).toBeVisible();
  });
});
