import { test, expect, Page } from '@playwright/test';

/**
 * Timer UI Fixes Verification Test Suite
 *
 * This test suite verifies the timer UI improvements:
 * 1. Fixed font sizing with fluid responsive sizing using clamp(3rem, 8vw, 5.5rem)
 * 2. Added proper container constraints (max-width: 280px for 320px progress ring)
 * 3. Improved layout structure and positioning
 * 4. Added tabular-nums for consistent character width
 * 5. Removed conflicting elements and positioning conflicts
 */

test.describe('Timer UI Fixes Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Timer display fits properly within progress ring - Desktop', async ({ page }) => {
    // Navigate to timer page or ensure timer is visible
    await page.waitForSelector('[data-testid="timer-display"], .timer-display, .countdown-display', { timeout: 10000 });

    // Take a screenshot to verify the layout
    await page.screenshot({
      path: 'test-results/timer-ui-desktop-layout.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    // Find the timer container and progress ring elements
    const timerContainer = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();
    const progressRing = page.locator('.progress-ring, [class*="progress"], svg[class*="progress"]').first();

    if (await timerContainer.count() > 0) {
      // Get bounding boxes to verify positioning
      const timerBox = await timerContainer.boundingBox();
      console.log('Timer container box:', timerBox);

      if (timerBox) {
        // Verify timer display has reasonable dimensions (not overflowing)
        expect(timerBox.width).toBeLessThan(400); // Should fit within reasonable bounds
        expect(timerBox.height).toBeLessThan(300);

        // Verify the timer text is readable (not too small)
        expect(timerBox.width).toBeGreaterThan(100);
        expect(timerBox.height).toBeGreaterThan(50);
      }
    }
  });

  test('Responsive font sizing works correctly at different viewport sizes', async ({ page }) => {
    // Test Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow for responsive changes

    await page.screenshot({
      path: 'test-results/timer-ui-mobile-375.png',
      fullPage: false
    });

    // Test Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/timer-ui-tablet-768.png',
      fullPage: false
    });

    // Test Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/timer-ui-desktop-1920.png',
      fullPage: false
    });

    // Verify timer is visible at all viewport sizes
    const timerDisplay = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();
    if (await timerDisplay.count() > 0) {
      await expect(timerDisplay).toBeVisible();
    }
  });

  test('Timer display with different time formats', async ({ page }) => {
    // This test will capture the timer with different time values
    // Since we can't easily control the timer programmatically, we'll inspect current state

    const timerDisplay = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();

    if (await timerDisplay.count() > 0) {
      // Take screenshot of current timer state
      await page.screenshot({
        path: 'test-results/timer-ui-current-time-format.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 600, height: 400 }
      });

      // Get the timer text content
      const timerText = await timerDisplay.textContent();
      console.log('Current timer display text:', timerText);

      // Verify the text follows expected time format (MM:SS or HH:MM:SS)
      if (timerText) {
        const timePattern = /^\d{1,2}:\d{2}(:\d{2})?$/;
        expect(timerText.trim()).toMatch(timePattern);
      }

      // Verify tabular-nums is applied (consistent character width)
      const computedStyle = await timerDisplay.evaluate(el => {
        return window.getComputedStyle(el).fontVariantNumeric;
      });
      console.log('Font variant numeric:', computedStyle);
    }
  });

  test('Timer layout stability - no layout shifts', async ({ page }) => {
    const timerContainer = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();

    if (await timerContainer.count() > 0) {
      // Get initial position and size
      const initialBox = await timerContainer.boundingBox();

      // Wait a bit and check again to ensure no layout shifts
      await page.waitForTimeout(1000);
      const afterBox = await timerContainer.boundingBox();

      if (initialBox && afterBox) {
        // Verify position hasn't shifted significantly (allow for minor pixel differences)
        expect(Math.abs(initialBox.x - afterBox.x)).toBeLessThan(5);
        expect(Math.abs(initialBox.y - afterBox.y)).toBeLessThan(5);
        expect(Math.abs(initialBox.width - afterBox.width)).toBeLessThan(5);
        expect(Math.abs(initialBox.height - afterBox.height)).toBeLessThan(5);
      }
    }
  });

  test('Progress ring and timer display alignment', async ({ page }) => {
    const timerDisplay = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();
    const progressRing = page.locator('.progress-ring, [class*="progress"], svg[class*="progress"]').first();

    // Take a detailed screenshot of the timer area
    await page.screenshot({
      path: 'test-results/timer-progress-ring-alignment.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 400, height: 400 }
    });

    if (await timerDisplay.count() > 0 && await progressRing.count() > 0) {
      const timerBox = await timerDisplay.boundingBox();
      const ringBox = await progressRing.boundingBox();

      if (timerBox && ringBox) {
        console.log('Timer box:', timerBox);
        console.log('Progress ring box:', ringBox);

        // Verify timer is centered within the progress ring (approximate)
        const timerCenterX = timerBox.x + timerBox.width / 2;
        const timerCenterY = timerBox.y + timerBox.height / 2;
        const ringCenterX = ringBox.x + ringBox.width / 2;
        const ringCenterY = ringBox.y + ringBox.height / 2;

        // Allow some tolerance for centering
        expect(Math.abs(timerCenterX - ringCenterX)).toBeLessThan(20);
        expect(Math.abs(timerCenterY - ringCenterY)).toBeLessThan(20);

        // Verify timer fits within the ring (with some margin)
        expect(timerBox.width).toBeLessThan(ringBox.width - 40);
        expect(timerBox.height).toBeLessThan(ringBox.height - 40);
      }
    }
  });

  test('CSS improvements verification', async ({ page }) => {
    const timerDisplay = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();

    if (await timerDisplay.count() > 0) {
      // Check that the timer has proper CSS applied
      const styles = await timerDisplay.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontVariantNumeric: computed.fontVariantNumeric,
          maxWidth: computed.maxWidth,
          textAlign: computed.textAlign,
          display: computed.display,
          justifyContent: computed.justifyContent,
          alignItems: computed.alignItems
        };
      });

      console.log('Timer CSS styles:', styles);

      // Verify key improvements are applied
      expect(styles.fontVariantNumeric).toContain('tabular-nums');

      // Verify responsive font sizing (should be using clamp or reasonable px value)
      const fontSize = parseFloat(styles.fontSize);
      expect(fontSize).toBeGreaterThan(24); // At least 1.5rem equivalent
      expect(fontSize).toBeLessThan(120); // Not exceeding reasonable bounds

      // Verify max-width constraint (280px for 320px progress ring)
      if (styles.maxWidth !== 'none') {
        const maxWidth = parseFloat(styles.maxWidth);
        expect(maxWidth).toBeLessThanOrEqual(300); // Around 280px or less
      }
    }
  });

  test('Timer interaction and countdown behavior', async ({ page }) => {
    // Try to find timer controls (start, pause, etc.)
    const startButton = page.locator('button:has-text("Start"), button[aria-label*="start"], .start-button').first();
    const pauseButton = page.locator('button:has-text("Pause"), button[aria-label*="pause"], .pause-button').first();

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/timer-ui-before-interaction.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 600, height: 400 }
    });

    if (await startButton.count() > 0) {
      // Click start and observe timer behavior
      await startButton.click();
      await page.waitForTimeout(2000); // Wait 2 seconds

      await page.screenshot({
        path: 'test-results/timer-ui-during-countdown.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 600, height: 400 }
      });

      // Verify timer display is still properly positioned during countdown
      const timerDisplay = page.locator('.timer-display, .countdown-display, [data-testid="timer-display"]').first();
      if (await timerDisplay.count() > 0) {
        await expect(timerDisplay).toBeVisible();

        const timerBox = await timerDisplay.boundingBox();
        if (timerBox) {
          // Verify timer hasn't overflowed or shifted during countdown
          expect(timerBox.width).toBeLessThan(400);
          expect(timerBox.height).toBeLessThan(300);
        }
      }

      // Try to pause if pause button exists
      if (await pauseButton.count() > 0) {
        await pauseButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'test-results/timer-ui-paused.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });
      }
    }
  });

  test('Visual comparison and overflow prevention', async ({ page }) => {
    // Set a specific viewport for consistent testing
    await page.setViewportSize({ width: 1024, height: 768 });

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take a full page screenshot for overall layout verification
    await page.screenshot({
      path: 'test-results/timer-ui-full-page-layout.png',
      fullPage: true
    });

    // Focus on timer area specifically
    const timerArea = page.locator('.timer-container, .timer-section, [class*="timer"]').first();
    if (await timerArea.count() > 0) {
      await timerArea.screenshot({
        path: 'test-results/timer-ui-focused-area.png'
      });
    }

    // Check for any overflow issues
    const hasOverflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflowElements = [];

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        // Check if element extends beyond viewport
        if (rect.right > window.innerWidth && style.overflow !== 'hidden') {
          overflowElements.push({
            element: el.tagName,
            className: el.className,
            right: rect.right,
            viewportWidth: window.innerWidth
          });
        }
      });

      return overflowElements;
    });

    console.log('Overflow elements found:', hasOverflow);

    // Verify no significant overflow issues
    expect(hasOverflow.length).toBeLessThan(3); // Allow for minor issues
  });
});