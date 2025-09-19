const { chromium } = require('playwright');

async function testTimerFunctionality() {
  console.log('🔧 Testing Timer button functionality...\\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3004/timer', { waitUntil: 'networkidle' });
    console.log('✅ Timer page loaded');

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Find the green start button (contains Play SVG)
    const startButton = page.locator('button.bg-green-500');
    const isStartButtonVisible = await startButton.isVisible();

    console.log(`🟢 Start button visible: ${isStartButtonVisible}`);

    if (isStartButtonVisible) {
      console.log('✅ About to click the start button...');

      // Click the start button
      await startButton.click();

      console.log('✅ Start button clicked!');

      // Wait for state changes to occur
      await page.waitForTimeout(2000);

      // Check if the button changed to a pause button (yellow)
      const pauseButton = page.locator('button.bg-yellow-500');
      const isPauseButtonVisible = await pauseButton.isVisible();

      console.log(`🟡 Pause button visible after start: ${isPauseButtonVisible}`);

      if (isPauseButtonVisible) {
        console.log('🎉 SUCCESS! Timer started successfully - pause button appeared!');

        // Test pause functionality
        await pauseButton.click();
        console.log('✅ Pause button clicked');

        await page.waitForTimeout(1000);

        // Check for resume button (blue)
        const resumeButton = page.locator('button.bg-blue-500');
        const isResumeButtonVisible = await resumeButton.isVisible();

        console.log(`🔵 Resume button visible after pause: ${isResumeButtonVisible}`);

        if (isResumeButtonVisible) {
          console.log('🎉 SUCCESS! Pause functionality works - resume button appeared!');

          // Test resume
          await resumeButton.click();
          console.log('✅ Resume button clicked');

          await page.waitForTimeout(1000);

          // Should be back to pause button
          const pauseButton2 = page.locator('button.bg-yellow-500');
          const isPauseButton2Visible = await pauseButton2.isVisible();

          console.log(`🟡 Pause button visible after resume: ${isPauseButton2Visible}`);

          if (isPauseButton2Visible) {
            console.log('🎉 SUCCESS! Resume functionality works!');

            // Test stop functionality
            const stopButton = page.locator('button.bg-red-500');
            const isStopButtonVisible = await stopButton.isVisible();

            console.log(`🔴 Stop button visible: ${isStopButtonVisible}`);

            if (isStopButtonVisible) {
              await stopButton.click();
              console.log('✅ Stop button clicked');

              await page.waitForTimeout(1000);

              // Should be back to start button
              const startButton2 = page.locator('button.bg-green-500');
              const isStartButton2Visible = await startButton2.isVisible();

              console.log(`🟢 Start button visible after stop: ${isStartButton2Visible}`);

              if (isStartButton2Visible) {
                console.log('🎉 SUCCESS! Stop functionality works! Timer cycle complete!');
              }
            }
          }
        }
      } else {
        console.log('🔴 ISSUE: Start button clicked but no pause button appeared');

        // Check what buttons are now visible
        const allButtons = await page.locator('button').evaluateAll(buttons => {
          return buttons.map(btn => ({
            classes: btn.className,
            visible: btn.offsetParent !== null,
            text: btn.textContent || 'no-text'
          }));
        });

        console.log('🔍 All buttons after start click:', allButtons.filter(btn => btn.visible));
      }
    } else {
      console.log('🔴 ISSUE: Start button not visible');
    }

    // Also test the session type selector
    console.log('\\n📋 Testing session type selection...');

    const deepWorkButton = page.locator('text=Deep Work');
    const isDeepWorkVisible = await deepWorkButton.isVisible();
    console.log(`Deep Work button visible: ${isDeepWorkVisible}`);

    if (isDeepWorkVisible) {
      await deepWorkButton.click();
      console.log('✅ Deep Work session type selected');
    }

    console.log('\\n🎉 Timer functionality test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

testTimerFunctionality().catch(console.error);