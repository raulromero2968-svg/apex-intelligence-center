import { test, expect } from '@playwright/test';

test('toast appears on create-and-save and cache is fresh', async ({ page }) => {
  await page.goto('/intelligence');
  await page.getByRole('button', { name: /Create & Save/i }).click();
  await expect(page.getByText(/Saved to/)).toBeVisible();

  // Navigate to public list; updated immediately via tag invalidation
  await page.goto('/dashboard/collections');
  await expect(page.getByText(/My Picks/)).toBeVisible();
});

