const { chromium } = require('playwright');

async function debugUITimer() {
  console.log('🔧 Debugging UI Timer Synchronization...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3000/timer');
    await page.waitForLoadState('networkidle');
    console.log('✅ Timer page loaded');

    // Check initial state
    const initialDisplay = await page.locator('.font-mono.font-bold').textContent();
    console.log(`⏰ Initial timer display: "${initialDisplay}"`);

    // Select Custom session (25 minutes)
    await page.click('button:has-text("Custom")');
    await page.waitForTimeout(500);
    console.log('✅ Selected Custom session');

    const customTime = await page.locator('.font-mono.font-bold').textContent();
    console.log(`⏰ Custom session time: "${customTime}"`);

    // Setup network monitoring for API calls
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/timer/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });

    // Setup console monitoring for timer logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('timer') || msg.text().includes('Timer') || msg.text().includes('countdown')) {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: Date.now()
        });
      }
    });

    // Start timer and monitor
    console.log('⏰ Starting timer and monitoring UI updates...');
    const startTime = Date.now();

    // Look for the play button (green button with Play icon)
    const playButton = page.locator('button:has(svg[data-lucide="play"])').first();
    const playButtonExists = await playButton.count();
    console.log(`🎯 Play button found: ${playButtonExists > 0 ? 'Yes' : 'No'}`);

    if (playButtonExists > 0) {
      await playButton.click();
      console.log('▶️  Clicked play button');
    } else {
      console.log('❌ Play button not found, trying alternative selectors...');
      // Try clicking the empty button (might be the play button)
      const emptyButtons = page.locator('button').filter({ hasText: /^$/ });
      const emptyButtonCount = await emptyButtons.count();
      console.log(`🔍 Found ${emptyButtonCount} empty buttons`);

      if (emptyButtonCount > 0) {
        await emptyButtons.first().click();
        console.log('🎯 Clicked first empty button');
      } else {
        throw new Error('No suitable start button found');
      }
    }

    // Monitor timer for 30 seconds
    const monitoringData = [];
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      const currentTime = await page.locator('.font-mono.font-bold').textContent();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

      monitoringData.push({
        second: elapsedSeconds,
        displayTime: currentTime,
        timestamp: Date.now()
      });

      console.log(`  [${elapsedSeconds}s] Display: "${currentTime}"`);
    }

    // Check timer store state
    const timerStoreState = await page.evaluate(() => {
      return window.useTimerStore ? window.useTimerStore.getState() : 'Timer store not accessible';
    });

    // Check if there are any active intervals
    const intervalInfo = await page.evaluate(() => {
      let activeIntervals = 0;
      // Try to detect active intervals by checking global timer functions
      const originalSetInterval = window.setInterval;
      const originalClearInterval = window.clearInterval;

      return {
        hasSetInterval: typeof window.setInterval === 'function',
        hasClearInterval: typeof window.clearInterval === 'function',
        // Note: Can't easily count active intervals from here
      };
    });

    // Get final API status
    await page.waitForTimeout(2000);

    console.log('\n📊 Analysis Results:');
    console.log('==================');

    console.log('\n🔍 Timer Display Analysis:');
    const firstDisplay = monitoringData[0]?.displayTime;
    const lastDisplay = monitoringData[monitoringData.length - 1]?.displayTime;
    console.log(`  Initial: ${firstDisplay}`);
    console.log(`  After 30s: ${lastDisplay}`);
    console.log(`  Display changed: ${firstDisplay !== lastDisplay ? 'YES' : 'NO'}`);

    console.log('\n🌐 API Calls:');
    apiCalls.forEach(call => {
      console.log(`  ${new Date(call.timestamp).toISOString()} - ${call.url} (${call.status})`);
    });

    console.log('\n📝 Console Logs:');
    consoleLogs.forEach(log => {
      console.log(`  [${log.type}] ${log.text}`);
    });

    console.log('\n🎛️ Timer Store State:');
    console.log(JSON.stringify(timerStoreState, null, 2));

    console.log('\n⚙️ Interval Info:');
    console.log(JSON.stringify(intervalInfo, null, 2));

    // Check if backend timer is actually running
    console.log('\n🔄 Checking backend timer status...');
    const backendStatus = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/timer/status');
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('Backend Timer Status:');
    console.log(JSON.stringify(backendStatus, null, 2));

    // Try to get zustand store directly
    const zustandState = await page.evaluate(() => {
      // Try multiple ways to access the store
      if (window.__ZUSTAND_STORES__) {
        return Object.keys(window.__ZUSTAND_STORES__);
      }
      if (window.zustandStores) {
        return window.zustandStores;
      }
      // Check if React DevTools is available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React DevTools available';
      }
      return 'No Zustand stores found';
    });

    console.log('\n🏪 Store Access:');
    console.log(zustandState);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ UI Timer debugging completed!');
  }
}

debugUITimer().catch(console.error);