const { chromium } = require('playwright');

async function testCategoryManagement() {
  console.log('🗂️ Testing Category Management Functionality...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to categories page
    await page.goto('http://localhost:3000/categories');
    await page.waitForLoadState('networkidle');
    console.log('✅ Categories page loaded');

    // Take a screenshot
    await page.screenshot({ path: 'categories-page.png' });
    console.log('📸 Screenshot saved as categories-page.png');

    // Check if the page has the expected content
    const pageTitle = await page.locator('h2').first().textContent();
    console.log(`📝 Page title: "${pageTitle}"`);

    // Check for Add Category button
    const addButton = await page.locator('button:has-text("Add Category")').first();
    const addButtonExists = await addButton.count() > 0;
    console.log(`🔘 Add Category button: ${addButtonExists ? '✅ Found' : '❌ Not found'}`);

    // Check for existing categories
    const categoryCards = await page.locator('[data-testid="category-card"], .border.rounded-lg').count();
    console.log(`📂 Category cards found: ${categoryCards}`);

    // Check for the "General" category
    const generalCategory = await page.locator('text=General').first();
    const generalExists = await generalCategory.count() > 0;
    console.log(`🗂️ "General" category: ${generalExists ? '✅ Found' : '❌ Not found'}`);

    // Test creating a new category
    if (addButtonExists) {
      console.log('\n🆕 Testing category creation...');
      await addButton.click();
      await page.waitForTimeout(1000);

      // Check if form modal opened
      const modal = await page.locator('[role="dialog"], .fixed.inset-0').first();
      const modalExists = await modal.count() > 0;
      console.log(`📝 Category form modal: ${modalExists ? '✅ Opened' : '❌ Not found'}`);

      if (modalExists) {
        // Try to fill out the form
        const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i]').first();
        const nameInputExists = await nameInput.count() > 0;

        if (nameInputExists) {
          await nameInput.fill('Test Category');
          console.log('✏️ Filled category name: "Test Category"');

          // Check for color picker
          const colorInput = await page.locator('input[type="color"], input[name="color"]').first();
          const colorInputExists = await colorInput.count() > 0;
          if (colorInputExists) {
            await colorInput.fill('#FF6B35');
            console.log('🎨 Set category color: #FF6B35');
          }

          // Look for save button
          const saveButton = await page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
          const saveButtonExists = await saveButton.count() > 0;
          console.log(`💾 Save button: ${saveButtonExists ? '✅ Found' : '❌ Not found'}`);

          if (saveButtonExists) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            console.log('💾 Clicked save button');
          }
        }

        // Close modal (if still open)
        const closeButton = await page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]').first();
        const closeButtonExists = await closeButton.count() > 0;
        if (closeButtonExists) {
          await closeButton.click();
          console.log('❌ Closed modal');
        }
      }
    }

    // Test delete functionality
    console.log('\n🗑️ Testing delete functionality...');

    // Look for delete buttons (trash icons)
    const deleteButtons = await page.locator('button[title*="Delete"], button:has([data-lucide="trash"]), button:has(.lucide-trash)').count();
    console.log(`🗑️ Delete buttons found: ${deleteButtons}`);

    if (deleteButtons > 0) {
      console.log('✅ Delete functionality appears to be available');
    } else {
      console.log('⚠️ Delete buttons not found (might be hidden or use different selectors)');
    }

    // Check API connectivity
    console.log('\n🔌 Testing API connectivity...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          return { success: true, count: data.data?.length || 0 };
        } else {
          return { success: false, status: response.status };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(`🔌 API test result:`, apiResponse);

    // Final summary
    console.log('\n📊 Category Management Test Summary:');
    console.log('==========================================');
    console.log(`✅ Page loads: ${pageTitle === 'Categories'}`);
    console.log(`✅ Add button: ${addButtonExists}`);
    console.log(`✅ Category cards: ${categoryCards > 0}`);
    console.log(`✅ General category: ${generalExists}`);
    console.log(`✅ Delete buttons: ${deleteButtons > 0}`);
    console.log(`✅ API connectivity: ${apiResponse.success}`);

    if (apiResponse.success) {
      console.log(`📂 Categories in database: ${apiResponse.count}`);
    }

    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Category management test completed!');
  }
}

testCategoryManagement().catch(console.error);