const { chromium } = require('playwright');

async function testLocalTaskTracker() {
  console.log('🚀 Starting Local Task Tracker testing...\n');

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    slowMo: 1000      // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  const issues = [];
  const logIssue = (severity, component, description, details = '') => {
    issues.push({ severity, component, description, details });
    console.log(`${severity === 'CRITICAL' ? '🔴' : severity === 'MAJOR' ? '🟠' : '🟡'} ${severity} - ${component}: ${description}`);
    if (details) console.log(`   Details: ${details}\n`);
  };

  try {
    // Test 1: Initial Page Load
    console.log('📝 Test 1: Initial Page Load');
    const startTime = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    if (loadTime > 3000) {
      logIssue('MAJOR', 'Performance', 'Page load time exceeded 3 seconds', `Load time: ${loadTime}ms`);
    }

    // Check if page loaded correctly
    const title = await page.title();
    console.log(`   Page title: ${title}`);

    // Test 2: Navigation and Layout
    console.log('📝 Test 2: Navigation and Layout');

    // Check for main navigation elements
    const navItems = ['Dashboard', 'Timer', 'Tasks', 'Analytics', 'Habits', 'Settings'];
    for (const item of navItems) {
      try {
        await page.locator(`text="${item}"`).first().waitFor({ timeout: 5000 });
        console.log(`   ✅ Navigation item "${item}" found`);
      } catch (e) {
        logIssue('MAJOR', 'Navigation', `Navigation item "${item}" not found or not clickable`);
      }
    }

    // Test 3: Dashboard Functionality
    console.log('📝 Test 3: Dashboard Functionality');

    // Navigate to dashboard (should be default page)
    try {
      await page.click('text="Dashboard"');
      await page.waitForLoadState('networkidle');

      // Check for dashboard cards
      const dashboardCards = [
        "Today's Focus Time",
        "Sessions Completed",
        "Current Streak",
        "Focus Score"
      ];

      for (const card of dashboardCards) {
        try {
          await page.locator(`text="${card}"`).first().waitFor({ timeout: 3000 });
          console.log(`   ✅ Dashboard card "${card}" found`);
        } catch (e) {
          logIssue('MAJOR', 'Dashboard', `Dashboard card "${card}" not found`);
        }
      }
    } catch (e) {
      logIssue('CRITICAL', 'Dashboard', 'Failed to navigate to dashboard', e.message);
    }

    // Test 4: Timer Functionality
    console.log('📝 Test 4: Timer Functionality');

    try {
      await page.click('text="Timer"');
      await page.waitForLoadState('networkidle');
      console.log('   ✅ Timer page loaded');

      // Look for timer controls
      const timerElements = ['Start', 'Pause', 'Stop', 'Deep Work', 'Quick Task', 'Break'];
      for (const element of timerElements) {
        try {
          const elementFound = await page.locator(`text="${element}"`).first().isVisible();
          if (elementFound) {
            console.log(`   ✅ Timer element "${element}" visible`);
          }
        } catch (e) {
          // Element might not be visible, check alternative selectors
          try {
            await page.locator(`button:has-text("${element}")`).first().waitFor({ timeout: 1000 });
            console.log(`   ✅ Timer button "${element}" found`);
          } catch (e2) {
            logIssue('MAJOR', 'Timer', `Timer element "${element}" not found`);
          }
        }
      }

      // Try to start a timer
      try {
        const startButton = page.locator('button').filter({ hasText: /start/i }).first();
        const isStartVisible = await startButton.isVisible();
        if (isStartVisible) {
          await startButton.click();
          console.log('   ✅ Timer start button clicked');

          // Wait a moment and check if timer is running
          await page.waitForTimeout(2000);

          // Look for pause or stop button (indicates timer is running)
          try {
            const pauseButton = page.locator('button').filter({ hasText: /pause/i });
            const isPauseVisible = await pauseButton.isVisible();
            if (isPauseVisible) {
              console.log('   ✅ Timer appears to be running (pause button visible)');

              // Stop the timer
              await pauseButton.click();
              await page.waitForTimeout(1000);

              const stopButton = page.locator('button').filter({ hasText: /stop/i });
              const isStopVisible = await stopButton.isVisible();
              if (isStopVisible) {
                await stopButton.click();
                console.log('   ✅ Timer stopped successfully');
              }
            } else {
              logIssue('MAJOR', 'Timer', 'Timer start functionality not working - pause button not found');
            }
          } catch (e) {
            logIssue('MAJOR', 'Timer', 'Timer control flow broken', e.message);
          }
        } else {
          logIssue('MAJOR', 'Timer', 'Start timer button not visible');
        }
      } catch (e) {
        logIssue('CRITICAL', 'Timer', 'Failed to interact with timer controls', e.message);
      }
    } catch (e) {
      logIssue('CRITICAL', 'Timer', 'Failed to navigate to timer page', e.message);
    }

    // Test 5: Task Management
    console.log('📝 Test 5: Task Management');

    try {
      await page.click('text="Tasks"');
      await page.waitForLoadState('networkidle');
      console.log('   ✅ Tasks page loaded');

      // Look for task creation button
      const createTaskButton = page.locator('button').filter({ hasText: /add|create|new.*task/i });
      const isCreateVisible = await createTaskButton.first().isVisible();
      if (isCreateVisible) {
        console.log('   ✅ Create task button found');

        // Try to create a task
        try {
          await createTaskButton.first().click();
          await page.waitForTimeout(1000);

          // Look for task form fields
          const taskFormFields = ['title', 'description', 'category'];
          for (const field of taskFormFields) {
            try {
              const input = page.locator(`input[name="${field}"], textarea[name="${field}"], input[placeholder*="${field}"], textarea[placeholder*="${field}"]`);
              const isFieldVisible = await input.first().isVisible();
              if (isFieldVisible) {
                console.log(`   ✅ Task form field "${field}" found`);
              } else {
                logIssue('MINOR', 'Tasks', `Task form field "${field}" not found`);
              }
            } catch (e) {
              logIssue('MINOR', 'Tasks', `Task form field "${field}" not accessible`);
            }
          }

        } catch (e) {
          logIssue('MAJOR', 'Tasks', 'Task creation dialog/form not accessible', e.message);
        }
      } else {
        logIssue('MAJOR', 'Tasks', 'Create task button not found');
      }

    } catch (e) {
      logIssue('CRITICAL', 'Tasks', 'Failed to navigate to tasks page', e.message);
    }

    // Test 6: Analytics Page
    console.log('📝 Test 6: Analytics');

    try {
      await page.click('text="Analytics"');
      await page.waitForLoadState('networkidle');
      console.log('   ✅ Analytics page loaded');

      // Check for analytics components
      const analyticsElements = ['chart', 'graph', 'statistic', 'metric'];
      let analyticsFound = false;

      for (const element of analyticsElements) {
        try {
          const found = await page.locator(`[class*="${element}"], [data-testid*="${element}"]`).first().isVisible();
          if (found) {
            analyticsFound = true;
            console.log(`   ✅ Analytics element containing "${element}" found`);
            break;
          }
        } catch (e) {
          // Continue checking other elements
        }
      }

      if (!analyticsFound) {
        logIssue('MAJOR', 'Analytics', 'No analytics visualizations found on analytics page');
      }

    } catch (e) {
      logIssue('CRITICAL', 'Analytics', 'Failed to navigate to analytics page', e.message);
    }

    // Test 7: Settings Page
    console.log('📝 Test 7: Settings');

    try {
      await page.click('text="Settings"');
      await page.waitForLoadState('networkidle');
      console.log('   ✅ Settings page loaded');

      // Look for common settings
      const settingsCategories = ['Theme', 'Notifications', 'Timer', 'Data'];
      for (const category of settingsCategories) {
        try {
          const found = await page.locator(`text="${category}"`).first().isVisible();
          if (found) {
            console.log(`   ✅ Settings category "${category}" found`);
          }
        } catch (e) {
          logIssue('MINOR', 'Settings', `Settings category "${category}" not found`);
        }
      }

    } catch (e) {
      logIssue('CRITICAL', 'Settings', 'Failed to navigate to settings page', e.message);
    }

    // Test 8: API Connectivity
    console.log('📝 Test 8: API Connectivity');

    try {
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8765/api/health');
          return { status: response.status, ok: response.ok, data: await response.json() };
        } catch (e) {
          return { error: e.message };
        }
      });

      if (apiResponse.ok) {
        console.log('   ✅ API connectivity working');
      } else {
        logIssue('CRITICAL', 'API', 'API health check failed', JSON.stringify(apiResponse));
      }
    } catch (e) {
      logIssue('CRITICAL', 'API', 'Failed to test API connectivity', e.message);
    }

    // Test 9: Console Errors
    console.log('📝 Test 9: Console Errors');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through pages again to catch console errors
    const pages = ['/', '/timer', '/tasks', '/analytics', '/habits', '/settings'];
    for (const pagePath of pages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForTimeout(2000);
      } catch (e) {
        logIssue('MAJOR', 'Navigation', `Failed to load page ${pagePath}`, e.message);
      }
    }

    if (consoleErrors.length > 0) {
      for (const error of consoleErrors) {
        logIssue('MAJOR', 'Console', 'JavaScript error found', error);
      }
    } else {
      console.log('   ✅ No console errors detected');
    }

    // Test 10: Mobile Responsiveness
    console.log('📝 Test 10: Mobile Responsiveness');

    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check if navigation is still usable on mobile
    try {
      const navVisible = await page.locator('nav').first().isVisible();
      if (navVisible) {
        console.log('   ✅ Navigation visible on mobile viewport');
      } else {
        logIssue('MAJOR', 'Responsive', 'Navigation not visible on mobile viewport');
      }
    } catch (e) {
      logIssue('MAJOR', 'Responsive', 'Failed to test mobile responsiveness', e.message);
    }

  } catch (error) {
    logIssue('CRITICAL', 'General', 'Unexpected error during testing', error.message);
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n📊 TESTING SUMMARY REPORT');
  console.log('=' * 50);

  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const majorIssues = issues.filter(i => i.severity === 'MAJOR');
  const minorIssues = issues.filter(i => i.severity === 'MINOR');

  console.log(`🔴 Critical Issues: ${criticalIssues.length}`);
  console.log(`🟠 Major Issues: ${majorIssues.length}`);
  console.log(`🟡 Minor Issues: ${minorIssues.length}`);
  console.log(`📋 Total Issues Found: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('🎉 No issues found! Application appears to be working correctly.');
  } else {
    console.log('📝 DETAILED ISSUES:\n');

    if (criticalIssues.length > 0) {
      console.log('🔴 CRITICAL ISSUES (App Breaking):');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component}: ${issue.description}`);
        if (issue.details) console.log(`   Details: ${issue.details}`);
      });
      console.log('');
    }

    if (majorIssues.length > 0) {
      console.log('🟠 MAJOR ISSUES (Feature Breaking):');
      majorIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component}: ${issue.description}`);
        if (issue.details) console.log(`   Details: ${issue.details}`);
      });
      console.log('');
    }

    if (minorIssues.length > 0) {
      console.log('🟡 MINOR ISSUES (Usability):');
      minorIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component}: ${issue.description}`);
        if (issue.details) console.log(`   Details: ${issue.details}`);
      });
    }
  }

  return issues;
}

// Run the tests
testLocalTaskTracker().catch(console.error);