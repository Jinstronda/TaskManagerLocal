const { chromium } = require('playwright');

async function debugTimer() {
  console.log('🔧 Debugging Timer state and controls...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the timer page
    await page.goto('http://localhost:3004/timer', { waitUntil: 'networkidle' });
    console.log('✅ Timer page loaded');

    // Debug: Check what's in the DOM
    console.log('\n🔍 Analyzing Timer page DOM...');

    // Look for the session controls container
    const sessionControlsContainer = page.locator('[class*="session"], .session-controls, [data-testid*="session"], [data-testid*="control"]');
    const hasSessionControls = await sessionControlsContainer.isVisible().catch(() => false);
    console.log(`SessionControls container visible: ${hasSessionControls}`);

    // Look for all clickable elements
    const allClickableElements = await page.locator('button, [role="button"], [onclick]').allTextContents();
    console.log('🖱️ All clickable elements:', allClickableElements);

    // Check for timer state in React DevTools or global state
    const timerState = await page.evaluate(() => {
      // Try to access the timer store if it's available globally
      if (window.zustand || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'Zustand/React DevTools detected';
      }

      // Look for any timer-related elements with data attributes
      const timerElements = Array.from(document.querySelectorAll('[data-testid*="timer"], [class*="timer"], [class*="session"]'));
      return timerElements.map(el => ({
        tag: el.tagName,
        className: el.className,
        textContent: el.textContent?.substring(0, 100),
        id: el.id
      }));
    });

    console.log('🧠 Timer state analysis:', timerState);

    // Check if we can access the timer service directly
    const timerServiceTest = await page.evaluate(() => {
      try {
        // Check if timer service is available in window
        return Object.keys(window).filter(key => key.toLowerCase().includes('timer'));
      } catch (e) {
        return 'No timer globals found';
      }
    });

    console.log('🔧 Timer service globals:', timerServiceTest);

    // Look specifically for the SessionControls component by checking for its distinctive structure
    const sessionControlsSearch = await page.locator('.flex.items-center.justify-center.space-x-4');
    const hasControlsLayout = await sessionControlsSearch.isVisible();
    console.log(`SessionControls layout found: ${hasControlsLayout}`);

    if (hasControlsLayout) {
      const controlsContent = await sessionControlsSearch.allTextContents();
      console.log('🎮 Controls content:', controlsContent);
    }

    // Try to find buttons with specific timer control patterns
    const timerControlButtons = await page.locator('button').evaluateAll(buttons => {
      return buttons
        .filter(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          const classes = btn.className || '';
          return text.includes('start') ||
                 text.includes('play') ||
                 text.includes('pause') ||
                 text.includes('stop') ||
                 classes.includes('green') ||  // start button often green
                 classes.includes('play') ||
                 classes.includes('timer');
        })
        .map(btn => ({
          text: btn.textContent,
          className: btn.className,
          disabled: btn.disabled,
          visible: btn.offsetParent !== null
        }));
    });

    console.log('⏯️ Timer control buttons found:', timerControlButtons);

    // Check for any hidden or conditional rendering
    const hiddenTimerControls = await page.locator('[style*="display: none"], .hidden').evaluateAll(elements => {
      return elements
        .filter(el => el.textContent?.toLowerCase().includes('start') ||
                     el.textContent?.toLowerCase().includes('play'))
        .map(el => ({
          text: el.textContent,
          className: el.className,
          style: el.style.cssText
        }));
    });

    console.log('👻 Hidden timer controls:', hiddenTimerControls);

    console.log('\n✨ Timer debug analysis complete!');

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugTimer().catch(console.error);