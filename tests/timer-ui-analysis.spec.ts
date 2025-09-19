import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * Comprehensive Timer UI Test Suite
 *
 * This test suite examines the timer component to identify number display issues
 * such as:
 * - Numbers getting cut off
 * - Inconsistent spacing
 * - Layout shifts when time format changes
 * - Overflow issues in containers
 * - Responsive behavior problems
 */

test.describe('Timer UI Analysis', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Navigate to the timer page
    await page.goto('/timer');

    // Wait for the timer component to be visible
    await page.waitForSelector('[data-testid="timer-container"], .timer, [class*="timer"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow for animations to settle
  });

  test('Initial State Analysis - Take Screenshots and Examine Layout', async () => {
    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/timer-initial-state.png',
      fullPage: true
    });

    // Check if timer display is visible
    const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}(:\\d{2})?/').first();
    await expect(timerDisplay).toBeVisible();

    // Get timer display text and analyze format
    const initialTime = await timerDisplay.textContent();
    console.log('Initial timer display:', initialTime);

    // Analyze the container dimensions
    const timerContainer = await page.locator('.bg-white, [class*="timer"], [class*="countdown"]').first();
    const containerBox = await timerContainer.boundingBox();
    console.log('Timer container dimensions:', containerBox);

    // Check for font size and layout
    const displayElement = await timerDisplay.elementHandle();
    if (displayElement) {
      const styles = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          lineHeight: computed.lineHeight,
          width: computed.width,
          height: computed.height,
          overflow: computed.overflow,
          textAlign: computed.textAlign,
          display: computed.display
        };
      }, displayElement);
      console.log('Timer display styles:', styles);
    }
  });

  test('Time Format Testing - Various Time Durations', async () => {
    // Test different time formats by examining what's currently displayed
    const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}(:\\d{2})?/').first();

    // Capture current display
    await page.screenshot({
      path: 'test-results/timer-format-analysis.png',
      fullPage: true
    });

    // Analyze the time format
    const currentTime = await timerDisplay.textContent();
    const timeFormat = currentTime?.includes(':') ?
      (currentTime.split(':').length === 3 ? 'HH:MM:SS' : 'MM:SS') : 'Unknown';

    console.log('Current time format:', timeFormat);
    console.log('Current time value:', currentTime);

    // Test if the display container can handle different time formats
    const displayBox = await timerDisplay.boundingBox();
    console.log('Timer display bounding box:', displayBox);

    // Check for text overflow or clipping
    const isOverflowing = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;

      return element.scrollWidth > element.clientWidth ||
             element.scrollHeight > element.clientHeight;
    }, 'text=/\\d{1,2}:\\d{2}(:\\d{2})?/');

    console.log('Text overflow detected:', isOverflowing);
  });

  test('Timer Interaction and Number Display Behavior', async () => {
    // Look for start/play button and timer controls
    const startButton = await page.locator('button').filter({ hasText: /start|play|▶/i }).first();
    const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}(:\\d{2})?/').first();

    // Capture initial state
    const initialTime = await timerDisplay.textContent();
    await page.screenshot({
      path: 'test-results/timer-before-start.png',
      fullPage: true
    });

    // Try to start the timer if start button exists
    if (await startButton.isVisible()) {
      console.log('Starting timer...');
      await startButton.click();

      // Wait for timer to start and capture the running state
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: 'test-results/timer-running-state.png',
        fullPage: true
      });

      // Check if time is changing
      const newTime = await timerDisplay.textContent();
      console.log('Time before start:', initialTime);
      console.log('Time after start:', newTime);

      // Analyze display during countdown
      const runningStyles = await page.evaluate(() => {
        const timerEl = document.querySelector('[class*="timer"], [class*="countdown"], [class*="display"]');
        if (!timerEl) return null;

        const computed = window.getComputedStyle(timerEl);
        return {
          animation: computed.animation,
          transform: computed.transform,
          transition: computed.transition,
          textShadow: computed.textShadow,
          color: computed.color
        };
      });
      console.log('Running timer styles:', runningStyles);

      // Wait a bit more to see if numbers change properly
      await page.waitForTimeout(3000);
      const laterTime = await timerDisplay.textContent();
      console.log('Time after 3 seconds:', laterTime);

      await page.screenshot({
        path: 'test-results/timer-countdown-progress.png',
        fullPage: true
      });
    } else {
      console.log('Start button not found, timer might already be running or have different controls');

      // Look for other timer controls
      const controls = await page.locator('button').all();
      for (const control of controls) {
        const text = await control.textContent();
        console.log('Found button:', text);
      }
    }
  });

  test('Responsive Behavior Testing - Different Viewport Sizes', async () => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 667, name: 'mobile-medium' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1920, height: 1080, name: 'desktop-large' }
    ];

    for (const viewport of viewports) {
      console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Allow for responsive adjustments

      // Take screenshot
      await page.screenshot({
        path: `test-results/timer-${viewport.name}-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });

      // Analyze timer display at this size
      const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}(:\\d{2})?/').first();

      if (await timerDisplay.isVisible()) {
        const box = await timerDisplay.boundingBox();
        const text = await timerDisplay.textContent();

        console.log(`${viewport.name}: Timer text="${text}", Bounding box:`, box);

        // Check for overflow issues
        const styles = await timerDisplay.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          const parent = el.parentElement;
          const parentStyles = parent ? window.getComputedStyle(parent) : null;

          return {
            fontSize: computed.fontSize,
            width: computed.width,
            maxWidth: computed.maxWidth,
            overflow: computed.overflow,
            parentWidth: parentStyles?.width,
            parentOverflow: parentStyles?.overflow,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            offsetWidth: el.offsetWidth
          };
        });

        console.log(`${viewport.name}: Styles:`, styles);

        // Check if text is getting cut off
        const isClipped = styles.scrollWidth > styles.clientWidth;
        if (isClipped) {
          console.log(`⚠️ ${viewport.name}: Text clipping detected! ScrollWidth: ${styles.scrollWidth}, ClientWidth: ${styles.clientWidth}`);
        }
      } else {
        console.log(`❌ ${viewport.name}: Timer display not visible at this viewport size`);
      }
    }
  });

  test('CSS Layout Analysis - Detailed Style Inspection', async () => {
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Find timer-related elements and analyze their CSS
    const timerElements = await page.locator('[class*="timer"], [class*="countdown"], [class*="display"], [class*="time"]').all();

    console.log(`Found ${timerElements.length} timer-related elements`);

    for (let i = 0; i < timerElements.length; i++) {
      const element = timerElements[i];
      const isVisible = await element.isVisible();

      if (isVisible) {
        const text = await element.textContent();
        const classes = await element.getAttribute('class');

        console.log(`Element ${i}: "${text?.trim()}" - Classes: ${classes}`);

        const detailedStyles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            // Typography
            fontSize: computed.fontSize,
            fontFamily: computed.fontFamily,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            textAlign: computed.textAlign,

            // Layout
            display: computed.display,
            position: computed.position,
            width: computed.width,
            height: computed.height,
            minWidth: computed.minWidth,
            maxWidth: computed.maxWidth,
            minHeight: computed.minHeight,
            maxHeight: computed.maxHeight,

            // Box model
            margin: computed.margin,
            padding: computed.padding,
            border: computed.border,

            // Overflow and clipping
            overflow: computed.overflow,
            overflowX: computed.overflowX,
            overflowY: computed.overflowY,
            textOverflow: computed.textOverflow,
            whiteSpace: computed.whiteSpace,

            // Visual effects
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            textShadow: computed.textShadow,
            transform: computed.transform,

            // Actual dimensions
            scrollWidth: el.scrollWidth,
            scrollHeight: el.scrollHeight,
            clientWidth: el.clientWidth,
            clientHeight: el.clientHeight,
            offsetWidth: el.offsetWidth,
            offsetHeight: el.offsetHeight
          };
        });

        console.log(`Element ${i} detailed styles:`, detailedStyles);

        // Flag potential issues
        const issues = [];

        if (detailedStyles.scrollWidth > detailedStyles.clientWidth) {
          issues.push('Horizontal overflow detected');
        }

        if (detailedStyles.scrollHeight > detailedStyles.clientHeight) {
          issues.push('Vertical overflow detected');
        }

        if (parseFloat(detailedStyles.fontSize) > 100) { // Very large font
          const containerWidth = detailedStyles.clientWidth;
          const textLength = text?.length || 0;
          const estimatedTextWidth = textLength * parseFloat(detailedStyles.fontSize) * 0.6; // Rough estimation

          if (estimatedTextWidth > containerWidth) {
            issues.push('Font size may be too large for container');
          }
        }

        if (issues.length > 0) {
          console.log(`⚠️ Element ${i} issues:`, issues);
        }
      }
    }

    // Take a final screenshot highlighting the analyzed elements
    await page.screenshot({
      path: 'test-results/timer-css-analysis.png',
      fullPage: true
    });
  });

  test('Performance and Animation Analysis', async () => {
    // Check for animations and their impact on layout
    await page.screenshot({
      path: 'test-results/timer-animation-analysis.png',
      fullPage: true
    });

    // Analyze animations and transitions
    const animationInfo = await page.evaluate(() => {
      const timerElements = document.querySelectorAll('[class*="timer"], [class*="countdown"], [class*="display"], [class*="time"]');
      const info = [];

      timerElements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        info.push({
          index,
          hasAnimation: computed.animation !== 'none',
          hasTransition: computed.transition !== 'all 0s ease 0s',
          animation: computed.animation,
          transition: computed.transition,
          transform: computed.transform,
          willChange: computed.willChange
        });
      });

      return info;
    });

    console.log('Animation analysis:', animationInfo);

    // Check if animations cause layout shifts
    const hasLayoutShifts = animationInfo.some(info =>
      info.hasAnimation && (info.animation.includes('scale') || info.animation.includes('width') || info.animation.includes('height'))
    );

    if (hasLayoutShifts) {
      console.log('⚠️ Potential layout shifts detected in animations');
    }
  });
});