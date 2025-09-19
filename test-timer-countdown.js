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

    // First, let's see what the initial timer display shows
    const initialTimeDisplay = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Initial time display: "${initialTimeDisplay}"`);

    // Select a shorter session type for faster testing (Quick Task = 15 min)
    const quickTaskButton = page.locator('text=Quick Task');
    await quickTaskButton.click();
    console.log('✅ Selected Quick Task (15 min) session type');

    await page.waitForTimeout(1000);

    // Check time display after selecting session type
    const afterSelectionTime = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Time after session selection: "${afterSelectionTime}"`);

    // Find and click the start button
    const startButton = page.locator('button.bg-green-500');
    await startButton.click();
    console.log('✅ Timer started');

    // Record initial time for countdown verification
    await page.waitForTimeout(1000);
    const startTime = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Time immediately after start: "${startTime}"`);

    // Wait and check if time is counting down
    console.log('⏳ Waiting 5 seconds to check countdown...');
    await page.waitForTimeout(5000);

    const timeAfter5Seconds = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Time after 5 seconds: "${timeAfter5Seconds}"`);

    // Wait another 5 seconds
    console.log('⏳ Waiting another 5 seconds...');
    await page.waitForTimeout(5000);

    const timeAfter10Seconds = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Time after 10 seconds: "${timeAfter10Seconds}"`);

    // Check if countdown is working
    if (startTime !== timeAfter5Seconds && timeAfter5Seconds !== timeAfter10Seconds) {
      console.log('🎉 SUCCESS! Timer countdown is working properly!');
    } else {
      console.log('🔴 ISSUE: Timer appears to be stuck - countdown not working');

      // Let's check for any console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      if (consoleErrors.length > 0) {
        console.log('🔴 Console errors detected:');
        consoleErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      // Check if the timer service is running by looking at network activity
      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes('/api/timer') || request.url().includes('heartbeat')) {
          networkRequests.push({
            url: request.url(),
            method: request.method()
          });
        }
      });

      await page.waitForTimeout(3000);

      console.log('🌐 Timer-related network requests:', networkRequests);

      // Check timer store state via console
      const timerState = await page.evaluate(() => {
        // Try to access any timer-related globals
        const timerGlobals = Object.keys(window).filter(key =>
          key.toLowerCase().includes('timer') ||
          key.toLowerCase().includes('zustand')
        );

        return {
          timerGlobals,
          documentTitle: document.title,
          // Check if there are any intervals running
          intervalCount: window.setInterval.length || 'unknown'
        };
      });

      console.log('🧠 Timer state debug:', timerState);
    }

    // Test pause and resume to see if that affects countdown
    console.log('\\n⏸️ Testing pause/resume effect on countdown...');

    const pauseButton = page.locator('button.bg-yellow-500');
    await pauseButton.click();
    console.log('✅ Timer paused');

    const pausedTime = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Time when paused: "${pausedTime}"`);

    await page.waitForTimeout(3000);

    const timeWhilePaused = await page.locator('.text-6xl, .text-5xl, .text-4xl').first().textContent();
    console.log(`⏰ Time after 3 seconds of pause: "${timeWhilePaused}"`);

    if (pausedTime === timeWhilePaused) {
      console.log('✅ Good: Timer correctly stops counting when paused');
    } else {
      console.log('🔴 Issue: Timer continues counting while paused');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

testTimerCountdown().catch(console.error);