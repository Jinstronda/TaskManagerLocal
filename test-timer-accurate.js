const { chromium } = require('playwright');

async function testTimerAccurate() {
  console.log('🔧 Testing Timer with accurate parsing...\\n');

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

    await page.waitForTimeout(3000);

    // Check initial timer display
    const timerDisplay = page.locator('.font-mono.font-bold');
    const initialTime = await timerDisplay.textContent();
    console.log(`⏰ Initial timer display: "${initialTime}"`);

    // Select Custom session for faster testing
    const customButton = page.getByRole('button', { name: 'Custom 25 min Customizable' });
    await customButton.click();
    console.log('✅ Selected Custom session');

    await page.waitForTimeout(1000);

    const customTime = await timerDisplay.textContent();
    console.log(`⏰ Custom session time: "${customTime}"`);

    // Find and click the start button
    const startButton = page.locator('button.bg-green-500');
    await startButton.click();
    console.log('✅ Start button clicked');

    await page.waitForTimeout(2000);

    const startTime = await timerDisplay.textContent();
    console.log(`⏰ Time after start: "${startTime}"`);

    // More accurate time parsing - MM:SS format
    function parseTimeAccurate(timeStr) {
      const match = timeStr.match(/(\\d{1,2}):(\\d{2})/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        return minutes * 60 + seconds; // Convert to total seconds
      }
      return 0;
    }

    const startSeconds = parseTimeAccurate(startTime);
    console.log(`⏰ Start time in seconds: ${startSeconds}`);

    // Wait and check if countdown decreases
    console.log('⏳ Waiting 15 seconds to verify countdown...');
    await page.waitForTimeout(15000);

    const timeAfter15Seconds = await timerDisplay.textContent();
    const after15Seconds = parseTimeAccurate(timeAfter15Seconds);

    console.log(`⏰ Time after 15 seconds: "${timeAfter15Seconds}" (${after15Seconds}s)`);

    const actualDiff = startSeconds - after15Seconds;
    console.log(`\\n📊 Countdown analysis:`);
    console.log(`  Start: ${startTime} (${startSeconds} seconds)`);
    console.log(`  After 15s: ${timeAfter15Seconds} (${after15Seconds} seconds)`);
    console.log(`  Expected decrease: ~15 seconds`);
    console.log(`  Actual decrease: ${actualDiff} seconds`);

    if (actualDiff >= 10 && actualDiff <= 20) {
      console.log('🎉 SUCCESS! Timer countdown is working!');
    } else if (actualDiff === 0) {
      console.log('🔴 CRITICAL: Timer is stuck - no countdown');

      // Let's check if the timer service is even running
      const debugInfo = await page.evaluate(() => {
        // Check if there are any intervals running
        const intervalInfo = {
          intervalExists: typeof setInterval !== 'undefined',
          activeIntervals: 'unknown'
        };

        // Check for any timer-related globals
        const globals = Object.keys(window).filter(key =>
          key.toLowerCase().includes('timer') ||
          key.toLowerCase().includes('interval')
        );

        return {
          intervalInfo,
          globals,
          timestamp: Date.now()
        };
      });

      console.log('🔧 Debug info:', debugInfo);
    } else {
      console.log(`🟡 PARTIAL: Countdown working but timing off by ${Math.abs(actualDiff - 15)} seconds`);
    }

    console.log('\\n✨ Timer test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testTimerAccurate().catch(console.error);