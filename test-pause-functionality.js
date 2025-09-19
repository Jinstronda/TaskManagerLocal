const { chromium } = require('playwright');

async function testPauseFunctionality() {
  console.log('⏸️ Testing Pause Functionality Specifically...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3000/timer');
    await page.waitForLoadState('networkidle');
    console.log('✅ Timer page loaded');

    // Monitor console logs for synchronization events
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('⏸️') || text.includes('Timer paused') || text.includes('🔄') || text.includes('Remaining time')) {
        console.log(`  📝 ${text}`);
      }
    });

    // Select Custom session (25 minutes)
    await page.click('button:has-text("Custom")');
    await page.waitForTimeout(500);
    console.log('✅ Selected Custom session');

    // Start timer
    console.log('\n▶️ Starting timer...');
    const playButton = page.locator('button').filter({ hasText: /^$/ }).first();
    await playButton.click();
    await page.waitForTimeout(3000); // Wait for timer to establish

    // Check timer is running
    const runningTime1 = await page.locator('.font-mono.font-bold').textContent();
    await page.waitForTimeout(2000);
    const runningTime2 = await page.locator('.font-mono.font-bold').textContent();
    const isRunning = runningTime1 !== runningTime2;

    console.log(`⏰ Timer running check:`);
    console.log(`  Time 1: ${runningTime1}`);
    console.log(`  Time 2: ${runningTime2}`);
    console.log(`  Running: ${isRunning ? '✅ YES' : '❌ NO'}`);

    // Now test pause - look for the yellow pause button specifically
    console.log('\n⏸️ Testing pause...');
    const pauseButton = page.locator('button').filter({ hasText: '' }).filter({
      has: page.locator('svg[data-lucide="pause"]')
    }).first();

    const pauseButtonExists = await pauseButton.count() > 0;
    console.log(`🎯 Pause button found: ${pauseButtonExists}`);

    if (pauseButtonExists) {
      await pauseButton.click();
    } else {
      // Fallback: look for yellow background button
      const yellowButton = page.locator('button.bg-yellow-500').first();
      await yellowButton.click();
    }
    await page.waitForTimeout(1000); // Wait for pause to register

    // Check if timer is actually paused
    const pausedTime1 = await page.locator('.font-mono.font-bold').textContent();
    console.log(`⏸️ Paused at: ${pausedTime1}`);

    // Wait 5 seconds to see if timer stays paused
    await page.waitForTimeout(5000);
    const pausedTime2 = await page.locator('.font-mono.font-bold').textContent();
    const isPaused = pausedTime1 === pausedTime2;

    console.log(`⏸️ Pause verification:`);
    console.log(`  Time 1: ${pausedTime1}`);
    console.log(`  Time 2: ${pausedTime2}`);
    console.log(`  Paused: ${isPaused ? '✅ YES' : '❌ NO'}`);

    // Check backend status during pause
    const backendStatusPaused = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/timer/status', {
          headers: { 'X-Client-Id': 'web-client-123' }
        });
        const result = await response.json();
        return result.data;
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('\n🔍 Backend status during pause:');
    console.log(`  isRunning: ${backendStatusPaused.timerState?.isRunning}`);
    console.log(`  isPaused: ${backendStatusPaused.timerState?.isPaused}`);
    console.log(`  remainingTime: ${backendStatusPaused.remainingTime}s`);

    // Test resume - look for the blue resume button specifically
    console.log('\n▶️ Testing resume...');
    const resumeButton = page.locator('button').filter({ hasText: '' }).filter({
      has: page.locator('svg[data-lucide="play"]')
    }).filter({ hasClass: 'bg-blue-500' }).first();

    const resumeButtonExists = await resumeButton.count() > 0;
    console.log(`🎯 Resume button found: ${resumeButtonExists}`);

    if (resumeButtonExists) {
      await resumeButton.click();
    } else {
      // Fallback: look for blue background button
      const blueButton = page.locator('button.bg-blue-500').first();
      await blueButton.click();
    }
    await page.waitForTimeout(2000);

    // Check if timer resumes
    const resumedTime1 = await page.locator('.font-mono.font-bold').textContent();
    await page.waitForTimeout(2000);
    const resumedTime2 = await page.locator('.font-mono.font-bold').textContent();
    const isResumed = resumedTime1 !== resumedTime2;

    console.log(`▶️ Resume verification:`);
    console.log(`  Time 1: ${resumedTime1}`);
    console.log(`  Time 2: ${resumedTime2}`);
    console.log(`  Resumed: ${isResumed ? '✅ YES' : '❌ NO'}`);

    // Final results
    console.log('\n📊 Pause Test Results:');
    console.log('======================');
    console.log(`✅ Timer starts: ${isRunning}`);
    console.log(`✅ Pause works: ${isPaused}`);
    console.log(`✅ Resume works: ${isResumed}`);
    console.log(`✅ Backend sync: ${backendStatusPaused.timerState?.isPaused === true}`);

    // Keep browser open for inspection
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Pause functionality test completed!');
  }
}

testPauseFunctionality().catch(console.error);