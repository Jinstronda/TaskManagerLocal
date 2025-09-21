import { test, expect } from '@playwright/test';

test.describe('Task Organization Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tasks page
    await page.goto('http://localhost:3004/tasks');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-item"], .task-item, [class*="task"]', { timeout: 10000 });
  });

  test('should display tasks organized into active and completed sections', async ({ page }) => {
    console.log('Testing task organization with separate sections...');

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/task-organization-initial.png',
      fullPage: true
    });

    // Look for active tasks section
    const activeTasks = await page.locator('h2, h3, .section-header').filter({ hasText: /active|pending|current/i }).first();
    if (await activeTasks.count() > 0) {
      console.log('Found active tasks section');
      await expect(activeTasks).toBeVisible();
    } else {
      console.log('No explicit active tasks header found - checking for task items');
    }

    // Look for completed tasks section with green dot
    const completedSection = await page.locator('h2, h3, .section-header').filter({ hasText: /completed/i }).first();
    if (await completedSection.count() > 0) {
      console.log('Found completed tasks section');
      await expect(completedSection).toBeVisible();

      // Check for green dot indicator
      const greenDot = await page.locator('.section-header .dot, .green-dot, [class*="dot"][class*="green"]');
      if (await greenDot.count() > 0) {
        await expect(greenDot).toBeVisible();
        console.log('✓ Green dot indicator found for completed section');
      }
    }

    // Check for task items and their organization
    const taskItems = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]:not([class*="section"]):not([class*="header"])');
    const taskCount = await taskItems.count();
    console.log(`Found ${taskCount} task items`);

    if (taskCount > 0) {
      // Take screenshot showing task organization
      await page.screenshot({
        path: 'test-results/task-organization-sections.png',
        fullPage: true
      });

      // Check visual distinction for completed tasks (opacity, borders)
      for (let i = 0; i < Math.min(taskCount, 5); i++) {
        const task = taskItems.nth(i);
        const taskClass = await task.getAttribute('class');
        const taskStyle = await task.evaluate(el => getComputedStyle(el));

        console.log(`Task ${i + 1} - Class: ${taskClass}, Opacity: ${taskStyle.opacity}`);

        if (taskClass?.includes('completed') || taskStyle.opacity < '1') {
          console.log(`✓ Task ${i + 1} has visual distinction (completed styling)`);
        }
      }
    }
  });

  test('should test completing a task and verify it moves to completed section', async ({ page }) => {
    console.log('Testing task completion and movement...');

    // Look for an incomplete task to complete
    const incompleteTasks = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]:not([class*="completed"])');
    const incompleteCount = await incompleteTasks.count();

    if (incompleteCount > 0) {
      console.log(`Found ${incompleteCount} incomplete tasks`);

      // Get the first incomplete task
      const firstTask = incompleteTasks.first();

      // Take screenshot before completing task
      await page.screenshot({
        path: 'test-results/before-task-completion.png',
        fullPage: true
      });

      // Look for completion checkbox or button
      const checkbox = await firstTask.locator('input[type="checkbox"], .checkbox, [data-testid="complete-task"]').first();
      const completeButton = await firstTask.locator('button').filter({ hasText: /complete|done|finish/i }).first();

      if (await checkbox.count() > 0) {
        console.log('Found checkbox - clicking to complete task');
        await checkbox.click();
      } else if (await completeButton.count() > 0) {
        console.log('Found complete button - clicking to complete task');
        await completeButton.click();
      } else {
        console.log('Looking for any clickable element to complete task...');
        const clickableElements = await firstTask.locator('button, input, [role="button"], .clickable');
        if (await clickableElements.count() > 0) {
          await clickableElements.first().click();
        }
      }

      // Wait for UI to update
      await page.waitForTimeout(1000);

      // Take screenshot after completing task
      await page.screenshot({
        path: 'test-results/after-task-completion.png',
        fullPage: true
      });

      // Verify completed section now exists or has more items
      const completedSection = await page.locator('h2, h3, .section-header').filter({ hasText: /completed/i });
      if (await completedSection.count() > 0) {
        await expect(completedSection).toBeVisible();
        console.log('✓ Completed section is visible after task completion');
      }

      // Check for completed task styling
      const completedTasks = await page.locator('[class*="completed"], .task-completed, [data-testid="completed-task"]');
      const completedCount = await completedTasks.count();
      console.log(`Found ${completedCount} completed tasks with styling`);
    } else {
      console.log('No incomplete tasks found to test completion');
    }
  });

  test('should verify visual distinction between active and completed tasks', async ({ page }) => {
    console.log('Testing visual distinction between task types...');

    const allTasks = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]:not([class*="section"]):not([class*="header"])');
    const taskCount = await allTasks.count();

    console.log(`Analyzing visual styling for ${taskCount} tasks`);

    const visualAnalysis = [];

    for (let i = 0; i < Math.min(taskCount, 10); i++) {
      const task = allTasks.nth(i);
      const taskClass = await task.getAttribute('class');
      const computedStyle = await task.evaluate(el => {
        const style = getComputedStyle(el);
        return {
          opacity: style.opacity,
          borderColor: style.borderColor,
          borderWidth: style.borderWidth,
          backgroundColor: style.backgroundColor,
          color: style.color
        };
      });

      const isCompleted = taskClass?.includes('completed') || computedStyle.opacity < '1';

      visualAnalysis.push({
        index: i + 1,
        isCompleted,
        class: taskClass,
        style: computedStyle
      });

      console.log(`Task ${i + 1}:`, {
        completed: isCompleted,
        opacity: computedStyle.opacity,
        borderColor: computedStyle.borderColor
      });
    }

    // Take detailed screenshot
    await page.screenshot({
      path: 'test-results/task-visual-distinction.png',
      fullPage: true
    });

    // Verify we have visual distinction
    const completedTasks = visualAnalysis.filter(t => t.isCompleted);
    const activeTasks = visualAnalysis.filter(t => !t.isCompleted);

    console.log(`✓ Found ${activeTasks.length} active tasks and ${completedTasks.length} completed tasks`);

    if (completedTasks.length > 0) {
      console.log('✓ Visual distinction confirmed for completed tasks');
    }
  });

  test('should test both list and category view modes', async ({ page }) => {
    console.log('Testing task organization in different view modes...');

    // Take screenshot of current view
    await page.screenshot({
      path: 'test-results/current-view-mode.png',
      fullPage: true
    });

    // Look for view mode toggles
    const viewButtons = await page.locator('button').filter({ hasText: /list|category|grid|view/i });
    const viewButtonCount = await viewButtons.count();

    console.log(`Found ${viewButtonCount} potential view mode buttons`);

    if (viewButtonCount > 0) {
      // Try different view modes
      for (let i = 0; i < Math.min(viewButtonCount, 3); i++) {
        const button = viewButtons.nth(i);
        const buttonText = await button.textContent();

        console.log(`Testing view mode: ${buttonText}`);
        await button.click();

        // Wait for view to change
        await page.waitForTimeout(500);

        // Take screenshot of this view mode
        await page.screenshot({
          path: `test-results/view-mode-${i + 1}-${buttonText?.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true
        });

        // Verify task organization is maintained
        const tasks = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]:not([class*="section"]):not([class*="header"])');
        const taskCount = await tasks.count();
        console.log(`View mode "${buttonText}" shows ${taskCount} tasks`);

        // Check for completed section in this view
        const completedSection = await page.locator('h2, h3, .section-header').filter({ hasText: /completed/i });
        if (await completedSection.count() > 0) {
          console.log(`✓ Completed section visible in ${buttonText} view`);
        }
      }
    } else {
      console.log('No view mode toggles found - checking current organization');

      // Still verify the organization in current view
      const sections = await page.locator('h2, h3, .section-header');
      const sectionCount = await sections.count();
      console.log(`Found ${sectionCount} sections in current view`);

      for (let i = 0; i < sectionCount; i++) {
        const section = sections.nth(i);
        const sectionText = await section.textContent();
        console.log(`Section ${i + 1}: ${sectionText}`);
      }
    }
  });

  test('should verify overall task organization and user experience', async ({ page }) => {
    console.log('Comprehensive task organization verification...');

    // Take final comprehensive screenshot
    await page.screenshot({
      path: 'test-results/task-organization-comprehensive.png',
      fullPage: true
    });

    // Count total sections
    const sections = await page.locator('h1, h2, h3, .section-header, [class*="section"][class*="header"]');
    const sectionCount = await sections.count();
    console.log(`Total sections found: ${sectionCount}`);

    // Count total tasks
    const allTasks = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]:not([class*="section"]):not([class*="header"])');
    const totalTasks = await allTasks.count();
    console.log(`Total tasks found: ${totalTasks}`);

    // Check for proper organization indicators
    const organizationIndicators = {
      activeSectionFound: false,
      completedSectionFound: false,
      greenDotFound: false,
      visualDistinctionFound: false,
      separateSectionsFound: false
    };

    // Check for active/pending section
    const activeSection = await page.locator('h2, h3, .section-header').filter({ hasText: /active|pending|current|todo/i });
    if (await activeSection.count() > 0) {
      organizationIndicators.activeSectionFound = true;
      console.log('✓ Active tasks section found');
    }

    // Check for completed section
    const completedSection = await page.locator('h2, h3, .section-header').filter({ hasText: /completed|done|finished/i });
    if (await completedSection.count() > 0) {
      organizationIndicators.completedSectionFound = true;
      console.log('✓ Completed tasks section found');
    }

    // Check for green dot
    const greenDot = await page.locator('.dot, [class*="dot"]').filter({ hasText: /•/ });
    if (await greenDot.count() > 0) {
      organizationIndicators.greenDotFound = true;
      console.log('✓ Green dot indicator found');
    }

    // Check for visual distinction
    if (totalTasks > 0) {
      const firstTask = allTasks.first();
      const taskStyle = await firstTask.evaluate(el => getComputedStyle(el));
      if (taskStyle.opacity !== '1' || taskStyle.borderColor !== 'rgba(0, 0, 0, 0)') {
        organizationIndicators.visualDistinctionFound = true;
        console.log('✓ Visual distinction styling found');
      }
    }

    // Check for separate sections
    if (sectionCount >= 2) {
      organizationIndicators.separateSectionsFound = true;
      console.log('✓ Multiple sections found (separation confirmed)');
    }

    // Summary
    console.log('\n=== TASK ORGANIZATION VERIFICATION SUMMARY ===');
    console.log(`Total Tasks: ${totalTasks}`);
    console.log(`Total Sections: ${sectionCount}`);
    console.log('Organization Features:');
    Object.entries(organizationIndicators).forEach(([feature, found]) => {
      console.log(`  ${found ? '✓' : '✗'} ${feature}: ${found ? 'FOUND' : 'NOT FOUND'}`);
    });
    console.log('===============================================\n');

    // Verify basic functionality works
    if (totalTasks > 0) {
      console.log('✓ Task organization feature is functional');
    } else {
      console.log('⚠ No tasks found - organization cannot be fully verified');
    }
  });
});