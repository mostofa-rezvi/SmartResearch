import { test, expect } from '@playwright/test';

test.describe('Discovery & Search Flow', () => {
  test('should return SBERT matching results', async ({ page }) => {
    await page.goto('/discovery');
    await page.fill('input[placeholder*="search"]', 'quantum computing applications');
    await page.keyboard.press('Enter');
    
    // Wait for SBERT processing
    await page.waitForSelector('.result-card');
    const results = await page.locator('.result-card').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should display trust graph for a paper', async ({ page }) => {
    await page.goto('/discovery');
    await page.click('.result-card:first-child');
    
    await expect(page.locator('canvas#trust-graph')).toBeVisible();
  });
});
