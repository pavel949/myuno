import { expect, test } from '@playwright/test';
import { isolate } from './fixtures';

for (const width of [375, 390, 430, 1280]) {
  test(`global search preserves query/category on return at ${width}px without business writes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const unexpected = await isolate(page);
    await page.goto('/search?q=Canvas&type=property');
    const result = page.getByRole('link').filter({ hasText: 'Synthetic Canvas' }).first();
    await expect(result).toBeVisible({ timeout: 90_000 });
    await result.click();
    await expect(page).toHaveURL(/\/property\/11111111/);
    const back = page.getByRole('button', { name: /Back to results|К результатам/ }).first();
    await expect(back).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('This page failed to load')).toHaveCount(0);
    await back.click({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/search\?q=Canvas&type=property$/);
    await expect(page.locator('input').first()).toHaveValue('Canvas');
    expect(unexpected).toEqual([]);
  });
}
