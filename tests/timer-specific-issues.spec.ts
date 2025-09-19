import { test, expect, Page } from '@playwright/test';

/**
 * Focused Timer UI Issues Test
 *
 * This test specifically examines the timer number display issues
 * identified from the comprehensive analysis
 */

test.describe('Timer Specific UI Issues', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/timer');
    await page.waitForSelector('text=/\\d{1,2}:\\d{2}/', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('Timer Number Display Analysis', async () => {
    // Find the countdown display element
    const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}/').first();

    // Get current time display
    const timeText = await timerDisplay.textContent();
    console.log('📊 Current timer display:', timeText);

    // Analyze the timer display container and positioning
    const timerContainer = await page.locator('.bg-white').first();
    const progressRing = await page.locator('svg').first();

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/timer-number-analysis.png',
      fullPage: true
    });

    // Get detailed measurements
    const timerBox = await timerDisplay.boundingBox();
    const containerBox = await timerContainer.boundingBox();
    const ringBox = await progressRing.boundingBox();

    console.log('📏 Timer display box:', timerBox);
    console.log('📦 Container box:', containerBox);
    console.log('⭕ Progress ring box:', ringBox);

    // Check if timer is properly centered within the progress ring
    if (timerBox && ringBox) {
      const timerCenterX = timerBox.x + timerBox.width / 2;
      const timerCenterY = timerBox.y + timerBox.height / 2;
      const ringCenterX = ringBox.x + ringBox.width / 2;
      const ringCenterY = ringBox.y + ringBox.height / 2;

      const xOffset = Math.abs(timerCenterX - ringCenterX);
      const yOffset = Math.abs(timerCenterY - ringCenterY);

      console.log(`🎯 Centering analysis:
        Timer center: (${timerCenterX}, ${timerCenterY})
        Ring center: (${ringCenterX}, ${ringCenterY})
        X offset: ${xOffset}px
        Y offset: ${yOffset}px`);

      if (xOffset > 5 || yOffset > 5) {
        console.log('⚠️ Timer appears misaligned within progress ring');
      }
    }

    // Analyze font sizing and spacing
    const fontAnalysis = await timerDisplay.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return {
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        actualWidth: rect.width,
        actualHeight: rect.height,
        text: el.textContent,
        // Estimate if text fits comfortably
        estimatedCharWidth: parseFloat(computed.fontSize) * 0.6, // Monospace approximation
      };
    });

    console.log('🔤 Font analysis:', fontAnalysis);

    // Calculate if current text fits well
    const textLength = fontAnalysis.text?.length || 0;
    const estimatedTextWidth = textLength * fontAnalysis.estimatedCharWidth;
    const widthRatio = estimatedTextWidth / fontAnalysis.actualWidth;

    console.log(`📐 Text fitting analysis:
      Text length: ${textLength} chars
      Estimated text width: ${estimatedTextWidth}px
      Actual container width: ${fontAnalysis.actualWidth}px
      Width ratio: ${widthRatio.toFixed(2)} (should be < 0.9 for comfortable fit)`);

    if (widthRatio > 0.9) {
      console.log('⚠️ Text may be too tight within container');
    }
  });

  test('Test Different Time Formats by Duration Setting', async () => {
    // Test different session types which likely have different durations
    const sessionTypes = [
      { name: 'Quick Task', expectedMinutes: 15 },
      { name: 'Deep Work', expectedMinutes: 50 },
      { name: 'Break Time', expectedMinutes: 10 },
      { name: 'Custom', expectedMinutes: 25 }
    ];

    for (const sessionType of sessionTypes) {
      console.log(`\n🧪 Testing ${sessionType.name} session type...`);

      // Click on the session type
      const sessionButton = page.locator('button', { hasText: sessionType.name });

      if (await sessionButton.isVisible()) {
        await sessionButton.click();
        await page.waitForTimeout(500); // Allow UI to update

        // Get the timer display after selection
        const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}/').first();
        const timeText = await timerDisplay.textContent();
        console.log(`⏱️ ${sessionType.name} timer shows: ${timeText}`);

        // Take screenshot for this session type
        await page.screenshot({
          path: `test-results/timer-${sessionType.name.toLowerCase().replace(' ', '-')}-format.png`,
          fullPage: true
        });

        // Analyze if the format changes affect layout
        const currentBox = await timerDisplay.boundingBox();
        console.log(`📏 ${sessionType.name} timer box:`, currentBox);

        // Check for potential issues with longer time formats
        if (timeText && timeText.includes(':')) {
          const parts = timeText.split(':');
          if (parts[0] && parseInt(parts[0]) >= 60) {
            console.log(`⚠️ ${sessionType.name}: Time shows >= 60 minutes, may need hour format`);
          }
        }
      } else {
        console.log(`❌ ${sessionType.name} button not found`);
      }
    }
  });

  test('Timer Start and Countdown Analysis', async () => {
    console.log('\n🚀 Testing timer start and countdown behavior...');

    // Look for play/start button
    const startButton = page.locator('button[aria-label*="start"], button[title*="start"], button:has-text("Start")').first();

    // If no explicit start button, look for any clickable element that might start timer
    const possibleStartElements = await page.locator('button').all();

    console.log(`Found ${possibleStartElements.length} buttons on page`);

    // Try to find and click start button
    let timerStarted = false;

    for (const element of possibleStartElements) {
      const text = await element.textContent();
      const isVisible = await element.isVisible();

      console.log(`Button: "${text?.trim()}" - Visible: ${isVisible}`);

      // Look for play symbol or start-related text
      if (isVisible && (text?.includes('▶') || text?.toLowerCase().includes('start') || text?.trim() === '')) {
        console.log(`🎯 Attempting to click potential start button: "${text}"`);

        try {
          await element.click();
          await page.waitForTimeout(2000);

          // Check if timer started by looking for visual changes
          const newTimeText = await page.locator('text=/\\d{1,2}:\\d{2}/').first().textContent();
          console.log(`⏱️ After click, timer shows: ${newTimeText}`);

          // Take screenshot of running state
          await page.screenshot({
            path: 'test-results/timer-running-analysis.png',
            fullPage: true
          });

          // Check for running indicators (animations, color changes, etc.)
          const runningIndicators = await page.evaluate(() => {
            // Look for elements that might indicate running state
            const indicators = [];

            // Check for animated elements
            const animatedElements = document.querySelectorAll('[class*="animate"], [class*="pulse"]');
            animatedElements.forEach(el => {
              const computed = window.getComputedStyle(el);
              if (computed.animation !== 'none') {
                indicators.push({
                  type: 'animation',
                  element: el.className,
                  animation: computed.animation
                });
              }
            });

            // Check for colored elements that might indicate status
            const coloredElements = document.querySelectorAll('[style*="color"], [class*="green"], [class*="blue"], [class*="red"]');
            coloredElements.forEach(el => {
              if (el.textContent?.trim()) {
                indicators.push({
                  type: 'colored_text',
                  text: el.textContent.trim(),
                  className: el.className
                });
              }
            });

            return indicators;
          });

          console.log('🎨 Running state indicators:', runningIndicators);

          // Wait a bit longer to see if numbers change
          await page.waitForTimeout(3000);
          const laterTimeText = await page.locator('text=/\\d{1,2}:\\d{2}/').first().textContent();
          console.log(`⏱️ After 3 seconds, timer shows: ${laterTimeText}`);

          if (newTimeText !== laterTimeText) {
            console.log('✅ Timer is counting down - numbers are changing');
            timerStarted = true;

            // Take screenshot showing countdown in progress
            await page.screenshot({
              path: 'test-results/timer-countdown-in-progress.png',
              fullPage: true
            });
          }

          break; // Exit loop after first successful attempt
        } catch (error) {
          console.log(`❌ Failed to click button: ${error}`);
        }
      }
    }

    if (!timerStarted) {
      console.log('⚠️ Could not start timer or detect countdown');
    }
  });

  test('Responsive Layout Analysis - Critical Breakpoints', async () => {
    console.log('\n📱 Testing responsive behavior at critical breakpoints...');

    // Test specific breakpoints where issues are most likely
    const criticalViewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 360, height: 640, name: 'Small Android' },
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1024, height: 768, name: 'iPad Landscape' }
    ];

    for (const viewport of criticalViewports) {
      console.log(`\n📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000); // Allow responsive adjustments

      // Take screenshot
      await page.screenshot({
        path: `test-results/responsive-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true
      });

      const timerDisplay = await page.locator('text=/\\d{1,2}:\\d{2}/').first();

      if (await timerDisplay.isVisible()) {
        const box = await timerDisplay.boundingBox();
        const viewport_usage = box ? {
          widthPercent: (box.width / viewport.width * 100).toFixed(1),
          heightPercent: (box.height / viewport.height * 100).toFixed(1),
          leftMargin: box.x,
          topMargin: box.y
        } : null;

        console.log(`📊 ${viewport.name} timer usage:`, viewport_usage);

        // Check for text overflow issues
        const overflowCheck = await timerDisplay.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const parent = el.parentElement;
          const parentRect = parent ? parent.getBoundingClientRect() : null;

          return {
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            elementWidth: rect.width,
            parentWidth: parentRect?.width,
            isOverflowing: el.scrollWidth > el.clientWidth,
            exceedsParent: parentRect ? rect.width > parentRect.width : false
          };
        });

        console.log(`🔍 ${viewport.name} overflow check:`, overflowCheck);

        if (overflowCheck.isOverflowing) {
          console.log(`⚠️ ${viewport.name}: Text overflow detected!`);
        }

        if (overflowCheck.exceedsParent) {
          console.log(`⚠️ ${viewport.name}: Timer exceeds parent container!`);
        }
      } else {
        console.log(`❌ ${viewport.name}: Timer not visible at this size`);
      }
    }
  });
});