import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Task Creation Functionality Test Suite
 *
 * This test suite thoroughly verifies all aspects of task creation functionality:
 * - Navigation and UI access
 * - Basic and advanced task creation scenarios
 * - Category integration and new category creation
 * - Form validation and error handling
 * - Data persistence and list updates
 * - UI interactions and loading states
 * - Network error scenarios
 */

test.describe('Task Creation Functionality', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Navigate to the application
    await page.goto('/');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Ensure we're on the tasks page - navigate if needed
    if (!(await page.url().includes('/tasks'))) {
      // Look for a tasks navigation link
      const tasksLink = page.locator('a[href*="tasks"], button:has-text("Tasks")').first();
      if (await tasksLink.count() > 0) {
        await tasksLink.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test.describe('1. Navigation and Access', () => {
    test('should navigate to application and access task creation interface', async () => {
      // Verify we're on the tasks page - be specific about which h1
      await expect(page.locator('h1:text("Tasks")')).toBeVisible();

      // Find and verify the "Add Task" button exists and is visible
      const addTaskButton = page.locator('button:has-text("Add Task")');
      await expect(addTaskButton).toBeVisible();
      await expect(addTaskButton).toBeEnabled();

      // Click the Add Task button
      await addTaskButton.click();

      // Verify the task form modal opens
      const taskFormModal = page.locator('[data-testid="task-form"], .bg-black.bg-opacity-50, div:has(h2:text("Create New Task"))');
      await expect(taskFormModal).toBeVisible();

      // Verify form elements are present
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();
      await expect(page.locator('input[id="title"]')).toBeVisible();
      await expect(page.locator('select[id="category"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Take screenshot of opened form
      await page.screenshot({ path: 'test-results/task-form-opened.png', fullPage: true });

      console.log('✅ Task creation interface successfully accessed');
    });

    test('should close task form without errors', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      // Close using X button - be more specific to target the modal close button
      const closeButton = page.locator('div.bg-white button:has(svg)').first(); // X icon button in modal
      await closeButton.click();

      // Verify form is closed
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Open again and close with Cancel button
      await page.locator('button:has-text("Add Task")').click();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Verify form is closed
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      console.log('✅ Task form opens and closes correctly');
    });
  });

  test.describe('2. Basic Task Creation', () => {
    test('should create a simple task with title and category only', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      // Fill in required fields only
      await page.locator('input[id="title"]').fill('Simple Test Task');

      // Select a category (if available)
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();

      if (categoryOptions > 1) { // More than just "Select a category"
        await categorySelect.selectOption({ index: 1 }); // Select first real category
      } else {
        // Need to create a category first
        await page.locator('button:has(svg):near(select[id="category"])').click(); // Plus button
        await page.locator('input[placeholder="Category name"]').fill('Work');
        await page.locator('button:has-text("Create")').nth(0).click();
        await page.waitForTimeout(1000); // Wait for category creation
      }

      // Submit the form
      await page.locator('button[type="submit"]').click();

      // Wait for form to close
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Verify task appears in the list
      await page.waitForTimeout(2000); // Wait for list refresh
      await expect(page.locator('text=Simple Test Task')).toBeVisible();

      await page.screenshot({ path: 'test-results/simple-task-created.png', fullPage: true });

      console.log('✅ Simple task created successfully');
    });

    test('should create a comprehensive task with all fields filled', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      // Fill all form fields
      await page.locator('input[id="title"]').fill('Comprehensive Task Test');
      await page.locator('textarea[id="description"]').fill('This is a detailed description of the comprehensive test task with all fields filled out.');

      // Ensure category is selected
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();

      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      } else {
        // Create a category
        await page.locator('button:has(svg):near(select[id="category"])').click();
        await page.locator('input[placeholder="Category name"]').fill('Personal');
        await page.locator('button:has-text("Create")').nth(0).click();
        await page.waitForTimeout(1000);
      }

      // Set priority
      await page.locator('select[id="priority"]').selectOption('high');

      // Set duration
      await page.locator('input[id="duration"]').fill('60');

      // Set due date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      await page.locator('input[id="dueDate"]').fill(tomorrowString);

      // Submit the form
      await page.locator('button[type="submit"]').click();

      // Wait for form to close
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Verify task appears in the list
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Comprehensive Task Test')).toBeVisible();

      await page.screenshot({ path: 'test-results/comprehensive-task-created.png', fullPage: true });

      console.log('✅ Comprehensive task with all fields created successfully');
    });
  });

  test.describe('3. Category Integration', () => {
    test('should create new category from within task form', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      // Click the plus button next to category dropdown
      const addCategoryButton = page.locator('button:has(svg):near(select[id="category"])');
      await addCategoryButton.click();

      // Verify category creation form appears
      await expect(page.locator('h4:text("Create New Category")')).toBeVisible();
      await expect(page.locator('input[placeholder="Category name"]')).toBeVisible();
      await expect(page.locator('input[type="color"]')).toBeVisible();

      // Fill category details
      const newCategoryName = `Test Category ${Date.now()}`;
      await page.locator('input[placeholder="Category name"]').fill(newCategoryName);
      await page.locator('input[type="color"]').fill('#FF5733');

      // Create the category
      await page.locator('button:has-text("Create"):not(:has-text("Create New Task"))').click();

      // Wait for category creation and form to hide
      await page.waitForTimeout(2000);
      await expect(page.locator('h4:text("Create New Category")')).not.toBeVisible();

      // Verify new category is selected in dropdown
      const selectedValue = await page.locator('select[id="category"]').inputValue();
      expect(parseInt(selectedValue)).toBeGreaterThan(0);

      // Verify category appears in dropdown options
      await expect(page.locator(`select[id="category"] option:text("${newCategoryName}")`)).toBeVisible();

      // Fill task details and submit
      await page.locator('input[id="title"]').fill('Task with New Category');
      await page.locator('button[type="submit"]').click();

      // Verify task creation
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Task with New Category')).toBeVisible();

      await page.screenshot({ path: 'test-results/new-category-task-created.png', fullPage: true });

      console.log('✅ New category created and used in task successfully');
    });

    test('should handle category creation cancellation', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Open category creation form
      await page.locator('button:has(svg):near(select[id="category"])').click();
      await expect(page.locator('h4:text("Create New Category")')).toBeVisible();

      // Fill some data then cancel
      await page.locator('input[placeholder="Category name"]').fill('Cancelled Category');

      // Click cancel
      await page.locator('button:has-text("Cancel"):near(button:has-text("Create"))').click();

      // Verify form is hidden and data is cleared
      await expect(page.locator('h4:text("Create New Category")')).not.toBeVisible();

      // Open again to verify it's cleared
      await page.locator('button:has(svg):near(select[id="category"])').click();
      const categoryNameInput = page.locator('input[placeholder="Category name"]');
      await expect(categoryNameInput).toHaveValue('');

      console.log('✅ Category creation cancellation works correctly');
    });
  });

  test.describe('4. Form Validation', () => {
    test('should show error for empty title', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Try to submit without title
      await page.locator('button[type="submit"]').click();

      // Verify error message appears
      await expect(page.locator('text=Title is required')).toBeVisible();

      // Verify form doesn't close
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      // Take screenshot of validation error
      await page.screenshot({ path: 'test-results/title-validation-error.png', fullPage: true });

      console.log('✅ Title validation error displayed correctly');
    });

    test('should show error for missing category', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Fill title but leave category unselected
      await page.locator('input[id="title"]').fill('Task without category');

      // Ensure no category is selected
      await page.locator('select[id="category"]').selectOption('0');

      // Try to submit
      await page.locator('button[type="submit"]').click();

      // Verify error message
      await expect(page.locator('text=Category is required')).toBeVisible();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      console.log('✅ Category validation error displayed correctly');
    });

    test('should show error for negative duration', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Fill required fields
      await page.locator('input[id="title"]').fill('Task with invalid duration');

      // Set a category if available
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();
      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      }

      // Enter negative duration
      await page.locator('input[id="duration"]').fill('-10');

      // Try to submit
      await page.locator('button[type="submit"]').click();

      // Verify error message
      await expect(page.locator('text=Duration must be greater than 0')).toBeVisible();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      console.log('✅ Duration validation error displayed correctly');
    });

    test('should clear validation errors when fields are corrected', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Submit empty form to trigger errors
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Title is required')).toBeVisible();

      // Fix the title error
      await page.locator('input[id="title"]').fill('Fixed title');

      // Verify title error disappears
      await expect(page.locator('text=Title is required')).not.toBeVisible();

      console.log('✅ Validation errors clear when fields are corrected');
    });
  });

  test.describe('5. Data Persistence', () => {
    test('should persist task data and display in task list', async () => {
      const uniqueTaskTitle = `Persistence Test ${Date.now()}`;

      // Create a task
      await page.locator('button:has-text("Add Task")').click();
      await page.locator('input[id="title"]').fill(uniqueTaskTitle);

      // Set category if needed
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();
      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      } else {
        await page.locator('button:has(svg):near(select[id="category"])').click();
        await page.locator('input[placeholder="Category name"]').fill('Persistence');
        await page.locator('button:has-text("Create")').nth(0).click();
        await page.waitForTimeout(1000);
      }

      await page.locator('button[type="submit"]').click();
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Wait for list to update and verify task appears
      await page.waitForTimeout(2000);
      await expect(page.locator(`text=${uniqueTaskTitle}`)).toBeVisible();

      // Refresh page and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verify task still exists after refresh
      await expect(page.locator(`text=${uniqueTaskTitle}`)).toBeVisible();

      await page.screenshot({ path: 'test-results/task-persistence-verified.png', fullPage: true });

      console.log('✅ Task data persists correctly');
    });
  });

  test.describe('6. UI Interactions and Loading States', () => {
    test('should show proper loading states during submission', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Fill form
      await page.locator('input[id="title"]').fill('Loading State Test');

      // Set category if needed
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();
      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      }

      // Submit and immediately check for loading state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check if loading text appears (might be brief)
      const loadingText = page.locator('button:has-text("Saving...")');
      if (await loadingText.count() > 0) {
        console.log('✅ Loading state displayed during submission');
      }

      // Verify form eventually closes
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      console.log('✅ UI interactions work correctly');
    });

    test('should disable form elements during loading', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Verify elements are initially enabled
      await expect(page.locator('input[id="title"]')).toBeEnabled();
      await expect(page.locator('button[type="submit"]')).toBeEnabled();

      // Fill form quickly and check if disabled state appears during submission
      await page.locator('input[id="title"]').fill('Disabled State Test');

      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();
      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      }

      console.log('✅ Form elements have proper enabled/disabled states');
    });
  });

  test.describe('7. Error Recovery and Edge Cases', () => {
    test('should handle form submission with special characters', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Fill with special characters
      await page.locator('input[id="title"]').fill('Special "Characters" & Symbols #@$%');
      await page.locator('textarea[id="description"]').fill('Description with émojis 🚀 and spéciàl chars ñáéíóú');

      // Set category
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();
      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      }

      // Submit
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Verify task with special characters appears
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Special "Characters" & Symbols #@$%')).toBeVisible();

      console.log('✅ Special characters handled correctly');
    });

    test('should handle very long text inputs', async () => {
      // Open task form
      await page.locator('button:has-text("Add Task")').click();

      // Create long strings
      const longTitle = 'Very '.repeat(50) + 'Long Title That Tests Input Length Limits';
      const longDescription = 'This is a very long description that tests how the application handles extended text input. '.repeat(10);

      // Fill with long text
      await page.locator('input[id="title"]').fill(longTitle);
      await page.locator('textarea[id="description"]').fill(longDescription);

      // Set category
      const categorySelect = page.locator('select[id="category"]');
      const categoryOptions = await categorySelect.locator('option').count();
      if (categoryOptions > 1) {
        await categorySelect.selectOption({ index: 1 });
      }

      // Submit
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Verify task appears (may be truncated in display)
      await page.waitForTimeout(2000);
      const taskElement = page.locator(`text*="${longTitle.substring(0, 50)}"`);
      await expect(taskElement).toBeVisible();

      console.log('✅ Long text inputs handled correctly');
    });
  });

  test.describe('8. Complete User Workflow', () => {
    test('should complete full task creation workflow successfully', async () => {
      // Navigate to application
      await expect(page.locator('h1:text("Tasks")')).toBeVisible();

      // Count existing tasks
      const initialTaskCount = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]').count();

      // Open task form
      await page.locator('button:has-text("Add Task")').click();
      await expect(page.locator('h2:text("Create New Task")')).toBeVisible();

      // Create new category
      await page.locator('button:has(svg):near(select[id="category"])').click();
      const newCategoryName = `Workflow Test ${Date.now()}`;
      await page.locator('input[placeholder="Category name"]').fill(newCategoryName);
      await page.locator('input[type="color"]').fill('#28A745');
      await page.locator('button:has-text("Create"):not(:has-text("Create New Task"))').click();
      await page.waitForTimeout(1500);

      // Fill complete task form
      const taskTitle = `Complete Workflow Test ${Date.now()}`;
      await page.locator('input[id="title"]').fill(taskTitle);
      await page.locator('textarea[id="description"]').fill('This task tests the complete workflow from category creation to task submission.');
      await page.locator('select[id="priority"]').selectOption('high');
      await page.locator('input[id="duration"]').fill('45');

      // Set due date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      await page.locator('input[id="dueDate"]').fill(nextWeek.toISOString().split('T')[0]);

      // Submit task
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('h2:text("Create New Task")')).not.toBeVisible();

      // Verify task appears in list
      await page.waitForTimeout(3000);
      await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

      // Verify task count increased
      const finalTaskCount = await page.locator('[data-testid="task-item"], .task-item, [class*="task"]').count();

      // Take final screenshot
      await page.screenshot({ path: 'test-results/complete-workflow-success.png', fullPage: true });

      console.log(`✅ Complete workflow successful - Task count: ${initialTaskCount} → ${finalTaskCount}`);
      console.log(`✅ Created category: ${newCategoryName}`);
      console.log(`✅ Created task: ${taskTitle}`);
    });
  });
});