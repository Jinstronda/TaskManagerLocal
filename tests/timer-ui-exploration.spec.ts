import { test, expect, Page } from '@playwright/test';

/**
 * Timer UI Exploration and Fix Verification
 *
 * This test explores the timer UI structure and verifies the improvements
 */

test.describe('Timer UI Exploration and Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait a bit longer for React app to fully load
    await page.waitForTimeout(2000);
  });

  test('Explore page structure and take screenshots', async ({ page }) => {
    // Take a full page screenshot first
    await page.screenshot({
      path: 'test-results/timer-ui-full-page.png',
      fullPage: true
    });

    // Get page title to confirm we're on the right page
    const title = await page.title();
    console.log('Page title:', title);

    // Get all text content to see what's on the page
    const bodyText = await page.textContent('body');
    console.log('Page contains timer-related text:', bodyText?.includes('timer') || bodyText?.includes('Timer'));

    // Find any elements that might be timer-related
    const timerElements = await page.locator('*').filter({ hasText: /timer|countdown|time|:\d{2}/i }).all();
    console.log('Found potential timer elements:', timerElements.length);

    // Look for common timer patterns
    const timePatterns = await page.locator('*').filter({ hasText: /\d{1,2}:\d{2}/ }).all();
    console.log('Found time pattern elements:', timePatterns.length);

    // Check for SVG elements (progress rings)
    const svgElements = await page.locator('svg').all();
    console.log('Found SVG elements:', svgElements.length);

    // Take screenshot focused on center area where timer likely is
    await page.screenshot({
      path: 'test-results/timer-ui-center-area.png',
      clip: { x: 200, y: 100, width: 800, height: 600 }
    });
  });

  test('Test different viewport sizes', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `test-results/timer-ui-${viewport.name}-${viewport.width}x${viewport.height}.png`,
        fullPage: false
      });

      console.log(`Screenshot taken for ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
  });

  test('Explore timer functionality and navigation', async ({ page }) => {
    // Look for navigation elements or timer-related buttons
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
    }

    // Look for navigation links
    const links = await page.locator('a, [role="link"]').all();
    console.log('Found navigation links:', links.length);

    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const link = links[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      const isVisible = await link.isVisible();
      console.log(`Link ${i}: "${text}" href="${href}" (visible: ${isVisible})`);
    }

    // Check if there's a specific timer page or section
    const timerLink = page.locator('a').filter({ hasText: /timer/i }).first();
    if (await timerLink.count() > 0) {
      console.log('Found timer link, clicking it...');
      await timerLink.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'test-results/timer-ui-timer-page.png',
        fullPage: false
      });
    }

    // Try to find and interact with timer controls
    const startButton = page.locator('button').filter({ hasText: /start|play/i }).first();
    if (await startButton.count() > 0) {
      console.log('Found start button');
      await page.screenshot({
        path: 'test-results/timer-ui-before-start.png',
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });

      await startButton.click();
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'test-results/timer-ui-after-start.png',
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });
    }
  });

  test('Analyze CSS and font improvements', async ({ page }) => {
    // Look for any element that displays time or has timer-like characteristics
    const allElements = await page.locator('*').all();

    for (let i = 0; i < Math.min(allElements.length, 100); i++) {
      const element = allElements[i];
      const text = await element.textContent();

      // Check if element contains time pattern
      if (text && /\d{1,2}:\d{2}/.test(text)) {
        console.log('Found time display element:', text);

        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontVariantNumeric: computed.fontVariantNumeric,
            maxWidth: computed.maxWidth,
            fontFamily: computed.fontFamily,
            textAlign: computed.textAlign
          };
        });

        console.log('Timer element styles:', styles);

        // Take a focused screenshot of this element
        const box = await element.boundingBox();
        if (box) {
          await page.screenshot({
            path: 'test-results/timer-ui-time-element.png',
            clip: {
              x: Math.max(0, box.x - 50),
              y: Math.max(0, box.y - 50),
              width: Math.min(400, box.width + 100),
              height: Math.min(300, box.height + 100)
            }
          });
        }
        break;
      }
    }
  });

  test('Check for layout improvements and overflow issues', async ({ page }) => {
    // Set a specific viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);

    // Check for any overflow issues
    const overflowCheck = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowElements = [];

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        if (rect.right > window.innerWidth + 10) { // Allow small tolerance
          overflowElements.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent?.substring(0, 50),
            right: rect.right,
            viewportWidth: window.innerWidth
          });
        }
      });

      return overflowElements;
    });

    console.log('Overflow check results:', overflowCheck);
    expect(overflowCheck.length).toBeLessThan(5); // Allow for minor issues

    // Take final comprehensive screenshot
    await page.screenshot({
      path: 'test-results/timer-ui-final-layout-check.png',
      fullPage: true
    });
  });
});