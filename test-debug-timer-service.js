const { chromium } = require('playwright');

async function debugTimerService() {
  console.log('🔧 Debugging Timer Service...\\n');

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

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    await page.waitForTimeout(3000);

    // Add debugging to timer service
    await page.evaluate(() => {
      // Override console.log to see timer service logs
      const originalLog = console.log;
      console.log = function(...args) {
        if (args.some(arg => String(arg).includes('Timer') || String(arg).includes('tick'))) {
          originalLog('[TIMER DEBUG]', ...args);
        }
        originalLog(...args);
      };

      // Try to access timer service if it's available
      if (window.timerService) {
        console.log('[TIMER DEBUG] Timer service found in window');
      } else {
        console.log('[TIMER DEBUG] Timer service not found in window');
      }

      // Check if there are any intervals running
      const intervalCount = setInterval.toString();
      console.log('[TIMER DEBUG] setInterval function:', intervalCount.substring(0, 100));
    });

    // Select Quick Task and start timer
    const quickTaskButton = page.getByRole('button', { name: 'Quick Task 15 min Short,' });
    await quickTaskButton.click();
    console.log('✅ Selected Quick Task session');

    await page.waitForTimeout(1000);

    // Check timer state before starting
    const beforeStartState = await page.evaluate(() => {
      // Try to access timer store state
      if (window.zustand) {
        return 'Zustand detected';
      }

      // Look for any timer-related globals
      const timerGlobals = Object.keys(window).filter(key =>
        key.toLowerCase().includes('timer') ||
        key.toLowerCase().includes('store')
      );

      return {
        timerGlobals,
        hasSetInterval: typeof setInterval === 'function',
        activeIntervals: 'unknown' // Can't directly access running intervals
      };
    });

    console.log('🧠 Timer state before start:', beforeStartState);

    // Start timer
    const startButton = page.locator('button.bg-green-500');
    await startButton.click();
    console.log('✅ Start button clicked');

    // Wait and capture any timer-related console logs
    await page.waitForTimeout(5000);

    const timerLogs = consoleMessages.filter(msg =>
      msg.text.includes('Timer') ||
      msg.text.includes('tick') ||
      msg.text.includes('TIMER DEBUG') ||
      msg.text.includes('interval')
    );

    console.log('\\n📝 Timer-related console logs:');
    timerLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
    });

    if (timerLogs.length === 0) {
      console.log('🔴 No timer-related logs found - timer service might not be running');
    }

    // Check timer state after starting
    const afterStartState = await page.evaluate(() => {
      const timerDisplay = document.querySelector('.font-mono.font-bold');
      return {
        displayText: timerDisplay ? timerDisplay.textContent : 'not found',
        timestamp: Date.now()
      };
    });

    console.log('\\n⏰ Timer state after start:', afterStartState);

    // Wait another 5 seconds and check again
    await page.waitForTimeout(5000);

    const after10SecState = await page.evaluate(() => {
      const timerDisplay = document.querySelector('.font-mono.font-bold');
      return {
        displayText: timerDisplay ? timerDisplay.textContent : 'not found',
        timestamp: Date.now()
      };
    });

    console.log('⏰ Timer state after 10 seconds:', after10SecState);

    // Check for any errors that might be preventing timer updates
    const errorLogs = consoleMessages.filter(msg => msg.type === 'error');
    if (errorLogs.length > 0) {
      console.log('\\n🔴 Console errors detected:');
      errorLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.text}`);
      });
    }

    console.log('\\n✨ Timer service debug complete!');

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugTimerService().catch(console.error);