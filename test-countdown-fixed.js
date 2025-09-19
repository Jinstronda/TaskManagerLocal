const { chromium } = require('playwright');

async function testTimerCountdown() {
  console.log('🔧 Testing Timer countdown functionality...\\n');

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
    await page.waitForTimeout(2000);

    // Look for the timer display with the correct classes
    const timerDisplay = page.locator('.font-mono.font-bold');
    const isTimerDisplayVisible = await timerDisplay.isVisible();
    console.log(`⏰ Timer display visible: ${isTimerDisplayVisible}`);

    if (!isTimerDisplayVisible) {
      // Fallback: look for any large text element
      const allTextElements = await page.locator('*').evaluateAll(elements => {
        return elements
          .filter(el => el.textContent && el.textContent.match(/\\d{1,2}:\\d{2}/))
          .map(el => ({
            text: el.textContent,
            classes: el.className,
            tagName: el.tagName
          }));
      });
      console.log('🔍 Found time-like elements:', allTextElements);
      return;
    }

    // Get initial time display
    const initialTimeDisplay = await timerDisplay.textContent();
    console.log(`⏰ Initial time display: "${initialTimeDisplay}"`);

    // Select Custom session type for easier testing (25 min default)
    const customButton = page.locator('text=Custom');
    await customButton.click();
    console.log('✅ Selected Custom session type');

    await page.waitForTimeout(1000);

    // Check time display after selecting session type
    const afterSelectionTime = await timerDisplay.textContent();
    console.log(`⏰ Time after session selection: "${afterSelectionTime}"`);

    // Find and click the start button
    const startButton = page.locator('button.bg-green-500');
    await startButton.click();
    console.log('✅ Timer started');

    // Record initial time for countdown verification
    await page.waitForTimeout(2000);
    const startTime = await timerDisplay.textContent();
    console.log(`⏰ Time immediately after start: "${startTime}"`);

    // Wait and check if time is counting down
    console.log('⏳ Waiting 10 seconds to check countdown...');
    await page.waitForTimeout(10000);

    const timeAfter10Seconds = await timerDisplay.textContent();
    console.log(`⏰ Time after 10 seconds: "${timeAfter10Seconds}"`);

    // Wait another 10 seconds
    console.log('⏳ Waiting another 10 seconds...');
    await page.waitForTimeout(10000);

    const timeAfter20Seconds = await timerDisplay.textContent();
    console.log(`⏰ Time after 20 seconds: "${timeAfter20Seconds}"`);

    // Parse times to check if countdown is working
    function parseTime(timeStr) {
      const match = timeStr.match(/(\\d{1,2}):(\\d{2})/);
      if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      }
      return 0;
    }

    const startSeconds = parseTime(startTime);
    const after10Seconds = parseTime(timeAfter10Seconds);
    const after20Seconds = parseTime(timeAfter20Seconds);

    console.log(`\\n📊 Time analysis:`);
    console.log(`  Start: ${startTime} (${startSeconds} seconds)`);
    console.log(`  After 10s: ${timeAfter10Seconds} (${after10Seconds} seconds)`);
    console.log(`  After 20s: ${timeAfter20Seconds} (${after20Seconds} seconds)`);

    const expectedDiff10 = Math.abs((startSeconds - after10Seconds) - 10);
    const expectedDiff20 = Math.abs((startSeconds - after20Seconds) - 20);

    if (expectedDiff10 <= 2 && expectedDiff20 <= 2) {
      console.log('🎉 SUCCESS! Timer countdown is working properly!');
    } else if (startSeconds === after10Seconds && after10Seconds === after20Seconds) {
      console.log('🔴 CRITICAL ISSUE: Timer is completely stuck - no countdown occurring');

      // Debug timer service state
      console.log('\\n🔧 Debugging timer service...');

      // Check for heartbeat API calls
      const heartbeatRequests = [];
      page.on('request', request => {
        if (request.url().includes('heartbeat')) {
          heartbeatRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
          });
        }
      });

      await page.waitForTimeout(5000);

      console.log('💓 Heartbeat requests in last 5 seconds:', heartbeatRequests);

      // Check console for timer service errors
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      });

      await page.waitForTimeout(2000);

      const errors = consoleMessages.filter(msg => msg.type === 'error');
      const warnings = consoleMessages.filter(msg => msg.type === 'warning');

      if (errors.length > 0) {
        console.log('🔴 Console errors:', errors);
      }
      if (warnings.length > 0) {
        console.log('⚠️ Console warnings:', warnings);
      }

    } else {
      console.log('🟡 PARTIAL ISSUE: Timer countdown is inconsistent');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testTimerCountdown().catch(console.error);