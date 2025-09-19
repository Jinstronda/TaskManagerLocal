const { chromium } = require('playwright');

async function quickTest() {
  console.log('🔧 Quick test to check if modal issue is fixed...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // Check if there's still a modal overlay blocking interactions
    const modalOverlay = await page.locator('.fixed.inset-0.bg-gray-900.bg-opacity-50').isVisible();

    if (modalOverlay) {
      console.log('🔴 Modal overlay is still present - need to clear localStorage');

      // Clear localStorage to reset onboarding state
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Reload page
      await page.reload({ waitUntil: 'networkidle' });

      const modalOverlayAfterClear = await page.locator('.fixed.inset-0.bg-gray-900.bg-opacity-50').isVisible();
      if (modalOverlayAfterClear) {
        console.log('🔴 Modal still present after clearing storage');
      } else {
        console.log('✅ Modal overlay removed after clearing storage');
      }
    } else {
      console.log('✅ No modal overlay found - issue appears to be fixed');
    }

    // Test basic navigation
    try {
      await page.click('text="Timer"', { timeout: 5000 });
      console.log('✅ Navigation to Timer page works');

      await page.click('text="Tasks"', { timeout: 5000 });
      console.log('✅ Navigation to Tasks page works');

      await page.click('text="Dashboard"', { timeout: 5000 });
      console.log('✅ Navigation to Dashboard page works');

    } catch (e) {
      console.log('🔴 Navigation still blocked:', e.message);
    }

    console.log('\n✨ Quick test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);