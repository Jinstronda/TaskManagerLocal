const { chromium } = require('playwright');

async function testLucideIcons() {
  console.log('🔧 Testing Lucide React icons...\\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to timer page
    await page.goto('http://localhost:3004/timer', { waitUntil: 'networkidle' });
    console.log('✅ Timer page loaded');

    // Check for any console errors specifically related to modules/imports
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a moment to capture any errors
    await page.waitForTimeout(3000);

    if (consoleErrors.length > 0) {
      console.log('🔴 Console errors detected:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors detected');
    }

    // Check if Lucide React is loaded in the window
    const lucideTest = await page.evaluate(() => {
      // Check if React is available
      const hasReact = typeof window.React !== 'undefined';

      // Check for any lucide-related modules in window
      const lucideKeys = Object.keys(window).filter(key =>
        key.toLowerCase().includes('lucide')
      );

      // Check if any SVG elements are present (Lucide icons render as SVG)
      const svgElements = document.querySelectorAll('svg');
      const svgCount = svgElements.length;

      // Check for SVGs with Lucide characteristics
      const lucideSvgs = Array.from(svgElements).filter(svg =>
        svg.classList.contains('lucide') ||
        svg.getAttribute('xmlns') === 'http://www.w3.org/2000/svg'
      );

      return {
        hasReact,
        lucideKeys,
        totalSvgs: svgCount,
        lucideSvgs: lucideSvgs.length,
        svgDetails: lucideSvgs.slice(0, 3).map(svg => ({
          classes: svg.className.baseVal || svg.className,
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height'),
          viewBox: svg.getAttribute('viewBox'),
          children: svg.children.length
        }))
      };
    });

    console.log('🧪 Lucide/React test results:');
    console.log('  React available:', lucideTest.hasReact);
    console.log('  Lucide keys in window:', lucideTest.lucideKeys);
    console.log('  Total SVG elements:', lucideTest.totalSvgs);
    console.log('  Lucide-style SVGs:', lucideTest.lucideSvgs);
    console.log('  SVG details:', JSON.stringify(lucideTest.svgDetails, null, 2));

    // Specifically check the start button area
    const buttonAnalysis = await page.evaluate(() => {
      const greenButton = document.querySelector('button.bg-green-500');
      if (greenButton) {
        return {
          exists: true,
          innerHTML: greenButton.innerHTML,
          children: greenButton.children.length,
          childNodes: greenButton.childNodes.length,
          textContent: greenButton.textContent,
          svgChildren: Array.from(greenButton.querySelectorAll('svg')).map(svg => ({
            tagName: svg.tagName,
            classes: svg.className.baseVal || svg.className,
            innerHTML: svg.innerHTML
          }))
        };
      }
      return { exists: false };
    });

    console.log('🟢 Green start button analysis:');
    console.log(JSON.stringify(buttonAnalysis, null, 2));

    console.log('\\n✨ Icon test complete!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLucideIcons().catch(console.error);