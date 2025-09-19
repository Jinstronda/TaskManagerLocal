const { chromium } = require('playwright');

async function testAPICall() {
  console.log('🔌 Testing Category API Call...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to any page first
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    console.log('✅ Homepage loaded');

    // Test the API call directly in browser context
    const apiTest = await page.evaluate(async () => {
      try {
        console.log('Making API call to /api/categories...');
        const response = await fetch('/api/categories');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          return {
            success: false,
            status: response.status,
            statusText: response.statusText,
            error: 'HTTP Error'
          };
        }

        const text = await response.text();
        console.log('Response text:', text);

        if (!text) {
          return {
            success: false,
            error: 'Empty response',
            text: text
          };
        }

        try {
          const data = JSON.parse(text);
          return {
            success: true,
            data: data,
            text: text
          };
        } catch (parseError) {
          return {
            success: false,
            error: 'JSON Parse Error: ' + parseError.message,
            text: text
          };
        }

      } catch (error) {
        console.error('Fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('🔌 API Test Result:');
    console.log(JSON.stringify(apiTest, null, 2));

    // Also test the timer API to see if it works
    console.log('\n⏱️ Testing Timer API for comparison...');
    const timerTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/timer/status', {
          headers: { 'X-Client-Id': 'test-client' }
        });
        if (!response.ok) {
          return { success: false, status: response.status };
        }
        const data = await response.json();
        return { success: true, hasData: !!data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('⏱️ Timer API Result:', timerTest);

    // Keep browser open
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ API test completed!');
  }
}

testAPICall().catch(console.error);