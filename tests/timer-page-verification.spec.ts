import { test, expect, Page } from '@playwright/test';

/**
 * Timer Page Specific Verification
 *
 * Tests the timer page UI improvements and functionality
 */

test.describe('Timer Page UI Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/timer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Timer display visual verification - Desktop', async ({ page }) => {
    // Take a focused screenshot of the timer area
    await page.screenshot({
      path: 'test-results/timer-display-desktop-fixed.png',
      clip: { x: 400, y: 100, width: 600, height: 500 }
    });

    // Find the timer display element
    const timerDisplay = page.locator('text=/\\d{1,2}:\\d{2}/', { hasText: /50:00|25:00|\d{1,2}:\d{2}/ }).first();

    if (await timerDisplay.count() > 0) {
      console.log('Timer display found');

      // Get the timer text and styles
      const timerText = await timerDisplay.textContent();
      console.log('Timer text:', timerText);

      const styles = await timerDisplay.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontVariantNumeric: computed.fontVariantNumeric,
          maxWidth: computed.maxWidth,
          fontFamily: computed.fontFamily,
          textAlign: computed.textAlign,
          position: computed.position,
          display: computed.display
        };
      });

      console.log('Timer display styles:', styles);

      // Verify font improvements
      expect(styles.fontVariantNumeric).toContain('tabular-nums');

      // Check font size is reasonable (not too large)
      const fontSize = parseFloat(styles.fontSize);
      expect(fontSize).toBeGreaterThan(40); // At least readable
      expect(fontSize).toBeLessThan(120); // Not excessively large

      // Take a close-up screenshot of just the timer
      const timerBox = await timerDisplay.boundingBox();
      if (timerBox) {
        await page.screenshot({
          path: 'test-results/timer-display-closeup.png',
          clip: {
            x: Math.max(0, timerBox.x - 50),
            y: Math.max(0, timerBox.y - 50),
            width: timerBox.width + 100,
            height: timerBox.height + 100
          }
        });

        console.log('Timer bounding box:', timerBox);

        // Verify timer fits within reasonable bounds
        expect(timerBox.width).toBeLessThan(350); // Should fit within progress ring
        expect(timerBox.height).toBeLessThan(200);
      }
    }
  });

  test('Responsive timer behavior', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop-small', width: 1024, height: 768 },
      { name: 'desktop-large', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);

      // Take screenshot of timer page at each viewport
      await page.screenshot({
        path: `test-results/timer-responsive-${viewport.name}-${viewport.width}x${viewport.height}.png`,
        clip: { x: 0, y: 0, width: Math.min(viewport.width, 800), height: Math.min(viewport.height, 600) }
      });

      // Check timer display at this viewport
      const timerDisplay = page.locator('text=/\\d{1,2}:\\d{2}/', { hasText: /50:00|25:00|\d{1,2}:\d{2}/ }).first();

      if (await timerDisplay.count() > 0) {
        const timerBox = await timerDisplay.boundingBox();
        if (timerBox) {
          console.log(`${viewport.name} - Timer box:`, timerBox);

          // Verify timer doesn't overflow at any viewport
          expect(timerBox.right).toBeLessThanOrEqual(viewport.width);
          expect(timerBox.bottom).toBeLessThanOrEqual(viewport.height);

          // Verify timer stays reasonably sized
          expect(timerBox.width).toBeGreaterThan(80); // Minimum readable
          expect(timerBox.width).toBeLessThan(viewport.width * 0.8); // Max 80% of viewport
        }
      }
    }
  });

  test('Timer functionality during countdown', async ({ page }) => {
    // Look for the start/play button
    const startButton = page.locator('button').filter({ has: page.locator('svg, .play-icon') }).first();

    if (await startButton.count() === 0) {
      // Try alternative selectors for start button
      const altStartButton = page.locator('[aria-label*="start"], [aria-label*="play"], button:has-text("Start")').first();
      if (await altStartButton.count() > 0) {
        console.log('Found start button with alternative selector');
      }
    }

    // Take before screenshot
    await page.screenshot({
      path: 'test-results/timer-before-start.png',
      clip: { x: 300, y: 100, width: 700, height: 600 }
    });

    if (await startButton.count() > 0) {
      console.log('Starting timer...');
      await startButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot during countdown
      await page.screenshot({
        path: 'test-results/timer-during-countdown.png',
        clip: { x: 300, y: 100, width: 700, height: 600 }
      });

      // Wait a bit more to see timer change
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'test-results/timer-countdown-3sec-later.png',
        clip: { x: 300, y: 100, width: 700, height: 600 }
      });

      // Check timer display stability during countdown
      const timerDisplay = page.locator('text=/\\d{1,2}:\\d{2}/', { hasText: /\d{1,2}:\d{2}/ }).first();

      if (await timerDisplay.count() > 0) {
        const initialBox = await timerDisplay.boundingBox();
        await page.waitForTimeout(1000);
        const laterBox = await timerDisplay.boundingBox();

        if (initialBox && laterBox) {
          // Verify no layout shift during countdown
          expect(Math.abs(initialBox.x - laterBox.x)).toBeLessThan(5);
          expect(Math.abs(initialBox.y - laterBox.y)).toBeLessThan(5);
          expect(Math.abs(initialBox.width - laterBox.width)).toBeLessThan(10);

          console.log('Layout stability verified - no significant shifts during countdown');
        }
      }

      // Try to find pause button and test pause functionality
      const pauseButton = page.locator('button').filter({ has: page.locator('svg, .pause-icon') }).first();
      if (await pauseButton.count() > 0) {
        await pauseButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'test-results/timer-paused.png',
          clip: { x: 300, y: 100, width: 700, height: 600 }
        });
      }
    } else {
      console.log('Start button not found, skipping interactive test');
    }
  });

  test('Progress ring and timer alignment verification', async ({ page }) => {
    // Find the progress ring (SVG circle)
    const progressRing = page.locator('svg circle, svg path').first();
    const timerDisplay = page.locator('text=/\\d{1,2}:\\d{2}/', { hasText: /\d{1,2}:\d{2}/ }).first();

    // Take detailed screenshot of the timer + progress ring area
    await page.screenshot({
      path: 'test-results/timer-progress-alignment-detailed.png',
      clip: { x: 500, y: 150, width: 400, height: 400 }
    });

    if (await progressRing.count() > 0 && await timerDisplay.count() > 0) {
      const ringBox = await progressRing.boundingBox();
      const timerBox = await timerDisplay.boundingBox();

      if (ringBox && timerBox) {
        console.log('Progress ring box:', ringBox);
        console.log('Timer display box:', timerBox);

        // Calculate centers
        const ringCenterX = ringBox.x + ringBox.width / 2;
        const ringCenterY = ringBox.y + ringBox.height / 2;
        const timerCenterX = timerBox.x + timerBox.width / 2;
        const timerCenterY = timerBox.y + timerBox.height / 2;

        console.log(`Ring center: (${ringCenterX}, ${ringCenterY})`);
        console.log(`Timer center: (${timerCenterX}, ${timerCenterY})`);

        // Verify alignment (timer centered within progress ring)
        expect(Math.abs(ringCenterX - timerCenterX)).toBeLessThan(30);
        expect(Math.abs(ringCenterY - timerCenterY)).toBeLessThan(30);

        // Verify timer fits within ring with proper margin
        expect(timerBox.width).toBeLessThan(ringBox.width - 60); // Leave margin
        expect(timerBox.height).toBeLessThan(ringBox.height - 60);

        console.log('Timer-progress ring alignment verified successfully');
      }
    }
  });

  test('Layout overflow and boundary verification', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);

    // Check for any elements extending beyond viewport
    const overflowCheck = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const issues = [];

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();

        // Check horizontal overflow
        if (rect.right > window.innerWidth + 5) {
          issues.push({
            type: 'horizontal_overflow',
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            right: rect.right,
            viewportWidth: window.innerWidth,
            overflow: rect.right - window.innerWidth
          });
        }

        // Check if element is unreasonably large
        if (rect.width > window.innerWidth * 1.5) {
          issues.push({
            type: 'oversized_width',
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            width: rect.width,
            viewportWidth: window.innerWidth
          });
        }
      });

      return issues;
    });

    console.log('Layout boundary check results:', overflowCheck);

    // Should have minimal or no overflow issues
    expect(overflowCheck.filter(issue => issue.overflow > 10).length).toBeLessThan(2);

    // Take final verification screenshot
    await page.screenshot({
      path: 'test-results/timer-final-layout-verification.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1024, height: 768 }
    });
  });
});