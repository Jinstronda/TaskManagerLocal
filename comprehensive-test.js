const { chromium } = require('playwright');

async function comprehensiveTest() {
  console.log('🔍 Running comprehensive bug detection tests...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  const bugs = [];
  const logBug = (severity, component, description, details = '') => {
    bugs.push({ severity, component, description, details });
    const emoji = severity === 'CRITICAL' ? '🔴' : severity === 'MAJOR' ? '🟠' : '🟡';
    console.log(`${emoji} ${severity} - ${component}: ${description}`);
    if (details) console.log(`   💡 ${details}\n`);
  };

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Test 1: Page Load and Basic Navigation
    console.log('📋 Test 1: Page Load and Navigation');
    const startTime = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    if (loadTime > 3000) {
      logBug('MAJOR', 'Performance', 'Slow page load time', `${loadTime}ms (target: <3000ms)`);
    } else {
      console.log(`   ✅ Page loaded in ${loadTime}ms`);
    }

    // Test navigation between pages
    const pages = ['Dashboard', 'Timer', 'Tasks', 'Analytics', 'Habits', 'Settings'];
    for (const pageName of pages) {
      try {
        await page.click(`text="${pageName}"`, { timeout: 3000 });
        await page.waitForTimeout(500);
        console.log(`   ✅ ${pageName} page loads`);
      } catch (e) {
        logBug('MAJOR', 'Navigation', `${pageName} page navigation failed`, e.message);
      }
    }

    // Test 2: Dashboard Functionality
    console.log('\n📊 Test 2: Dashboard Features');
    await page.click('text="Dashboard"');
    await page.waitForTimeout(1000);

    const dashboardCards = [
      "Today's Focus Time",
      "Sessions Completed",
      "Current Streak",
      "Focus Score"
    ];

    for (const card of dashboardCards) {
      const cardElement = page.locator(`text="${card}"`);
      const isVisible = await cardElement.isVisible();
      if (isVisible) {
        console.log(`   ✅ Dashboard card "${card}" visible`);

        // Check if cards show actual data or just zeros
        const cardContainer = cardElement.locator('..').locator('..');
        const cardValue = await cardContainer.locator('p').nth(1).textContent();
        if (cardValue && cardValue.includes('0')) {
          console.log(`   ⚠️  ${card} shows "${cardValue}" - might need real data`);
        }
      } else {
        logBug('MAJOR', 'Dashboard', `Dashboard card "${card}" not visible`);
      }
    }

    // Test 3: Timer Page Functionality
    console.log('\n⏱️ Test 3: Timer Features');
    await page.click('text="Timer"');
    await page.waitForTimeout(1000);

    // Check for timer display
    const timerDisplay = page.locator('[data-testid="timer-display"], .timer-display, [class*="timer"], [class*="countdown"]');
    const hasTimerDisplay = await timerDisplay.first().isVisible().catch(() => false);
    if (hasTimerDisplay) {
      console.log('   ✅ Timer display found');
    } else {
      logBug('MAJOR', 'Timer', 'Timer display component not found');
    }

    // Check for timer controls
    const timerControls = ['Start', 'Play', 'Pause', 'Stop'];
    let controlsFound = 0;
    for (const control of timerControls) {
      const controlButton = page.locator(`button:has-text("${control}")`);
      const isVisible = await controlButton.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`   ✅ ${control} button found`);
        controlsFound++;
      }
    }

    if (controlsFound === 0) {
      logBug('CRITICAL', 'Timer', 'No timer control buttons found');
    }

    // Test timer functionality
    try {
      const startButton = page.locator('button').filter({ hasText: /start|play/i });
      const isStartVisible = await startButton.first().isVisible().catch(() => false);

      if (isStartVisible) {
        await startButton.first().click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Timer start attempted');

        // Look for pause button (indicates timer is running)
        const pauseButton = page.locator('button').filter({ hasText: /pause/i });
        const isPauseVisible = await pauseButton.first().isVisible().catch(() => false);
        if (isPauseVisible) {
          console.log('   ✅ Timer appears to be running (pause button visible)');
          await pauseButton.first().click();
          await page.waitForTimeout(1000);

          const stopButton = page.locator('button').filter({ hasText: /stop/i });
          const isStopVisible = await stopButton.first().isVisible().catch(() => false);
          if (isStopVisible) {
            await stopButton.first().click();
            console.log('   ✅ Timer stopped successfully');
          }
        } else {
          logBug('MAJOR', 'Timer', 'Timer may not be starting properly - no pause button found after start');
        }
      } else {
        logBug('MAJOR', 'Timer', 'No start button found for timer');
      }
    } catch (e) {
      logBug('MAJOR', 'Timer', 'Timer controls not working properly', e.message);
    }

    // Test 4: Task Management
    console.log('\n📝 Test 4: Task Management');
    await page.click('text="Tasks"');
    await page.waitForTimeout(1000);

    // Look for task creation button
    const createTaskSelectors = [
      'button:has-text("Add")',
      'button:has-text("Create")',
      'button:has-text("New")',
      '[data-testid="add-task"]',
      '[data-testid="create-task"]',
      '.add-task',
      '.create-task'
    ];

    let createButtonFound = false;
    for (const selector of createTaskSelectors) {
      try {
        const button = page.locator(selector);
        const isVisible = await button.first().isVisible().catch(() => false);
        if (isVisible) {
          console.log(`   ✅ Create task button found: ${selector}`);
          createButtonFound = true;

          // Try to click and open task creation form
          await button.first().click();
          await page.waitForTimeout(1000);

          // Check for form fields
          const formFields = ['title', 'description', 'category'];
          for (const field of formFields) {
            const fieldSelectors = [
              `input[name="${field}"]`,
              `textarea[name="${field}"]`,
              `input[placeholder*="${field}"]`,
              `textarea[placeholder*="${field}"]`,
              `[data-testid="${field}"]`
            ];

            let fieldFound = false;
            for (const fieldSelector of fieldSelectors) {
              const fieldElement = page.locator(fieldSelector);
              const isFieldVisible = await fieldElement.first().isVisible().catch(() => false);
              if (isFieldVisible) {
                console.log(`   ✅ Task form field "${field}" found`);
                fieldFound = true;
                break;
              }
            }

            if (!fieldFound) {
              logBug('MINOR', 'Tasks', `Task form field "${field}" not found or not accessible`);
            }
          }

          // Close the form if there's a close/cancel button
          const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
          const isCloseVisible = await closeButton.first().isVisible().catch(() => false);
          if (isCloseVisible) {
            await closeButton.first().click();
          }

          break;
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }

    if (!createButtonFound) {
      logBug('MAJOR', 'Tasks', 'Create task button not found');
    }

    // Test 5: Settings Page
    console.log('\n⚙️ Test 5: Settings');
    await page.click('text="Settings"');
    await page.waitForTimeout(1000);

    const settingsCategories = ['Theme', 'Notification', 'Timer', 'Data', 'Performance'];
    let settingsFound = 0;
    for (const category of settingsCategories) {
      const categoryElement = page.locator(`text="${category}"`);
      const isVisible = await categoryElement.first().isVisible().catch(() => false);
      if (isVisible) {
        console.log(`   ✅ Settings category "${category}" found`);
        settingsFound++;
      }
    }

    if (settingsFound === 0) {
      logBug('MAJOR', 'Settings', 'No settings categories found');
    } else {
      console.log(`   ℹ️  Found ${settingsFound}/${settingsCategories.length} expected settings categories`);
    }

    // Test 6: Analytics Page
    console.log('\n📈 Test 6: Analytics');
    await page.click('text="Analytics"');
    await page.waitForTimeout(2000); // Give time for charts to load

    // Look for charts or analytics content
    const analyticsSelectors = [
      'canvas',
      'svg',
      '[class*="chart"]',
      '[class*="graph"]',
      '[data-testid*="chart"]',
      '.recharts-wrapper'
    ];

    let analyticsFound = false;
    for (const selector of analyticsSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.first().isVisible().catch(() => false);
      if (isVisible) {
        console.log(`   ✅ Analytics visualization found: ${selector}`);
        analyticsFound = true;
        break;
      }
    }

    if (!analyticsFound) {
      logBug('MAJOR', 'Analytics', 'No analytics charts or visualizations found');
    }

    // Test 7: API Connectivity
    console.log('\n🌐 Test 7: API Connectivity');
    try {
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8765/api/health');
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
        console.log('   ✅ API connectivity working');
        console.log(`   📊 API Status: ${apiResponse.data.status}`);
      } else {
        logBug('CRITICAL', 'API', 'API health check failed', JSON.stringify(apiResponse));
      }
    } catch (e) {
      logBug('CRITICAL', 'API', 'Failed to test API connectivity', e.message);
    }

    // Test 8: Responsive Design
    console.log('\n📱 Test 8: Responsive Design');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.waitForTimeout(1000);

    const mobileNavigation = await page.locator('nav').first().isVisible().catch(() => false);
    if (mobileNavigation) {
      console.log('   ✅ Navigation visible on mobile viewport');
    } else {
      // Check for mobile menu toggle
      const menuToggle = page.locator('button[aria-label*="menu"], .mobile-menu, [class*="hamburger"]');
      const hasMenuToggle = await menuToggle.first().isVisible().catch(() => false);
      if (hasMenuToggle) {
        console.log('   ✅ Mobile menu toggle found');
      } else {
        logBug('MAJOR', 'Responsive', 'Navigation not accessible on mobile viewport');
      }
    }

    // Reset to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test 9: Check for JavaScript Errors
    console.log('\n🐛 Test 9: JavaScript Errors');
    if (consoleErrors.length > 0) {
      console.log(`   ⚠️  Found ${consoleErrors.length} console errors:`);
      consoleErrors.slice(0, 5).forEach((error, index) => {
        logBug('MAJOR', 'JavaScript', `Console error ${index + 1}`, error);
      });
      if (consoleErrors.length > 5) {
        console.log(`   ... and ${consoleErrors.length - 5} more errors`);
      }
    } else {
      console.log('   ✅ No JavaScript console errors detected');
    }

    // Test 10: Performance Check
    console.log('\n⚡ Test 10: Performance Metrics');
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        timeToInteractive: navigation.domInteractive - navigation.fetchStart
      };
    });

    console.log(`   📊 Load complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`   📊 DOM content loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`   📊 Time to interactive: ${performanceMetrics.timeToInteractive}ms`);

    if (performanceMetrics.timeToInteractive > 3000) {
      logBug('MINOR', 'Performance', 'Slow time to interactive', `${performanceMetrics.timeToInteractive}ms`);
    }

  } catch (error) {
    logBug('CRITICAL', 'General', 'Unexpected test failure', error.message);
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));

  const criticalBugs = bugs.filter(b => b.severity === 'CRITICAL');
  const majorBugs = bugs.filter(b => b.severity === 'MAJOR');
  const minorBugs = bugs.filter(b => b.severity === 'MINOR');

  console.log(`🔴 Critical Issues: ${criticalBugs.length}`);
  console.log(`🟠 Major Issues: ${majorBugs.length}`);
  console.log(`🟡 Minor Issues: ${minorBugs.length}`);
  console.log(`📊 Total Issues: ${bugs.length}\n`);

  if (bugs.length === 0) {
    console.log('🎉 No issues found! Application is working well.');
  } else {
    console.log('📝 ISSUES TO FIX:\n');

    if (criticalBugs.length > 0) {
      console.log('🔴 CRITICAL ISSUES:');
      criticalBugs.forEach((bug, i) => {
        console.log(`${i + 1}. ${bug.component}: ${bug.description}`);
        if (bug.details) console.log(`   Details: ${bug.details}`);
      });
      console.log('');
    }

    if (majorBugs.length > 0) {
      console.log('🟠 MAJOR ISSUES:');
      majorBugs.forEach((bug, i) => {
        console.log(`${i + 1}. ${bug.component}: ${bug.description}`);
        if (bug.details) console.log(`   Details: ${bug.details}`);
      });
      console.log('');
    }

    if (minorBugs.length > 0) {
      console.log('🟡 MINOR ISSUES:');
      minorBugs.forEach((bug, i) => {
        console.log(`${i + 1}. ${bug.component}: ${bug.description}`);
        if (bug.details) console.log(`   Details: ${bug.details}`);
      });
    }
  }

  return bugs;
}

comprehensiveTest().catch(console.error);