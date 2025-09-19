const { chromium } = require('playwright');

async function inspectCategories() {
  console.log('🔍 Inspecting Categories Page...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to categories page
    await page.goto('http://localhost:3000/categories');
    await page.waitForLoadState('networkidle');
    console.log('✅ Categories page loaded');

    // Get page content
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📝 Page content length:', bodyHTML.length);

    // Check for any h1, h2, h3 elements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('📄 Headings found:', headings);

    // Check for any text that contains "Categories"
    const categoryText = await page.locator('text=Categories').allTextContents();
    console.log('🗂️ "Categories" text found:', categoryText);

    // Check for any buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('🔘 Buttons found:', buttons);

    // Check for any error messages
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red').allTextContents();
    console.log('❌ Error messages:', errorElements);

    // Check console errors
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    // Wait a bit for any console errors
    await page.waitForTimeout(2000);
    console.log('🚨 Console errors:', consoleLogs);

    // Get network failures
    const networkFailures = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkFailures.push(`${response.status()} - ${response.url()}`);
      }
    });

    // Check for CategoryList component specifically
    const categoryListDiv = await page.locator('[class*="container"], [class*="max-w"]').count();
    console.log('📦 Container divs found:', categoryListDiv);

    // Check if there are any React error boundaries
    const reactErrors = await page.locator('text=Error', 'text=Something went wrong').allTextContents();
    console.log('⚛️ React errors:', reactErrors);

    // Take screenshot
    await page.screenshot({ path: 'categories-debug.png' });
    console.log('📸 Debug screenshot saved');

    // Try to navigate to a different page and back
    console.log('\n🔄 Testing navigation...');
    await page.goto('http://localhost:3000/timer');
    await page.waitForTimeout(1000);
    console.log('✅ Timer page loaded');

    await page.goto('http://localhost:3000/categories');
    await page.waitForTimeout(1000);
    console.log('✅ Back to categories page');

    // Check if CategoryList component loaded
    const categoryComponent = await page.locator('.space-y-3, [class*="category"]').count();
    console.log('🗂️ Category components found:', categoryComponent);

    // Try clicking on Categories navigation
    console.log('\n🔗 Testing navigation click...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);

    const categoriesNavLink = await page.locator('a[href="/categories"], text=Categories').first();
    const navLinkExists = await categoriesNavLink.count() > 0;
    console.log('🔗 Categories nav link exists:', navLinkExists);

    if (navLinkExists) {
      await categoriesNavLink.click();
      await page.waitForTimeout(2000);
      console.log('🔗 Clicked categories navigation');

      // Check if we're on the right page
      const currentURL = page.url();
      console.log('🌐 Current URL:', currentURL);
    }

    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 20 seconds for manual inspection...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Categories page inspection completed!');
  }
}

inspectCategories().catch(console.error);