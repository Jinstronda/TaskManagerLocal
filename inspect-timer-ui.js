const { chromium } = require('playwright');

async function inspectTimerUI() {
  console.log('🔍 Inspecting Timer UI Elements...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3000/timer');
    await page.waitForLoadState('networkidle');
    console.log('✅ Timer page loaded');

    // Take a screenshot for reference
    await page.screenshot({ path: 'timer-ui-inspection.png', fullPage: true });
    console.log('📸 Screenshot saved as timer-ui-inspection.png');

    // Find all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('\n🔘 All buttons found:');
    buttons.forEach((text, index) => {
      console.log(`  ${index + 1}. "${text}"`);
    });

    // Select Custom session
    await page.click('button:has-text("Custom")');
    await page.waitForTimeout(500);
    console.log('\n✅ Selected Custom session');

    // Find all buttons after selecting custom
    const buttonsAfterCustom = await page.locator('button').allTextContents();
    console.log('\n🔘 Buttons after selecting Custom:');
    buttonsAfterCustom.forEach((text, index) => {
      console.log(`  ${index + 1}. "${text}"`);
    });

    // Check timer display element
    const timerElement = await page.locator('.font-mono.font-bold');
    const timerExists = await timerElement.count();
    console.log(`\n⏰ Timer display element count: ${timerExists}`);

    if (timerExists > 0) {
      const timerText = await timerElement.textContent();
      console.log(`⏰ Timer display text: "${timerText}"`);
    }

    // Check for start/play buttons with different selectors
    const playButtonSelectors = [
      'button:has-text("Start")',
      'button:has-text("Play")',
      'button:has-text("▶")',
      'button[aria-label*="start"]',
      'button[aria-label*="play"]',
      'button svg[data-lucide="play"]',
      '[data-testid="start-button"]',
      '[data-testid="play-button"]'
    ];

    console.log('\n🎯 Checking for start/play buttons:');
    for (const selector of playButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✅ Found: ${selector} (${count} elements)`);
        const text = await page.locator(selector).first().textContent();
        console.log(`      Text: "${text}"`);
      } else {
        console.log(`  ❌ Not found: ${selector}`);
      }
    }

    // Check the HTML structure around timer
    const timerSectionHTML = await page.locator('div').filter({ hasText: /Timer|timer|Start|Play/ }).first().innerHTML();
    console.log('\n📝 Timer section HTML:');
    console.log(timerSectionHTML.substring(0, 500) + '...');

    // Wait a bit longer to examine the page
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Timer UI inspection completed!');
  }
}

inspectTimerUI().catch(console.error);