const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  page.setViewport({ width: 1920, height: 1080 });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => document.body.classList.contains('has-session'), { timeout: 10000 });
    await page.waitForFunction(() => document.querySelectorAll('#dashboardKpiGrid article').length > 0, { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const measurements = await page.evaluate(() => {
      const intelStrip = document.querySelector('.intel-strip');
      const intelCards = Array.from(document.querySelectorAll('.intel-card'));
      
      const stripStyle = window.getComputedStyle(intelStrip);
      const stripRect = intelStrip.getBoundingClientRect();
      
      const cardDetails = intelCards.map((card, i) => {
        const rect = card.getBoundingClientRect();
        const style = window.getComputedStyle(card);
        return {
          index: i + 1,
          label: card.querySelector('.intel-label')?.textContent || 'N/A',
          height: Math.round(rect.height),
          padding: style.padding,
          margin: style.margin,
          borderTop: style.borderTop,
          borderRadius: style.borderRadius
        };
      });
      
      return {
        intelStrip: {
          top: Math.round(stripRect.top),
          height: Math.round(stripRect.height),
          margin: stripStyle.margin,
          padding: stripStyle.padding,
          gap: stripStyle.gap,
          display: stripStyle.display,
          gridTemplateColumns: stripStyle.gridTemplateColumns
        },
        cards: cardDetails,
        appShell: {
          paddingTop: window.getComputedStyle(document.querySelector('.app-shell')).paddingTop
        }
      };
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('INTEL STRIP - DETAILED MEASUREMENTS');
    console.log('='.repeat(100));
    
    console.log('\nINTEL STRIP CONTAINER:');
    console.log(`  Position from top: ${measurements.intelStrip.top}px`);
    console.log(`  Height: ${measurements.intelStrip.height}px`);
    console.log(`  Margin: ${measurements.intelStrip.margin}`);
    console.log(`  Padding: ${measurements.intelStrip.padding}`);
    console.log(`  Gap between cards: ${measurements.intelStrip.gap}`);
    console.log(`  Display: ${measurements.intelStrip.display}`);
    console.log(`  Grid columns: ${measurements.intelStrip.gridTemplateColumns}`);
    
    console.log('\n' + '-'.repeat(100));
    console.log('INDIVIDUAL CARDS:');
    console.log('-'.repeat(100));
    
    measurements.cards.forEach(card => {
      console.log(`\n${card.index}. ${card.label}`);
      console.log(`   Height (content only): ${card.height}px`);
      console.log(`   Padding: ${card.padding}`);
      console.log(`   Margin: ${card.margin}`);
      console.log(`   Border top: ${card.borderTop}`);
      console.log(`   Border radius: ${card.borderRadius}`);
    });
    
    console.log('\n' + '-'.repeat(100));
    console.log('HEIGHT BREAKDOWN OF INTEL SECTION:');
    console.log('-'.repeat(100));
    
    const appShellPaddingTop = parseInt(measurements.appShell.paddingTop);
    const intelStripMarginTop = parseInt(measurements.intelStrip.margin) || 0;
    
    console.log(`\nApp Shell top padding: ${appShellPaddingTop}px`);
    console.log(`Intel Strip margin top: ${intelStripMarginTop}px`);
    console.log(`─────────────────────────────`);
    console.log(`MARGIN ABOVE Intel Strip: ${appShellPaddingTop + intelStripMarginTop}px`);
    console.log(`\nIntel Strip total height: ${measurements.intelStrip.height}px`);
    console.log(`  ├─ Card height: ${measurements.cards[0].height}px`);
    console.log(`  └─ Gap between: ${measurements.intelStrip.gap}`);
    console.log(`\nIntel Strip margin bottom: ${intelStripMarginTop}px`);
    
    console.log('\n' + '='.repeat(100));
    console.log(`TOTAL HEIGHT OF INTEL SECTION (with margins):`);
    console.log(`${appShellPaddingTop} + ${intelStripMarginTop} + ${measurements.intelStrip.height} + ${intelStripMarginTop} = ${appShellPaddingTop + (intelStripMarginTop * 2) + measurements.intelStrip.height}px`);
    console.log('='.repeat(100) + '\n');
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
