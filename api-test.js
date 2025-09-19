const { chromium } = require('playwright');

async function testApiConnectivity() {
  console.log('🔧 Testing API connectivity after proxy fix...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the correct frontend port (3002)
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    console.log('✅ Frontend loaded successfully');

    // Test API connectivity directly
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

    // Test timer page specifically
    await page.click('text="Timer"', { timeout: 5000 });
    await page.waitForTimeout(2000);

    // Look for timer control buttons
    const startButton = page.locator('button').filter({ hasText: /start|play/i });
    const hasStartButton = await startButton.first().isVisible().catch(() => false);

    if (hasStartButton) {
      console.log('✅ Timer start button is now visible!');

      // Try clicking it
      await startButton.first().click();
      await page.waitForTimeout(2000);

      const pauseButton = page.locator('button').filter({ hasText: /pause/i });
      const hasPauseButton = await pauseButton.first().isVisible().catch(() => false);

      if (hasPauseButton) {
        console.log('✅ Timer functionality working - pause button appeared!');
        await pauseButton.first().click();
        console.log('✅ Timer successfully paused');
      } else {
        console.log('⚠️  Timer start clicked but pause button not found');
      }
    } else {
      console.log('🔴 Timer start button still not visible');
    }

    console.log('\n🎉 API connectivity test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApiConnectivity().catch(console.error);