import { test, expect } from '@playwright/test';

test.describe('Quick Tasks Functionality Verification', () => {
  test('Verify tasks functionality after backend restart', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });

    // Navigate to tasks page
    await page.click('text=Tasks');

    // Wait for tasks to load and verify no "fail to fetch" errors
    await page.waitForLoadState('networkidle');

    // Check for any error messages
    const errorElements = await page.locator('text=/fail.*fetch|error|failed/i').count();
    expect(errorElements).toBe(0);

    // Wait for tasks content to be visible
    await page.waitForSelector('[data-testid="tasks-list"], .task-list, .tasks-container', { timeout: 10000 });

    // Take screenshot of tasks page
    await page.screenshot({ path: 'test-results/02-tasks-loaded.png', fullPage: true });

    // Test creating a new task
    await page.click('button:has-text("Add Task"), button:has-text("New Task"), button:has-text("Create Task")');

    // Wait for form to appear
    await page.waitForSelector('input[name="title"], input[placeholder*="title"], input[type="text"]', { timeout: 5000 });

    // Fill out task form
    const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[type="text"]').first();
    await titleInput.fill('Test Task - API Verification');

    // Look for description field
    const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="description"], input[name="description"]').first();
    if (await descriptionField.count() > 0) {
      await descriptionField.fill('This task verifies the API is working correctly');
    }

    // Take screenshot of form filled
    await page.screenshot({ path: 'test-results/03-form-filled.png', fullPage: true });

    // Submit the form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');

    // Wait for form to close and task to appear in list
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for task to appear

    // Verify the new task appears in the list
    await expect(page.locator('text=Test Task - API Verification')).toBeVisible({ timeout: 10000 });

    // Take final screenshot showing tasks working
    await page.screenshot({ path: 'test-results/04-tasks-working-final.png', fullPage: true });

    // Verify no error messages are present
    const finalErrorCheck = await page.locator('text=/fail.*fetch|error|failed/i').count();
    expect(finalErrorCheck).toBe(0);

    console.log('✅ Tasks functionality verification completed successfully');
    console.log('✅ No "fail to fetch" errors detected');
    console.log('✅ Task creation and display working properly');
  });
});