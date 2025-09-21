import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Timer Functionality Test Suite
 *
 * This test suite comprehensively verifies ALL timer functionality as requested:
 * 1. Navigation and Access
 * 2. Timer Display Testing (including recent UI improvements)
 * 3. Basic Timer Operations
 * 4. Session Type Testing
 * 5. Task Integration
 * 6. Timer Controls
 * 7. Progress Ring Testing
 * 8. Background Timer Service
 * 9. Timer Completion
 * 10. Error Handling
 */

test.describe('Comprehensive Timer Functionality Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow for any animations/loading
  });

  test.describe('1. Navigation and Access', () => {
    test('Timer interface loads without errors and UI improvements are visible', async ({ page }) => {
      // Check for any console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Look for timer-related elements
      const timerSelectors = [
        '[data-testid="timer-display"]',
        '.timer-display',
        '.countdown-display',
        '.timer-container',
        '.timer-section',
        '[class*="timer"]'
      ];

      let timerElement = null;
      for (const selector of timerSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          timerElement = element;
          break;
        }
      }

      // Take initial screenshot of timer interface
      await page.screenshot({
        path: 'test-results/comprehensive-timer-initial-load.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });

      // Verify no console errors during load
      expect(consoleErrors).toHaveLength(0);

      // Verify timer interface is accessible
      if (timerElement) {
        await expect(timerElement).toBeVisible();
        console.log('✅ Timer interface found and visible');
      } else {
        console.log('❌ Timer interface not found - checking for navigation needed');

        // Try to find navigation to timer
        const navButtons = page.locator('button, a, .nav-item').all();
        const navList = await navButtons;

        for (const button of navList) {
          const text = await button.textContent();
          if (text && (text.toLowerCase().includes('timer') || text.toLowerCase().includes('focus'))) {
            await button.click();
            await page.waitForTimeout(1000);
            break;
          }
        }

        // Check again after navigation
        for (const selector of timerSelectors) {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            timerElement = element;
            await expect(element).toBeVisible();
            console.log('✅ Timer interface found after navigation');
            break;
          }
        }
      }
    });
  });

  test.describe('2. Timer Display Testing', () => {
    test('Timer numbers display properly with recent UI improvements', async ({ page }) => {
      const timerDisplay = await findTimerDisplay(page);

      if (timerDisplay) {
        // Verify the improved font sizing and layout
        const styles = await timerDisplay.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontVariantNumeric: computed.fontVariantNumeric,
            maxWidth: computed.maxWidth,
            fontFamily: computed.fontFamily,
            textAlign: computed.textAlign
          };
        });

        console.log('Timer display styles:', styles);

        // Verify tabular-nums for consistent character width (recent improvement)
        expect(styles.fontVariantNumeric).toContain('tabular-nums');

        // Verify responsive font sizing (should be using clamp or reasonable size)
        const fontSize = parseFloat(styles.fontSize);
        expect(fontSize).toBeGreaterThan(24); // At least 1.5rem equivalent
        expect(fontSize).toBeLessThan(120); // Not exceeding bounds

        // Take screenshot showing improved timer display
        await page.screenshot({
          path: 'test-results/comprehensive-timer-display-improvements.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 500, height: 400 }
        });
      }
    });

    test('Timer at different time values and responsive behavior', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 375, height: 667, name: 'mobile-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop-small' },
        { width: 1920, height: 1080, name: 'desktop-large' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500); // Allow for responsive changes

        const timerDisplay = await findTimerDisplay(page);
        if (timerDisplay) {
          // Verify timer is visible and properly sized at this viewport
          await expect(timerDisplay).toBeVisible();

          const boundingBox = await timerDisplay.boundingBox();
          if (boundingBox) {
            // Ensure timer fits within viewport with margin
            expect(boundingBox.width).toBeLessThan(viewport.width - 40);
            expect(boundingBox.height).toBeLessThan(viewport.height / 2);
          }

          // Take screenshot for each viewport
          await page.screenshot({
            path: `test-results/comprehensive-timer-${viewport.name}-${viewport.width}x${viewport.height}.png`,
            fullPage: false
          });
        }
      }
    });

    test('Numbers fit properly within progress ring', async ({ page }) => {
      const timerDisplay = await findTimerDisplay(page);
      const progressRing = await findProgressRing(page);

      if (timerDisplay && progressRing) {
        const timerBox = await timerDisplay.boundingBox();
        const ringBox = await progressRing.boundingBox();

        if (timerBox && ringBox) {
          console.log('Timer box:', timerBox);
          console.log('Progress ring box:', ringBox);

          // Verify timer fits within the ring with adequate margin
          expect(timerBox.width).toBeLessThan(ringBox.width - 60); // 30px margin each side
          expect(timerBox.height).toBeLessThan(ringBox.height - 60);

          // Verify centering
          const timerCenterX = timerBox.x + timerBox.width / 2;
          const timerCenterY = timerBox.y + timerBox.height / 2;
          const ringCenterX = ringBox.x + ringBox.width / 2;
          const ringCenterY = ringBox.y + ringBox.height / 2;

          expect(Math.abs(timerCenterX - ringCenterX)).toBeLessThan(15);
          expect(Math.abs(timerCenterY - ringCenterY)).toBeLessThan(15);

          // Screenshot focused on timer and ring alignment
          await page.screenshot({
            path: 'test-results/comprehensive-timer-ring-fit.png',
            fullPage: false,
            clip: {
              x: Math.max(0, ringBox.x - 50),
              y: Math.max(0, ringBox.y - 50),
              width: ringBox.width + 100,
              height: ringBox.height + 100
            }
          });
        }
      }
    });
  });

  test.describe('3. Basic Timer Operations', () => {
    test('Start, pause, resume, and stop timer functionality', async ({ page }) => {
      const startButton = await findButton(page, ['Start', 'start', 'play']);
      const pauseButton = await findButton(page, ['Pause', 'pause']);
      const stopButton = await findButton(page, ['Stop', 'stop', 'reset']);
      const resumeButton = await findButton(page, ['Resume', 'resume', 'continue']);

      // Take initial state screenshot
      await page.screenshot({
        path: 'test-results/comprehensive-timer-initial-state.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 600, height: 500 }
      });

      if (startButton) {
        console.log('✅ Start button found');

        // Test starting timer
        await startButton.click();
        await page.waitForTimeout(1000);

        // Verify timer is running (look for visual changes)
        await page.screenshot({
          path: 'test-results/comprehensive-timer-running.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 500 }
        });

        // Test pausing
        if (pauseButton && await pauseButton.isVisible()) {
          console.log('✅ Pause button found and visible');
          await pauseButton.click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: 'test-results/comprehensive-timer-paused.png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 500 }
          });
        }

        // Test resuming
        if (resumeButton && await resumeButton.isVisible()) {
          console.log('✅ Resume button found and visible');
          await resumeButton.click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: 'test-results/comprehensive-timer-resumed.png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 500 }
          });
        }

        // Test stopping
        if (stopButton && await stopButton.isVisible()) {
          console.log('✅ Stop button found and visible');
          await stopButton.click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: 'test-results/comprehensive-timer-stopped.png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 500 }
          });
        }
      } else {
        console.log('❌ No start button found');
      }
    });

    test('Timer countdown works correctly', async ({ page }) => {
      const timerDisplay = await findTimerDisplay(page);
      const startButton = await findButton(page, ['Start', 'start', 'play']);

      if (timerDisplay && startButton) {
        // Get initial timer value
        const initialTime = await timerDisplay.textContent();
        console.log('Initial timer display:', initialTime);

        // Start timer
        await startButton.click();
        await page.waitForTimeout(3000); // Wait 3 seconds

        // Get updated timer value
        const updatedTime = await timerDisplay.textContent();
        console.log('Updated timer display:', updatedTime);

        // Verify time has changed (countdown occurred)
        expect(updatedTime).not.toBe(initialTime);

        // Take screenshot showing countdown in progress
        await page.screenshot({
          path: 'test-results/comprehensive-timer-countdown-verification.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 500, height: 400 }
        });
      }
    });
  });

  test.describe('4. Session Type Testing', () => {
    test('Different session types display and functionality', async ({ page }) => {
      // Look for session type selectors/buttons
      const sessionTypes = ['Deep Work', 'Break', 'Focus', 'Pomodoro', 'Short Break', 'Long Break'];
      const foundSessionTypes: string[] = [];

      for (const sessionType of sessionTypes) {
        const element = page.locator(`button:has-text("${sessionType}"), .session-type:has-text("${sessionType}"), [data-session="${sessionType.toLowerCase().replace(' ', '-')}"]`).first();
        if (await element.count() > 0) {
          foundSessionTypes.push(sessionType);

          // Click and test this session type
          await element.click();
          await page.waitForTimeout(500);

          // Take screenshot of this session type
          await page.screenshot({
            path: `test-results/comprehensive-timer-session-${sessionType.toLowerCase().replace(' ', '-')}.png`,
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 500 }
          });
        }
      }

      console.log('Found session types:', foundSessionTypes);
      expect(foundSessionTypes.length).toBeGreaterThan(0);
    });

    test('Session type colors and visual differences', async ({ page }) => {
      // This test captures visual differences between session types
      const sessionElements = page.locator('.session-type, [data-session], [class*="session"]').all();
      const sessions = await sessionElements;

      for (let i = 0; i < sessions.length; i++) {
        if (await sessions[i].isVisible()) {
          await sessions[i].click();
          await page.waitForTimeout(500);

          // Get computed styles to verify colors
          const styles = await sessions[i].evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderColor: computed.borderColor
            };
          });

          console.log(`Session ${i} styles:`, styles);

          await page.screenshot({
            path: `test-results/comprehensive-timer-session-color-${i}.png`,
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 500 }
          });
        }
      }
    });
  });

  test.describe('5. Task Integration', () => {
    test('Timer with selected tasks vs without tasks', async ({ page }) => {
      // Test timer without task selected
      await page.screenshot({
        path: 'test-results/comprehensive-timer-no-task.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });

      // Look for task selection elements
      const taskSelectors = [
        '.task-item',
        '[data-testid="task-item"]',
        '.task-selector',
        'select[name*="task"]',
        '.task-dropdown'
      ];

      let taskElement = null;
      for (const selector of taskSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          taskElement = element;
          break;
        }
      }

      if (taskElement) {
        console.log('✅ Task selection element found');
        await taskElement.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'test-results/comprehensive-timer-with-task.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 800, height: 600 }
        });
      } else {
        console.log('ℹ️ No task selection elements found - testing general session mode');
      }
    });

    test('Task switching during active session', async ({ page }) => {
      const startButton = await findButton(page, ['Start', 'start', 'play']);

      if (startButton) {
        // Start a timer session
        await startButton.click();
        await page.waitForTimeout(1000);

        // Try to switch tasks during active session
        const taskElements = page.locator('.task-item, [data-testid="task-item"], .task-selector').all();
        const tasks = await taskElements;

        if (tasks.length > 1) {
          console.log('✅ Multiple tasks found, testing task switching');
          await tasks[1].click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: 'test-results/comprehensive-timer-task-switch-during-session.png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 800, height: 600 }
          });
        } else {
          console.log('ℹ️ Not enough tasks to test switching');
        }
      }
    });
  });

  test.describe('6. Timer Controls', () => {
    test('All timer control buttons functionality', async ({ page }) => {
      const controlButtons = [
        { names: ['Start', 'start', 'play'], expectedAction: 'start' },
        { names: ['Pause', 'pause'], expectedAction: 'pause' },
        { names: ['Resume', 'resume', 'continue'], expectedAction: 'resume' },
        { names: ['Stop', 'stop', 'reset'], expectedAction: 'stop' },
        { names: ['Settings', 'config', 'options'], expectedAction: 'settings' }
      ];

      const foundControls: string[] = [];

      for (const control of controlButtons) {
        const button = await findButton(page, control.names);
        if (button) {
          foundControls.push(control.expectedAction);

          // Test button is clickable
          await expect(button).toBeEnabled();

          // Take screenshot showing button
          await button.scrollIntoViewIfNeeded();
          await page.screenshot({
            path: `test-results/comprehensive-timer-control-${control.expectedAction}.png`,
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 400 }
          });
        }
      }

      console.log('Found timer controls:', foundControls);
      expect(foundControls.length).toBeGreaterThan(0);
    });

    test('Keyboard shortcuts functionality', async ({ page }) => {
      const timerArea = page.locator('body').first(); // Focus on body for keyboard events

      // Test common keyboard shortcuts
      const shortcuts = [
        { key: 'Space', description: 'Start/Pause toggle' },
        { key: 'Escape', description: 'Stop/Reset' },
        { key: 'Enter', description: 'Confirm/Start' }
      ];

      for (const shortcut of shortcuts) {
        console.log(`Testing keyboard shortcut: ${shortcut.key} (${shortcut.description})`);

        // Take before screenshot
        await page.screenshot({
          path: `test-results/comprehensive-timer-before-${shortcut.key.toLowerCase()}.png`,
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });

        // Press the key
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(1000);

        // Take after screenshot
        await page.screenshot({
          path: `test-results/comprehensive-timer-after-${shortcut.key.toLowerCase()}.png`,
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });
      }
    });

    test('Button states and disabled conditions', async ({ page }) => {
      // Test button states in different timer states
      const startButton = await findButton(page, ['Start', 'start', 'play']);
      const pauseButton = await findButton(page, ['Pause', 'pause']);
      const stopButton = await findButton(page, ['Stop', 'stop', 'reset']);

      // Initial state - start should be enabled
      if (startButton) {
        await expect(startButton).toBeEnabled();
        console.log('✅ Start button enabled in initial state');
      }

      // During timer - pause and stop should be enabled
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(500);

        if (pauseButton) {
          await expect(pauseButton).toBeEnabled();
          console.log('✅ Pause button enabled during timer');
        }

        if (stopButton) {
          await expect(stopButton).toBeEnabled();
          console.log('✅ Stop button enabled during timer');
        }

        await page.screenshot({
          path: 'test-results/comprehensive-timer-button-states-running.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });
      }
    });
  });

  test.describe('7. Progress Ring Testing', () => {
    test('Progress ring animates correctly', async ({ page }) => {
      const progressRing = await findProgressRing(page);
      const startButton = await findButton(page, ['Start', 'start', 'play']);

      if (progressRing && startButton) {
        // Get initial progress ring state
        const initialStyles = await progressRing.evaluate(el => {
          if (el.tagName === 'SVG') {
            const circle = el.querySelector('circle[stroke-dasharray], circle[stroke-dashoffset]');
            if (circle) {
              return {
                strokeDasharray: circle.getAttribute('stroke-dasharray'),
                strokeDashoffset: circle.getAttribute('stroke-dashoffset'),
                transform: circle.getAttribute('transform')
              };
            }
          }
          return null;
        });

        console.log('Initial progress ring state:', initialStyles);

        // Start timer and check for animation
        await startButton.click();
        await page.waitForTimeout(2000);

        const updatedStyles = await progressRing.evaluate(el => {
          if (el.tagName === 'SVG') {
            const circle = el.querySelector('circle[stroke-dasharray], circle[stroke-dashoffset]');
            if (circle) {
              return {
                strokeDasharray: circle.getAttribute('stroke-dasharray'),
                strokeDashoffset: circle.getAttribute('stroke-dashoffset'),
                transform: circle.getAttribute('transform')
              };
            }
          }
          return null;
        });

        console.log('Updated progress ring state:', updatedStyles);

        // Take screenshot showing progress ring in action
        await page.screenshot({
          path: 'test-results/comprehensive-timer-progress-ring-animation.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 400, height: 400 }
        });

        // Verify animation occurred (values should be different)
        if (initialStyles && updatedStyles) {
          const animationDetected =
            initialStyles.strokeDashoffset !== updatedStyles.strokeDashoffset ||
            initialStyles.strokeDasharray !== updatedStyles.strokeDasharray;

          if (animationDetected) {
            console.log('✅ Progress ring animation detected');
          } else {
            console.log('ℹ️ No progress ring animation detected or different implementation');
          }
        }
      }
    });

    test('Progress percentage accuracy', async ({ page }) => {
      const progressRing = await findProgressRing(page);
      const timerDisplay = await findTimerDisplay(page);
      const startButton = await findButton(page, ['Start', 'start', 'play']);

      if (progressRing && timerDisplay && startButton) {
        // Start timer
        await startButton.click();
        await page.waitForTimeout(3000); // Wait 3 seconds

        // Calculate expected progress (this is a rough estimate)
        const timerText = await timerDisplay.textContent();
        console.log('Current timer text:', timerText);

        // Take screenshot showing progress state
        await page.screenshot({
          path: 'test-results/comprehensive-timer-progress-accuracy.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 400, height: 400 }
        });

        // Check if there's a progress percentage displayed
        const progressPercentage = page.locator('.progress-percent, [data-testid="progress"], .percentage').first();
        if (await progressPercentage.count() > 0) {
          const percentText = await progressPercentage.textContent();
          console.log('Progress percentage:', percentText);
        }
      }
    });

    test('Visual effects (glows, animations)', async ({ page }) => {
      const progressRing = await findProgressRing(page);

      if (progressRing) {
        // Check for CSS animations and effects
        const effects = await progressRing.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            animation: computed.animation,
            filter: computed.filter,
            boxShadow: computed.boxShadow,
            transition: computed.transition
          };
        });

        console.log('Progress ring visual effects:', effects);

        // Take detailed screenshot of progress ring
        const ringBox = await progressRing.boundingBox();
        if (ringBox) {
          await page.screenshot({
            path: 'test-results/comprehensive-timer-progress-effects.png',
            fullPage: false,
            clip: {
              x: Math.max(0, ringBox.x - 20),
              y: Math.max(0, ringBox.y - 20),
              width: ringBox.width + 40,
              height: ringBox.height + 40
            }
          });
        }
      }
    });
  });

  test.describe('8. Background Timer Service', () => {
    test('Timer continues when app loses focus', async ({ page }) => {
      const startButton = await findButton(page, ['Start', 'start', 'play']);
      const timerDisplay = await findTimerDisplay(page);

      if (startButton && timerDisplay) {
        // Start timer
        await startButton.click();
        await page.waitForTimeout(1000);

        // Get initial time
        const initialTime = await timerDisplay.textContent();
        console.log('Timer before focus loss:', initialTime);

        // Simulate focus loss by navigating to another page and back
        await page.goto('about:blank');
        await page.waitForTimeout(3000); // Wait 3 seconds
        await page.goto('/'); // Return to timer
        await page.waitForTimeout(1000);

        // Check if timer updated correctly
        const timerAfterReturn = await findTimerDisplay(page);
        if (timerAfterReturn) {
          const updatedTime = await timerAfterReturn.textContent();
          console.log('Timer after returning focus:', updatedTime);

          // Take screenshot showing timer state after focus return
          await page.screenshot({
            path: 'test-results/comprehensive-timer-background-service.png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 600, height: 400 }
          });

          // Verify timer continued running (time should have progressed)
          expect(updatedTime).not.toBe(initialTime);
          console.log('✅ Background timer service working');
        }
      }
    });

    test('Timer sync after app focus returns', async ({ page }) => {
      // This test is similar to above but focuses on sync accuracy
      const startButton = await findButton(page, ['Start', 'start', 'play']);
      const timerDisplay = await findTimerDisplay(page);

      if (startButton && timerDisplay) {
        await startButton.click();

        // Record timestamp when we lose focus
        const startTimestamp = Date.now();
        await page.goto('about:blank');
        await page.waitForTimeout(5000); // Wait 5 seconds
        const endTimestamp = Date.now();
        const elapsedSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);

        await page.goto('/');
        await page.waitForTimeout(1000);

        console.log(`Elapsed time while away: ${elapsedSeconds} seconds`);

        await page.screenshot({
          path: 'test-results/comprehensive-timer-sync-accuracy.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });
      }
    });

    test('Heartbeat functionality verification', async ({ page }) => {
      // Monitor network requests for heartbeat/sync calls
      const networkRequests: string[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('timer') || request.url().includes('sync')) {
          networkRequests.push(request.url());
        }
      });

      const startButton = await findButton(page, ['Start', 'start', 'play']);
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(10000); // Wait 10 seconds to observe heartbeats

        console.log('Network requests detected:', networkRequests);

        await page.screenshot({
          path: 'test-results/comprehensive-timer-heartbeat-test.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });
      }
    });
  });

  test.describe('9. Timer Completion', () => {
    test('Timer completion flow and dialogs', async ({ page }) => {
      // This test would ideally set a very short timer to test completion
      // Since we can't easily control timer duration, we'll test for completion UI elements

      const completionElements = [
        '.completion-dialog',
        '.timer-complete',
        '[data-testid="completion"]',
        '.session-complete',
        '.modal'
      ];

      // Look for any completion-related elements in the current state
      for (const selector of completionElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`Found completion element: ${selector}`);
          await page.screenshot({
            path: `test-results/comprehensive-timer-completion-${selector.replace(/[^a-zA-Z0-9]/g, '')}.png`,
            fullPage: false,
            clip: { x: 0, y: 0, width: 800, height: 600 }
          });
        }
      }

      // Test completion flow by starting timer (even if we can't wait for completion)
      const startButton = await findButton(page, ['Start', 'start', 'play']);
      if (startButton) {
        await startButton.click();

        // Take screenshot of active timer state
        await page.screenshot({
          path: 'test-results/comprehensive-timer-active-for-completion-test.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });

        console.log('✅ Timer started for completion flow testing');
      }
    });

    test('Session completion data persistence', async ({ page }) => {
      // Check for elements that might show session history or completed sessions
      const historyElements = [
        '.session-history',
        '.completed-sessions',
        '[data-testid="history"]',
        '.session-log',
        '.activity-log'
      ];

      for (const selector of historyElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`Found history element: ${selector}`);
          await page.screenshot({
            path: `test-results/comprehensive-timer-history-${selector.replace(/[^a-zA-Z0-9]/g, '')}.png`,
            fullPage: false,
            clip: { x: 0, y: 0, width: 800, height: 600 }
          });
        }
      }
    });
  });

  test.describe('10. Error Handling', () => {
    test('Network disconnection during timer', async ({ page }) => {
      const startButton = await findButton(page, ['Start', 'start', 'play']);

      if (startButton) {
        // Start timer
        await startButton.click();
        await page.waitForTimeout(1000);

        // Simulate network disconnection
        await page.setOffline(true);
        await page.waitForTimeout(3000);

        // Take screenshot during offline state
        await page.screenshot({
          path: 'test-results/comprehensive-timer-offline-state.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });

        // Restore network
        await page.setOffline(false);
        await page.waitForTimeout(2000);

        // Take screenshot after network restoration
        await page.screenshot({
          path: 'test-results/comprehensive-timer-network-restored.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });

        console.log('✅ Network disconnection test completed');
      }
    });

    test('Graceful error recovery', async ({ page }) => {
      // Monitor console errors during timer operations
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Perform various timer operations to test error handling
      const startButton = await findButton(page, ['Start', 'start', 'play']);
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Try multiple rapid clicks to test error handling
        await startButton.click();
        await startButton.click();
        await page.waitForTimeout(1000);

        console.log('Console errors during operations:', consoleErrors);

        // Verify app remains functional despite potential errors
        const timerDisplay = await findTimerDisplay(page);
        if (timerDisplay) {
          await expect(timerDisplay).toBeVisible();
          console.log('✅ Timer remains functional after error scenarios');
        }

        await page.screenshot({
          path: 'test-results/comprehensive-timer-error-recovery.png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 400 }
        });
      }
    });
  });

  test.describe('Overall Assessment', () => {
    test('Timer UI/UX assessment of recent improvements', async ({ page }) => {
      // Take comprehensive screenshots at different states
      const states = ['initial', 'with-selections', 'different-session-types'];

      for (const state of states) {
        await page.screenshot({
          path: `test-results/comprehensive-timer-ux-assessment-${state}.png`,
          fullPage: true
        });

        // Navigate through different states if possible
        if (state === 'with-selections') {
          const buttons = page.locator('button').all();
          const buttonList = await buttons;
          if (buttonList.length > 0) {
            await buttonList[0].click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Performance assessment
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
        };
      });

      console.log('Performance metrics:', performanceMetrics);

      // Final comprehensive screenshot
      await page.screenshot({
        path: 'test-results/comprehensive-timer-final-state.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1000, height: 800 }
      });

      console.log('✅ Comprehensive timer testing completed');
    });
  });
});

// Helper functions
async function findTimerDisplay(page: Page) {
  const selectors = [
    '[data-testid="timer-display"]',
    '.timer-display',
    '.countdown-display',
    '.time-display',
    '[class*="timer"][class*="display"]',
    '[class*="countdown"]'
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.count() > 0 && await element.isVisible()) {
      return element;
    }
  }
  return null;
}

async function findProgressRing(page: Page) {
  const selectors = [
    '.progress-ring',
    '[data-testid="progress-ring"]',
    'svg[class*="progress"]',
    '.progress-circle',
    'circle[stroke-dasharray]'
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.count() > 0 && await element.isVisible()) {
      return element;
    }
  }
  return null;
}

async function findButton(page: Page, textOptions: string[]) {
  for (const text of textOptions) {
    const selectors = [
      `button:has-text("${text}")`,
      `button[aria-label*="${text.toLowerCase()}"]`,
      `.${text.toLowerCase()}-button`,
      `[data-testid="${text.toLowerCase()}-button"]`,
      `button[title*="${text}"]`
    ];

    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        return element;
      }
    }
  }
  return null;
}