const { chromium } = require('playwright');

async function testCompleteTimerFunctionality() {
  console.log('🚀 Testing Complete Timer Functionality with Backend Sync...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3000/timer');
    await page.waitForLoadState('networkidle');
    console.log('✅ Timer page loaded');

    // Monitor console logs for synchronization events
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔄') || text.includes('🎯') || text.includes('⏱️') ||
          text.includes('Backend') || text.includes('Timer')) {
        logs.push(`[${new Date().toISOString()}] ${text}`);
        console.log(`  📝 ${text}`);
      }
    });

    // Test 1: Check initial timer display
    const initialDisplay = await page.locator('.font-mono.font-bold').textContent();
    console.log(`\n⏰ Initial timer display: "${initialDisplay}"`);

    // Test 2: Select Custom session (25 minutes)
    await page.click('button:has-text("Custom")');
    await page.waitForTimeout(500);
    const customTime = await page.locator('.font-mono.font-bold').textContent();
    console.log(`⏰ Custom session time: "${customTime}"`);

    // Test 3: Start timer and verify backend synchronization
    console.log('\n🎯 Starting timer and monitoring synchronization...');

    // Click play button - use the empty button which is the green play button
    const buttons = await page.locator('button').all();
    let playButton = null;

    // Find the empty button (play button) or fall back to any button with green color
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      const buttonClass = await buttons[i].getAttribute('class');

      // Look for empty button with green styling (play button)
      if (buttonText.trim() === '' && buttonClass && buttonClass.includes('bg-green')) {
        playButton = buttons[i];
        break;
      }
    }

    // Fallback: try to find any green button
    if (!playButton) {
      playButton = page.locator('button').filter({ hasText: /^$/ }).first();
    }

    console.log('🎯 Found play button, clicking...');
    await playButton.click();
    console.log('▶️  Clicked play button');

    // Wait for backend synchronization to establish
    await page.waitForTimeout(2000);

    // Test 4: Monitor timer countdown for 10 seconds
    console.log('\n⏱️ Monitoring timer countdown for 10 seconds...');
    const countdownData = [];

    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      const currentTime = await page.locator('.font-mono.font-bold').textContent();
      countdownData.push({
        second: i + 1,
        display: currentTime,
        timestamp: new Date().toISOString()
      });
      console.log(`  [${i + 1}s] Display: "${currentTime}"`);
    }

    // Test 5: Verify countdown is working
    const firstTime = countdownData[0]?.display;
    const lastTime = countdownData[countdownData.length - 1]?.display;
    const isCountingDown = firstTime !== lastTime;

    console.log(`\n✨ Countdown Analysis:`);
    console.log(`  First: ${firstTime}`);
    console.log(`  Last:  ${lastTime}`);
    console.log(`  Working: ${isCountingDown ? '✅ YES' : '❌ NO'}`);

    // Test 6: Pause and resume functionality
    console.log('\n⏸️ Testing pause functionality...');

    // Find pause button (usually the same button that was play, now shows pause icon)
    const pauseButton = page.locator('button').filter({ hasText: /^$/ }).first();
    await pauseButton.click();
    await page.waitForTimeout(1000);

    const pausedTime = await page.locator('.font-mono.font-bold').textContent();
    console.log(`⏸️ Paused at: "${pausedTime}"`);

    // Wait 3 seconds to ensure timer is actually paused
    await page.waitForTimeout(3000);
    const stillPausedTime = await page.locator('.font-mono.font-bold').textContent();
    const isPaused = pausedTime === stillPausedTime;
    console.log(`⏸️ Still paused: ${isPaused ? '✅ YES' : '❌ NO'} ("${stillPausedTime}")`);

    // Resume timer
    console.log('\n▶️ Testing resume functionality...');
    const resumeButton = page.locator('button').filter({ hasText: /^$/ }).first();
    await resumeButton.click();
    await page.waitForTimeout(2000);

    const resumedTime = await page.locator('.font-mono.font-bold').textContent();
    console.log(`▶️ Resumed at: "${resumedTime}"`);

    // Test 7: Stop timer functionality
    console.log('\n⏹️ Testing stop functionality...');
    // Stop button is typically a separate button - look for red button or square icon
    const allButtons = await page.locator('button').all();
    let stopButton = null;

    for (let i = 0; i < allButtons.length; i++) {
      const buttonClass = await allButtons[i].getAttribute('class');
      if (buttonClass && (buttonClass.includes('bg-red') || buttonClass.includes('text-red'))) {
        stopButton = allButtons[i];
        break;
      }
    }

    if (!stopButton) {
      // Fallback: look for second empty button after the play/pause button
      const emptyButtons = await page.locator('button').filter({ hasText: /^$/ }).all();
      if (emptyButtons.length > 1) {
        stopButton = emptyButtons[1];
      }
    }

    if (stopButton) {
      await stopButton.click();
      await page.waitForTimeout(1000);
      const stoppedTime = await page.locator('.font-mono.font-bold').textContent();
      console.log(`⏹️ Stopped, display: "${stoppedTime}"`);
    } else {
      console.log('⚠️ Stop button not found, skipping stop test');
    }

    // Test 8: Verify backend status
    console.log('\n🔍 Checking backend timer status...');
    const backendStatus = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/timer/status', {
          headers: { 'X-Client-Id': 'web-client-123' }
        });
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('Backend Status:', JSON.stringify(backendStatus, null, 2));

    // Test 9: Check for any JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    await page.waitForTimeout(1000);

    // Final Results
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Page loads: ${true}`);
    console.log(`✅ Timer display works: ${initialDisplay !== '00:00'}`);
    console.log(`✅ Session selection: ${customTime === '25:00'}`);
    console.log(`✅ Timer countdown: ${isCountingDown}`);
    console.log(`✅ Pause works: ${isPaused}`);
    console.log(`✅ Backend sync: ${!backendStatus.error}`);
    console.log(`✅ No JS errors: ${jsErrors.length === 0}`);

    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n📝 Synchronization Logs:');
    logs.forEach(log => console.log(`  ${log}`));

    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Complete timer functionality test finished!');
  }
}

testCompleteTimerFunctionality().catch(console.error);