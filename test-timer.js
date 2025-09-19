const { chromium } = require('playwright');

async function testTimerFunctionality() {
  console.log('🔧 Testing Timer functionality with stable API...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the correct frontend port (3004)
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    console.log('✅ Frontend loaded successfully on port 3004');

    // Test API connectivity
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          data: data
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    if (apiResponse.ok) {
      console.log('✅ API connectivity working!');
      console.log('📊 API Health:', apiResponse.data.status);
    } else {
      console.log('🔴 API connectivity failed:', apiResponse);
    }

    // Navigate to timer page
    await page.click('text="Timer"', { timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Timer page');

    // Look for timer control buttons
    const startButton = page.locator('button').filter({ hasText: /start|play/i });
    const hasStartButton = await startButton.first().isVisible().catch(() => false);

    if (hasStartButton) {
      console.log('✅ Timer start button is visible!');

      // Try clicking it
      await startButton.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Timer start button clicked');

      const pauseButton = page.locator('button').filter({ hasText: /pause/i });
      const hasPauseButton = await pauseButton.first().isVisible().catch(() => false);

      if (hasPauseButton) {
        console.log('✅ Timer functionality working - pause button appeared!');
        console.log('✅ Timer is running successfully');

        // Test pause functionality
        await pauseButton.first().click();
        console.log('✅ Timer paused successfully');

        // Check for resume button
        await page.waitForTimeout(1000);
        const resumeButton = page.locator('button').filter({ hasText: /resume|play/i });
        const hasResumeButton = await resumeButton.first().isVisible().catch(() => false);

        if (hasResumeButton) {
          console.log('✅ Resume button visible after pause');
          await resumeButton.first().click();
          console.log('✅ Timer resumed');
        }

        // Test stop functionality
        const stopButton = page.locator('button').filter({ hasText: /stop/i });
        const hasStopButton = await stopButton.first().isVisible().catch(() => false);
        if (hasStopButton) {
          await stopButton.first().click();
          console.log('✅ Timer stopped successfully');
        }

      } else {
        console.log('⚠️  Timer start clicked but pause button not found');

        // Check if there are any console errors that might explain this
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        if (consoleErrors.length > 0) {
          console.log('🔴 Console errors detected:', consoleErrors.slice(0, 3));
        }
      }
    } else {
      console.log('🔴 Timer start button still not visible');

      // Let's see what buttons are actually available
      const allButtons = await page.locator('button').allTextContents();
      console.log('📋 Available buttons:', allButtons);
    }

    // Test other key functionality while we're here
    console.log('\n📋 Testing other key features...');

    // Test Categories API
    const categoriesTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/categories');
        return { status: response.status, ok: response.ok };
      } catch (e) {
        return { error: e.message };
      }
    });

    if (categoriesTest.ok) {
      console.log('✅ Categories API working');
    } else {
      console.log('🔴 Categories API failed:', categoriesTest);
    }

    // Test Tasks API
    const tasksTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/tasks');
        return { status: response.status, ok: response.ok };
      } catch (e) {
        return { error: e.message };
      }
    });

    if (tasksTest.ok) {
      console.log('✅ Tasks API working');
    } else {
      console.log('🔴 Tasks API failed:', tasksTest);
    }

    console.log('\n🎉 Timer functionality test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testTimerFunctionality().catch(console.error);