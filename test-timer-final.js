const { chromium } = require('playwright');

async function testTimerFixed() {
  console.log('🔧 Testing Timer after fix...\\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3004/timer', { waitUntil: 'networkidle' });
    console.log('✅ Timer page loaded');

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);

    // Check initial timer display
    const timerDisplay = page.locator('.font-mono.font-bold');
    const initialTime = await timerDisplay.textContent();
    console.log(`⏰ Initial timer display: "${initialTime}"`);

    if (initialTime === '50:00') {
      console.log('🎉 SUCCESS! Timer now shows correct initial time (50:00)');
    } else if (initialTime === '00:00') {
      console.log('🔴 STILL BROKEN: Timer still shows 00:00');
      // Check if the page needs a refresh to pick up the changes
      await page.reload();
      await page.waitForTimeout(2000);
      const afterReloadTime = await timerDisplay.textContent();
      console.log(`⏰ After reload: "${afterReloadTime}"`);
    } else {
      console.log(`🟡 UNEXPECTED: Timer shows "${initialTime}" instead of 50:00`);
    }

    // Test session type switching
    console.log('\\n📋 Testing session type switching...');

    // Click Quick Task (15 min)
    const quickTaskButton = page.getByRole('button', { name: 'Quick Task 15 min Short,' });
    await quickTaskButton.click();
    console.log('✅ Selected Quick Task session');

    await page.waitForTimeout(1000);

    const quickTaskTime = await timerDisplay.textContent();
    console.log(`⏰ Quick Task time: "${quickTaskTime}"`);

    if (quickTaskTime === '15:00') {
      console.log('🎉 SUCCESS! Session type switching works correctly');
    } else {
      console.log(`🔴 ISSUE: Expected 15:00, got "${quickTaskTime}"`);
    }

    // Test timer start and countdown
    console.log('\\n▶️ Testing timer start and countdown...');

    const startButton = page.locator('button.bg-green-500');
    await startButton.click();
    console.log('✅ Start button clicked');

    await page.waitForTimeout(2000);

    const startTime = await timerDisplay.textContent();
    console.log(`⏰ Time after start: "${startTime}"`);

    // Wait 10 seconds to see countdown
    console.log('⏳ Waiting 10 seconds to verify countdown...');
    await page.waitForTimeout(10000);

    const timeAfter10Seconds = await timerDisplay.textContent();
    console.log(`⏰ Time after 10 seconds: "${timeAfter10Seconds}"`);

    function parseTime(timeStr) {
      const match = timeStr.match(/(\\d{1,2}):(\\d{2})/);
      if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      }
      return 0;
    }

    const startSeconds = parseTime(startTime);
    const after10Seconds = parseTime(timeAfter10Seconds);
    const actualDiff = startSeconds - after10Seconds;

    console.log(`\\n📊 Countdown analysis:`);
    console.log(`  Start time: ${startTime} (${startSeconds} seconds)`);
    console.log(`  After 10s: ${timeAfter10Seconds} (${after10Seconds} seconds)`);
    console.log(`  Expected decrease: ~10 seconds`);
    console.log(`  Actual decrease: ${actualDiff} seconds`);

    if (actualDiff >= 8 && actualDiff <= 12) {
      console.log('🎉 SUCCESS! Timer countdown is working perfectly!');
    } else if (actualDiff === 0) {
      console.log('🔴 CRITICAL: Timer is still stuck - countdown not working');
    } else {
      console.log(`🟡 PARTIAL: Countdown working but timing is off by ${Math.abs(actualDiff - 10)} seconds`);
    }

    console.log('\\n🎉 Timer test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testTimerFixed().catch(console.error);