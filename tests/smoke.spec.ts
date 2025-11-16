import { test, expect } from '@playwright/test';

/**
 * Smoke tests for critical top-level routes.
 * These tests ensure that pages render correctly on:
 * 1. Direct URL visits (hard refresh scenario)
 * 2. Client-side navigation via next/link
 */

test.describe('Top-level route smoke tests', () => {
  test('Home page loads correctly', async ({ page }) => {
    await page.goto('/');

    // Check for key homepage elements
    await expect(page.locator('h1')).toContainText('Underground');
    await expect(page.locator('text=TCG INTELLIGENCE CENTER')).toBeVisible();

    // Ensure no 404 error
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('Insights page loads on direct visit', async ({ page }) => {
    await page.goto('/insights');

    // Check for insights-specific content
    await expect(page.locator('text=Insights')).toBeVisible();
    await expect(page.locator('text=Expert Analysis')).toBeVisible();

    // Ensure proper response status
    const response = await page.goto('/insights');
    expect(response?.status()).toBe(200);
  });

  test('Research page loads on direct visit', async ({ page }) => {
    await page.goto('/research');

    // Check for research-specific content
    await expect(page.locator('text=Research')).toBeVisible();
    await expect(page.locator('text=In-Depth Analysis')).toBeVisible();

    const response = await page.goto('/research');
    expect(response?.status()).toBe(200);
  });

  test('About page loads on direct visit', async ({ page }) => {
    await page.goto('/about');

    // Check for about-specific content
    await expect(page.locator('text=About')).toBeVisible();
    await expect(page.locator('text=Our Mission')).toBeVisible();

    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);
  });

  test('Client-side navigation works correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to insights via link
    await page.click('a[href="/insights"]');
    await expect(page).toHaveURL('/insights');
    await expect(page.locator('text=Expert Analysis')).toBeVisible();

    // Navigate to research
    await page.click('a[href="/research"]');
    await expect(page).toHaveURL('/research');
    await expect(page.locator('text=In-Depth Analysis')).toBeVisible();

    // Navigate to about
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('text=Our Mission')).toBeVisible();

    // Navigate back home
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Underground');
  });

  test('Active navigation link highlighting works', async ({ page }) => {
    await page.goto('/insights');

    // Check that insights link has active styling
    const insightsLink = page.locator('a[href="/insights"]').first();
    const className = await insightsLink.getAttribute('class');
    expect(className).toContain('text-cyan-400');
  });

  test('Hard refresh preserves route on all pages', async ({ page }) => {
    // Test insights
    await page.goto('/insights');
    await page.reload();
    await expect(page).toHaveURL('/insights');
    await expect(page.locator('text=Expert Analysis')).toBeVisible();

    // Test research
    await page.goto('/research');
    await page.reload();
    await expect(page).toHaveURL('/research');
    await expect(page.locator('text=In-Depth Analysis')).toBeVisible();

    // Test about
    await page.goto('/about');
    await page.reload();
    await expect(page).toHaveURL('/about');
    await expect(page.locator('text=Our Mission')).toBeVisible();
  });

  test('No 404 errors on any top-level route', async ({ page }) => {
    const routes = ['/', '/insights', '/research', '/about'];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);

      // Ensure page doesn't contain "404" text
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).not.toContain('not found');
    }
  });
});
