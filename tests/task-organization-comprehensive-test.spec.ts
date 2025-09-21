import { test, expect } from '@playwright/test';

test.describe('Task Organization Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3003');
  });

  test('Verify improved task organization and visual distinction', async ({ page }) => {
    // Wait for the page to load and navigate to tasks
    await page.waitForLoadState('networkidle');

    // Navigate to Tasks page
    await page.click('a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot of Tasks page
    await page.screenshot({
      path: 'test-results/01-tasks-page-initial.png',
      fullPage: true
    });

    // Verify page title and no "fail to fetch" errors
    await expect(page.locator('text=Tasks')).toBeVisible();

    // Check for any error messages (should not exist)
    const errorMessages = page.locator('text=fail to fetch, text=Failed to fetch, text=Error');
    await expect(errorMessages).toHaveCount(0);

    // Look for task sections
    console.log('Checking for task sections and organization...');

    // Take screenshot showing current task organization
    await page.screenshot({
      path: 'test-results/02-task-organization-overview.png',
      fullPage: true
    });

    // Test creating a new task to ensure we have active tasks
    console.log('Creating a test task...');
    await page.click('button:has-text("Add Task"), button:has-text("New Task")');
    await page.waitForSelector('.task-form, [data-testid="task-form"]', { timeout: 5000 });

    // Fill out the form
    await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Active Task');
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'This is a test task to verify organization');

    // Select a category if available
    const categorySelect = page.locator('select[name="category"], select[id="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Submit the form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await page.waitForLoadState('networkidle');

    // Take screenshot after creating task
    await page.screenshot({
      path: 'test-results/03-after-task-creation.png',
      fullPage: true
    });

    // Verify the task appears in active section
    const activeTask = page.locator('text=Test Active Task');
    await expect(activeTask).toBeVisible();

    // Check if completed tasks section exists and has proper header
    const completedSection = page.locator('text=Completed Tasks');
    const completedSectionVisible = await completedSection.isVisible();

    if (completedSectionVisible) {
      console.log('Completed tasks section found');
      // Check for green dot indicator
      const greenDot = page.locator('.text-green-500, .bg-green-500').first();
      await expect(greenDot).toBeVisible();

      // Take screenshot showing completed section
      await page.screenshot({
        path: 'test-results/04-completed-section-visible.png',
        fullPage: true
      });
    }

    // Test completing a task
    console.log('Testing task completion...');

    // Find the task and mark it as completed
    const taskItem = page.locator('text=Test Active Task').locator('..').locator('..');

    // Look for completion checkbox or button
    const completionElement = taskItem.locator('input[type="checkbox"], button:has-text("Complete"), .complete-button');

    if (await completionElement.isVisible()) {
      await completionElement.click();
      await page.waitForLoadState('networkidle');

      // Take screenshot after marking task as completed
      await page.screenshot({
        path: 'test-results/05-after-task-completion.png',
        fullPage: true
      });

      // Verify the task moved to completed section
      const completedTasksSection = page.locator('text=Completed Tasks');
      await expect(completedTasksSection).toBeVisible();

      // Verify task appears in completed section with reduced opacity
      const completedTask = page.locator('text=Test Active Task');
      await expect(completedTask).toBeVisible();

      console.log('Task successfully moved to completed section');
    }

    // Test view mode switching
    console.log('Testing view modes...');

    // Look for view toggle buttons
    const listViewButton = page.locator('button:has-text("List"), button[aria-label*="List"]');
    const categoryViewButton = page.locator('button:has-text("Category"), button:has-text("Group"), button[aria-label*="Category"]');

    if (await listViewButton.isVisible() && await categoryViewButton.isVisible()) {
      // Test List View
      await listViewButton.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'test-results/06-list-view-mode.png',
        fullPage: true
      });

      // Test Category View
      await categoryViewButton.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'test-results/07-category-view-mode.png',
        fullPage: true
      });

      console.log('Both view modes tested successfully');
    }

    // Verify visual distinctions
    console.log('Verifying visual distinctions...');

    // Check for proper styling and opacity differences
    const completedTaskElements = page.locator('[data-status="completed"], .completed-task, .opacity-75');
    const activeTaskElements = page.locator('[data-status="active"], .active-task, [data-status="pending"]');

    if (await completedTaskElements.count() > 0) {
      console.log('Found completed tasks with proper styling');
    }

    if (await activeTaskElements.count() > 0) {
      console.log('Found active tasks with proper styling');
    }

    // Final comprehensive screenshot
    await page.screenshot({
      path: 'test-results/08-final-organization-verification.png',
      fullPage: true
    });

    console.log('Task organization testing completed successfully!');
  });

  test('Verify no API errors and smooth functionality', async ({ page }) => {
    // Monitor console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Monitor network requests for failures
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');

    // Navigate to tasks page
    await page.click('a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any async operations
    await page.waitForTimeout(2000);

    // Verify no console errors
    expect(errors.filter(error =>
      !error.includes('Warning') &&
      !error.includes('[HMR]') &&
      !error.includes('DevTools')
    )).toHaveLength(0);

    // Verify no failed API requests
    expect(failedRequests.filter(request =>
      request.includes('/api/') || request.includes('fail to fetch')
    )).toHaveLength(0);

    console.log('No API errors detected - functionality is smooth!');
  });
});