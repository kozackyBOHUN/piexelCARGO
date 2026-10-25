import { test, expect } from '@playwright/test';
test('application starts without runtime errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'PixelCargo 0.1' })).toBeVisible();
  await expect(page.getByText(/Firma nieutworzona/)).toBeVisible(); expect(errors).toEqual([]);
});
