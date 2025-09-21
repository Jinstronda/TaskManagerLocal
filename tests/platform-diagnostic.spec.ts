import { test, expect, Page } from '@playwright/test';

/**
 * PLATFORM DIAGNOSTIC TEST
 *
 * This test diagnoses the current UI structure and identifies issues
 * before running the comprehensive end-to-end validation.
 */

test.describe('🔍 PLATFORM DIAGNOSTIC AND UI INSPECTION', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('🔬 UI Structure and Selector Diagnostic', async () => {
    console.log('🔍 Starting platform diagnostic...');

    // Step 1: Check initial page load and structure
    console.log('📋 Checking initial page structure...');

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/diagnostic-initial-state.png', fullPage: true });

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for main navigation
    const nav = page.locator('nav');
    const navExists = await nav.isVisible();
    console.log(`Navigation visible: ${navExists}`);

    if (navExists) {
      const navLinks = await nav.locator('a').count();
      console.log(`Navigation links found: ${navLinks}`);

      for (let i = 0; i < navLinks; i++) {
        const link = nav.locator('a').nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`  Link ${i + 1}: "${text}" -> ${href}`);
      }
    }

    // Check for main headings
    const headings = page.locator('h1');
    const headingCount = await headings.count();
    console.log(`H1 headings found: ${headingCount}`);

    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();
      console.log(`  H1 ${i + 1}: "${text}"`);
    }

    // Step 2: Test navigation to each page
    console.log('🧭 Testing navigation to each page...');

    const routes = [
      { path: '/tasks', expectedHeading: 'Tasks' },
      { path: '/categories', expectedHeading: 'Categories' },
      { path: '/timer', expectedHeading: 'Timer' }
    ];

    for (const route of routes) {
      console.log(`\n🔄 Navigating to ${route.path}...`);

      try {
        await page.click(`nav a[href="${route.path}"]`);
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({
          path: `test-results/diagnostic-${route.path.replace('/', '')}-page.png`,
          fullPage: true
        });

        // Check URL
        const currentUrl = page.url();
        console.log(`  Current URL: ${currentUrl}`);
        console.log(`  Expected path present: ${currentUrl.includes(route.path)}`);

        // Check headings on this page
        const pageHeadings = page.locator('h1');
        const pageHeadingCount = await pageHeadings.count();
        console.log(`  H1 headings on this page: ${pageHeadingCount}`);

        for (let i = 0; i < pageHeadingCount; i++) {
          const heading = pageHeadings.nth(i);
          const text = await heading.textContent();
          console.log(`    H1 ${i + 1}: "${text}"`);
        }

        // Check for key UI elements on this page
        await checkPageElements(page, route.path);

      } catch (error) {
        console.log(`  ❌ Error navigating to ${route.path}: ${error.message}`);
      }
    }

    console.log('\n✅ Platform diagnostic completed!');
  });

  test('🧪 Quick Functionality Test', async () => {
    console.log('🧪 Running quick functionality test...');

    try {
      // Test basic navigation
      await page.click('nav a[href="/categories"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigation to categories works');

      // Try to create a category
      const addCatBtn = page.locator('button:has-text("Add Category")');
      if (await addCatBtn.isVisible()) {
        await addCatBtn.click();
        await page.waitForTimeout(1000);

        const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Category name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Category');
          console.log('✅ Category name input works');

          // Try to submit
          const submitBtn = page.locator('button[type="submit"]');
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Category creation submitted');
          }
        }
      }

      // Test tasks page
      await page.click('nav a[href="/tasks"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigation to tasks works');

      // Test timer page
      await page.click('nav a[href="/timer"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigation to timer works');

      console.log('🎉 Quick functionality test completed!');

    } catch (error) {
      console.log(`❌ Quick functionality test failed: ${error.message}`);
    }
  });
});

/**
 * Helper function to check page elements
 */
async function checkPageElements(page: Page, path: string) {
    console.log(`    🔍 Checking elements for ${path}...`);

    if (path === '/tasks') {
      // Check for task-related elements
      const addTaskBtn = page.locator('button:has-text("Add Task")');
      const addTaskExists = await addTaskBtn.isVisible();
      console.log(`      Add Task button visible: ${addTaskExists}`);

      if (addTaskExists) {
        // Try to open the form
        await addTaskBtn.click();
        await page.waitForTimeout(1000);

        // Check for form fields
        const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Task title"]');
        const titleExists = await titleInput.isVisible();
        console.log(`      Task title input visible: ${titleExists}`);

        const descInput = page.locator('textarea[placeholder*="description"], textarea[placeholder*="Task description"]');
        const descExists = await descInput.isVisible();
        console.log(`      Task description input visible: ${descExists}`);

        // Check for select elements
        const selects = page.locator('select');
        const selectCount = await selects.count();
        console.log(`      Select elements found: ${selectCount}`);

        for (let i = 0; i < selectCount; i++) {
          const select = selects.nth(i);
          const testId = await select.getAttribute('data-testid');
          const placeholder = await select.getAttribute('placeholder');
          console.log(`        Select ${i + 1}: testid="${testId}", placeholder="${placeholder}"`);
        }

        // Close form
        const cancelBtn = page.locator('button:has-text("Cancel")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }

      // Check for existing tasks
      const taskCards = page.locator('.task-card, [data-testid="task-card"], .task-item');
      const taskCount = await taskCards.count();
      console.log(`      Existing task cards: ${taskCount}`);
    }

    if (path === '/categories') {
      // Check for category-related elements
      const addCatBtn = page.locator('button:has-text("Add Category")');
      const addCatExists = await addCatBtn.isVisible();
      console.log(`      Add Category button visible: ${addCatExists}`);

      if (addCatExists) {
        // Try to open the form
        await addCatBtn.click();
        await page.waitForTimeout(1000);

        // Check for form fields
        const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Category name"]');
        const nameExists = await nameInput.isVisible();
        console.log(`      Category name input visible: ${nameExists}`);

        const descInput = page.locator('textarea[placeholder*="description"], textarea[placeholder*="Description"]');
        const descExists = await descInput.isVisible();
        console.log(`      Category description input visible: ${descExists}`);

        // Close form
        const cancelBtn = page.locator('button:has-text("Cancel")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }

      // Check for existing categories
      const categoryCards = page.locator('.category-card, [data-testid="category-card"], .category-item');
      const categoryCount = await categoryCards.count();
      console.log(`      Existing category cards: ${categoryCount}`);
    }

    if (path === '/timer') {
      // Check for timer-related elements
      const startBtn = page.locator('button[data-testid="start-timer"], button:has-text("Start")');
      const startExists = await startBtn.isVisible();
      console.log(`      Start timer button visible: ${startExists}`);

      const taskSelect = page.locator('select[data-testid="task-select"]');
      const taskSelectExists = await taskSelect.isVisible();
      console.log(`      Task select dropdown visible: ${taskSelectExists}`);

      const durationInput = page.locator('input[data-testid="duration-input"]');
      const durationExists = await durationInput.isVisible();
      console.log(`      Duration input visible: ${durationExists}`);

      const timerDisplay = page.locator('[data-testid="timer-display"], .timer-display');
      const timerDisplayExists = await timerDisplay.isVisible();
      console.log(`      Timer display visible: ${timerDisplayExists}`);
    }
  }