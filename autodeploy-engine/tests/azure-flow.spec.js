import { test, expect } from '@playwright/test';

test('should complete the Azure deployment workflow', async ({ page }) => {
  await page.goto('/');

  // Start the setup
  await page.click("button:has-text('Start Setup')");

  // Select project type
  await page.click("button:has-text('Web Application')");

  // Select framework
  await page.click("button:has-text('Next.js')");

  // Select budget
  await page.click("button:has-text('Production (Azure)')");

  // Select technical level
  await page.click("button:has-text('Beginner')");

  // Generate configuration
  await page.click("button:has-text('Generate Configuration Files')");

  // Verify the final page
  await expect(page.locator("button:has-text('Download All Files')")).toBeVisible();
});
