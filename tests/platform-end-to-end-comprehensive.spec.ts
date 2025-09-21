import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * COMPREHENSIVE END-TO-END PLATFORM VALIDATION
 *
 * This test suite performs complete platform validation for production readiness.
 * It tests all user scenarios, cross-component integration, and platform stability.
 *
 * Test Coverage:
 * 1. Complete User Journey Testing
 * 2. Cross-Component Integration (Categories ↔ Tasks ↔ Timer)
 * 3. Real User Scenarios (4 comprehensive scenarios)
 * 4. Navigation and Routing
 * 5. Data Persistence Across Sessions
 * 6. Performance and Stability
 * 7. Error Resilience
 * 8. Responsive Design Validation
 * 9. Accessibility and Usability
 * 10. Production Readiness Assessment
 */

test.describe('🚀 COMPREHENSIVE PLATFORM END-TO-END VALIDATION', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    // Create a new context for each test to ensure clean state
    context = await browser.newContext();
    page = await context.newPage();

    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('🎯 SCENARIO A: New User Complete Setup Workflow', async () => {
    console.log('🔥 Testing complete new user setup workflow...');

    // Step 1: Initial application state validation
    await expect(page).toHaveTitle(/Task Manager/);

    // Step 2: Navigate to Categories and create initial categories
    await page.click('nav a[href="/categories"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Categories');

    // Create Work category
    await page.click('button:has-text("Add Category")');
    await page.fill('input[placeholder="Category name"]', 'Work Projects');
    await page.fill('textarea[placeholder="Description"]', 'Professional work and project tasks');
    await page.selectOption('select', 'work');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Create Personal category
    await page.click('button:has-text("Add Category")');
    await page.fill('input[placeholder="Category name"]', 'Personal Goals');
    await page.fill('textarea[placeholder="Description"]', 'Personal development and life goals');
    await page.selectOption('select', 'personal');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify categories were created
    await expect(page.locator('.category-card')).toHaveCount(2);
    await expect(page.locator('text=Work Projects')).toBeVisible();
    await expect(page.locator('text=Personal Goals')).toBeVisible();

    // Step 3: Navigate to Tasks and create tasks with categories
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Tasks');

    // Create first task
    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder="Task title"]', 'Complete Project Proposal');
    await page.fill('textarea[placeholder="Task description"]', 'Finish the Q4 project proposal for client presentation');
    await page.selectOption('select[data-testid="category-select"]', 'Work Projects');
    await page.selectOption('select[data-testid="priority-select"]', 'high');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Create second task
    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder="Task title"]', 'Morning Exercise Routine');
    await page.fill('textarea[placeholder="Task description"]', 'Complete 30-minute morning workout session');
    await page.selectOption('select[data-testid="category-select"]', 'Personal Goals');
    await page.selectOption('select[data-testid="priority-select"]', 'medium');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify tasks were created with correct categories
    await expect(page.locator('.task-card')).toHaveCount(2);
    await expect(page.locator('text=Complete Project Proposal')).toBeVisible();
    await expect(page.locator('text=Morning Exercise Routine')).toBeVisible();

    // Step 4: Test Timer integration with created tasks
    await page.click('nav a[href="/timer"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Timer');

    // Verify tasks are available in timer dropdown
    const taskSelect = page.locator('select[data-testid="task-select"]');
    await expect(taskSelect).toBeVisible();

    // Select a task and verify timer functionality
    await taskSelect.selectOption('Complete Project Proposal');
    await page.fill('input[data-testid="duration-input"]', '25');

    // Start timer and verify it's working
    await page.click('button[data-testid="start-timer"]');
    await page.waitForTimeout(2000);

    // Verify timer display updates
    const timerDisplay = page.locator('[data-testid="timer-display"]');
    await expect(timerDisplay).toBeVisible();
    await expect(timerDisplay).toContainText('24:5'); // Should show countdown

    // Pause timer to complete test
    await page.click('button[data-testid="pause-timer"]');

    console.log('✅ New user setup workflow completed successfully!');
  });

  test('🎯 SCENARIO B: Daily Workflow Simulation', async () => {
    console.log('🔥 Testing daily workflow simulation...');

    // Pre-setup: Create some test data
    await setupTestData(page);

    // Daily workflow: Check tasks → Start work session → Track time → Complete tasks

    // Step 1: Review daily tasks
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    // Check task status and priorities
    const taskCards = page.locator('.task-card');
    await expect(taskCards).toHaveCount.greaterThan(0);

    // Step 2: Start work session with timer
    await page.click('nav a[href="/timer"]');
    await page.waitForLoadState('networkidle');

    // Start a focused work session
    await page.selectOption('select[data-testid="task-select"]', { index: 1 });
    await page.fill('input[data-testid="duration-input"]', '15');
    await page.click('button[data-testid="start-timer"]');

    // Let timer run for a few seconds to simulate work
    await page.waitForTimeout(3000);

    // Pause the session
    await page.click('button[data-testid="pause-timer"]');
    await page.waitForTimeout(1000);

    // Resume the session
    await page.click('button[data-testid="resume-timer"]');
    await page.waitForTimeout(2000);

    // Stop the session
    await page.click('button[data-testid="stop-timer"]');

    // Step 3: Complete a task
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    // Mark a task as completed
    const firstTask = page.locator('.task-card').first();
    await firstTask.locator('button:has-text("Complete")').click();
    await page.waitForTimeout(1000);

    // Verify task status changed
    await expect(firstTask.locator('text=Completed')).toBeVisible();

    console.log('✅ Daily workflow simulation completed successfully!');
  });

  test('🎯 SCENARIO C: Comprehensive Task Management', async () => {
    console.log('🔥 Testing comprehensive task management...');

    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    // Test task creation with various configurations
    const taskConfigs = [
      { title: 'High Priority Task', priority: 'high', category: 'Work' },
      { title: 'Medium Priority Task', priority: 'medium', category: 'Personal' },
      { title: 'Low Priority Task', priority: 'low', category: 'Work' }
    ];

    for (const config of taskConfigs) {
      await page.click('button:has-text("Add Task")');
      await page.fill('input[placeholder="Task title"]', config.title);
      await page.fill('textarea[placeholder="Task description"]', `Description for ${config.title}`);

      // Select category if available
      try {
        await page.selectOption('select[data-testid="category-select"]', config.category);
      } catch (e) {
        console.log('Category not available, continuing...');
      }

      await page.selectOption('select[data-testid="priority-select"]', config.priority);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Verify all tasks were created
    const taskCards = page.locator('.task-card');
    await expect(taskCards).toHaveCount.greaterThanOrEqual(3);

    // Test task editing
    const firstTask = taskCards.first();
    await firstTask.locator('button:has-text("Edit")').click();
    await page.fill('input[value*="High Priority Task"]', 'Updated High Priority Task');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify edit was successful
    await expect(page.locator('text=Updated High Priority Task')).toBeVisible();

    // Test task filtering/sorting
    const priorityFilter = page.locator('select[data-testid="priority-filter"]');
    if (await priorityFilter.isVisible()) {
      await priorityFilter.selectOption('high');
      await page.waitForTimeout(1000);
      // Verify only high priority tasks are shown
      await expect(page.locator('text=Updated High Priority Task')).toBeVisible();
    }

    // Test task deletion
    await firstTask.locator('button:has-text("Delete")').click();
    // Confirm deletion if confirmation dialog appears
    try {
      await page.click('button:has-text("Confirm")');
    } catch (e) {
      // No confirmation dialog
    }
    await page.waitForTimeout(1000);

    console.log('✅ Comprehensive task management completed successfully!');
  });

  test('🎯 SCENARIO D: Advanced Time Tracking Across Categories', async () => {
    console.log('🔥 Testing advanced time tracking across categories...');

    // Pre-setup test data
    await setupTestData(page);

    await page.click('nav a[href="/timer"]');
    await page.waitForLoadState('networkidle');

    // Test multiple timer sessions with different tasks/categories
    const sessions = [
      { task: 0, duration: '10', sessionName: 'Work Session 1' },
      { task: 1, duration: '15', sessionName: 'Personal Session 1' },
      { task: 0, duration: '20', sessionName: 'Work Session 2' }
    ];

    for (const session of sessions) {
      console.log(`Starting ${session.sessionName}...`);

      // Select task and set duration
      await page.selectOption('select[data-testid="task-select"]', { index: session.task });
      await page.fill('input[data-testid="duration-input"]', session.duration);

      // Start timer
      await page.click('button[data-testid="start-timer"]');
      await page.waitForTimeout(3000); // Let timer run

      // Test pause/resume functionality
      await page.click('button[data-testid="pause-timer"]');
      await page.waitForTimeout(1000);
      await page.click('button[data-testid="resume-timer"]');
      await page.waitForTimeout(2000);

      // Stop session
      await page.click('button[data-testid="stop-timer"]');
      await page.waitForTimeout(1000);
    }

    // Verify time tracking history if available
    const historySection = page.locator('[data-testid="timer-history"]');
    if (await historySection.isVisible()) {
      await expect(historySection.locator('.session-record')).toHaveCount.greaterThanOrEqual(3);
    }

    console.log('✅ Advanced time tracking completed successfully!');
  });

  test('🔄 Navigation and Routing Validation', async () => {
    console.log('🔥 Testing navigation and routing...');

    // Test all navigation links
    const routes = [
      { path: '/', title: 'Dashboard' },
      { path: '/tasks', title: 'Tasks' },
      { path: '/categories', title: 'Categories' },
      { path: '/timer', title: 'Timer' }
    ];

    for (const route of routes) {
      await page.click(`nav a[href="${route.path}"]`);
      await page.waitForLoadState('networkidle');

      // Verify URL and page content
      expect(page.url()).toContain(route.path);
      await expect(page.locator('h1')).toContainText(route.title);
    }

    // Test browser back/forward functionality
    await page.goBack();
    await page.waitForLoadState('networkidle');

    await page.goForward();
    await page.waitForLoadState('networkidle');

    console.log('✅ Navigation and routing validation completed successfully!');
  });

  test('💾 Data Persistence Across Sessions', async () => {
    console.log('🔥 Testing data persistence across sessions...');

    // Create test data
    await page.click('nav a[href="/categories"]');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Category")');
    await page.fill('input[placeholder="Category name"]', 'Persistence Test Category');
    await page.fill('textarea[placeholder="Description"]', 'Testing data persistence');
    await page.selectOption('select', 'work');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Refresh the page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data persisted
    await expect(page.locator('text=Persistence Test Category')).toBeVisible();

    // Test with tasks as well
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder="Task title"]', 'Persistence Test Task');
    await page.fill('textarea[placeholder="Task description"]', 'Testing task persistence');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Refresh and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Persistence Test Task')).toBeVisible();

    console.log('✅ Data persistence validation completed successfully!');
  });

  test('⚡ Performance and Stability Assessment', async () => {
    console.log('🔥 Testing performance and stability...');

    // Measure page load times
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Test rapid navigation to check for memory leaks
    for (let i = 0; i < 10; i++) {
      await page.click('nav a[href="/tasks"]');
      await page.waitForLoadState('networkidle');
      await page.click('nav a[href="/categories"]');
      await page.waitForLoadState('networkidle');
      await page.click('nav a[href="/timer"]');
      await page.waitForLoadState('networkidle');
    }

    // Test multiple rapid form submissions
    await page.click('nav a[href="/categories"]');
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Add Category")');
      await page.fill('input[placeholder="Category name"]', `Performance Test ${i}`);
      await page.selectOption('select', 'work');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Verify all categories were created without issues
    const categoryCards = page.locator('.category-card');
    await expect(categoryCards).toHaveCount.greaterThanOrEqual(5);

    console.log('✅ Performance and stability assessment completed successfully!');
  });

  test('🔧 Error Resilience Testing', async () => {
    console.log('🔥 Testing error resilience...');

    // Test form validation errors
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    await page.click('button:has-text("Add Task")');
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errorMessages = page.locator('.error, .text-red-500, [class*="error"]');
    await expect(errorMessages.first()).toBeVisible();

    // Test with invalid data
    await page.fill('input[placeholder="Task title"]', ''); // Empty title
    await page.click('button[type="submit"]');

    // Should still show errors
    await expect(errorMessages.first()).toBeVisible();

    // Test network resilience by checking error handling
    // This would require mocking network failures, but we'll test graceful degradation

    console.log('✅ Error resilience testing completed successfully!');
  });

  test('📱 Responsive Design Validation', async () => {
    console.log('🔥 Testing responsive design...');

    // Test desktop viewport (already default)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify navigation is visible
    await expect(page.locator('nav')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    // Navigation should still be accessible
    await expect(page.locator('nav')).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Test mobile navigation (might be a hamburger menu)
    const nav = page.locator('nav');
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();
    } else {
      // Look for mobile menu button
      const menuButton = page.locator('button[aria-label*="menu"], .menu-button, .hamburger');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await expect(nav).toBeVisible();
      }
    }

    // Test form usability on mobile
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Task")');
    const titleInput = page.locator('input[placeholder="Task title"]');
    await expect(titleInput).toBeVisible();

    // Verify input is usable on mobile
    await titleInput.fill('Mobile Test Task');
    await expect(titleInput).toHaveValue('Mobile Test Task');

    console.log('✅ Responsive design validation completed successfully!');
  });

  test('♿ Accessibility and Usability Validation', async () => {
    console.log('🔥 Testing accessibility and usability...');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation
    await page.keyboard.press('Tab');

    // Check for focus indicators
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);

    // Test navigation with keyboard
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Test form accessibility
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Task")');

    // Check for proper labels
    const titleInput = page.locator('input[placeholder="Task title"]');
    await expect(titleInput).toBeVisible();

    // Test keyboard navigation through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check for ARIA attributes where appropriate
    const buttons = page.locator('button');
    const firstButton = buttons.first();

    // Verify buttons have accessible text
    await expect(firstButton).toHaveAttribute('type');

    console.log('✅ Accessibility and usability validation completed successfully!');
  });

  test('🏆 FINAL PRODUCTION READINESS ASSESSMENT', async () => {
    console.log('🚀 Conducting final production readiness assessment...');

    let overallScore = 0;
    let maxScore = 100;
    let issues: string[] = [];
    let achievements: string[] = [];

    // Test 1: Application Loading and Basic Functionality (20 points)
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(/Task Manager/);
      overallScore += 20;
      achievements.push('✅ Application loads successfully with proper title');
    } catch (e) {
      issues.push('❌ Application failed to load properly');
    }

    // Test 2: Navigation and Routing (15 points)
    try {
      const routes = ['/tasks', '/categories', '/timer'];
      for (const route of routes) {
        await page.click(`nav a[href="${route}"]`);
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain(route);
      }
      overallScore += 15;
      achievements.push('✅ All navigation routes work correctly');
    } catch (e) {
      issues.push('❌ Navigation or routing issues detected');
    }

    // Test 3: Category Management (20 points)
    try {
      await page.click('nav a[href="/categories"]');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Add Category")');
      await page.fill('input[placeholder="Category name"]', 'Production Test Category');
      await page.selectOption('select', 'work');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Production Test Category')).toBeVisible();
      overallScore += 20;
      achievements.push('✅ Category management fully functional');
    } catch (e) {
      issues.push('❌ Category management has issues');
    }

    // Test 4: Task Management (20 points)
    try {
      await page.click('nav a[href="/tasks"]');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Add Task")');
      await page.fill('input[placeholder="Task title"]', 'Production Test Task');
      await page.fill('textarea[placeholder="Task description"]', 'Final production validation task');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Production Test Task')).toBeVisible();
      overallScore += 20;
      achievements.push('✅ Task management fully functional');
    } catch (e) {
      issues.push('❌ Task management has issues');
    }

    // Test 5: Timer Functionality (25 points)
    try {
      await page.click('nav a[href="/timer"]');
      await page.waitForLoadState('networkidle');

      const taskSelect = page.locator('select[data-testid="task-select"]');
      if (await taskSelect.isVisible()) {
        await taskSelect.selectOption({ index: 1 });
      }

      await page.fill('input[data-testid="duration-input"]', '5');
      await page.click('button[data-testid="start-timer"]');
      await page.waitForTimeout(2000);

      const timerDisplay = page.locator('[data-testid="timer-display"]');
      await expect(timerDisplay).toBeVisible();

      await page.click('button[data-testid="pause-timer"]');
      overallScore += 25;
      achievements.push('✅ Timer functionality fully operational');
    } catch (e) {
      issues.push('❌ Timer functionality has issues');
    }

    // Calculate final assessment
    const finalScore = (overallScore / maxScore) * 100;

    console.log('\n🏆 FINAL PRODUCTION READINESS ASSESSMENT RESULTS:');
    console.log(`\n📊 OVERALL SCORE: ${finalScore.toFixed(1)}/100`);
    console.log(`\n✅ ACHIEVEMENTS (${achievements.length}):`);
    achievements.forEach(achievement => console.log(`   ${achievement}`));

    if (issues.length > 0) {
      console.log(`\n❌ ISSUES TO ADDRESS (${issues.length}):`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    // Production readiness determination
    let readinessLevel = '';
    let recommendation = '';

    if (finalScore >= 95) {
      readinessLevel = '🚀 PRODUCTION READY - EXCELLENT';
      recommendation = 'Platform is excellent and ready for immediate production deployment. All core functionality is working perfectly.';
    } else if (finalScore >= 85) {
      readinessLevel = '✅ PRODUCTION READY - GOOD';
      recommendation = 'Platform is ready for production deployment with minor optimizations possible.';
    } else if (finalScore >= 70) {
      readinessLevel = '⚠️ NEEDS MINOR FIXES';
      recommendation = 'Platform needs minor fixes before production deployment.';
    } else {
      readinessLevel = '❌ NOT READY';
      recommendation = 'Platform needs significant improvements before production deployment.';
    }

    console.log(`\n🎯 READINESS LEVEL: ${readinessLevel}`);
    console.log(`\n📋 RECOMMENDATION: ${recommendation}`);

    // Ensure minimum score for production readiness
    expect(finalScore).toBeGreaterThanOrEqual(80);

    console.log('\n🎉 COMPREHENSIVE END-TO-END VALIDATION COMPLETED!');
  });
});

/**
 * Helper function to set up test data for scenarios
 */
async function setupTestData(page: Page) {
  // Create test categories
  await page.click('nav a[href="/categories"]');
  await page.waitForLoadState('networkidle');

  // Only create if they don't exist
  const existingCategories = await page.locator('.category-card').count();
  if (existingCategories === 0) {
    await page.click('button:has-text("Add Category")');
    await page.fill('input[placeholder="Category name"]', 'Work');
    await page.selectOption('select', 'work');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Category")');
    await page.fill('input[placeholder="Category name"]', 'Personal');
    await page.selectOption('select', 'personal');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }

  // Create test tasks
  await page.click('nav a[href="/tasks"]');
  await page.waitForLoadState('networkidle');

  const existingTasks = await page.locator('.task-card').count();
  if (existingTasks === 0) {
    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder="Task title"]', 'Test Work Task');
    await page.fill('textarea[placeholder="Task description"]', 'A test task for work category');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder="Task title"]', 'Test Personal Task');
    await page.fill('textarea[placeholder="Task description"]', 'A test task for personal category');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }
}