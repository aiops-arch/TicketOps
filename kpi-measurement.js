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
      const hero = document.querySelector('.command-hero');
      const kpiGrid = document.querySelector('#dashboardKpiGrid');
      const kpiCards = Array.from(document.querySelectorAll('#dashboardKpiGrid article'));
      const chartsGrid = document.querySelector('#dashboardCharts');
      
      const heroRect = hero.getBoundingClientRect();
      const kpiGridRect = kpiGrid.getBoundingClientRect();
      const kpiCardRect = kpiCards[0].getBoundingClientRect();
      const chartsGridRect = chartsGrid.getBoundingClientRect();
      
      const kpiGridStyle = window.getComputedStyle(kpiGrid);
      const kpiCardStyle = window.getComputedStyle(kpiCards[0]);
      
      return {
        hero: {
          bottom: Math.round(heroRect.bottom)
        },
        kpiGrid: {
          top: Math.round(kpiGridRect.top),
          height: Math.round(kpiGridRect.height),
          padding: kpiGridStyle.padding,
          margin: kpiGridStyle.margin,
          gap: kpiGridStyle.gap,
          gridTemplateColumns: kpiGridStyle.gridTemplateColumns,
          bottom: Math.round(kpiGridRect.bottom)
        },
        kpiCard: {
          height: Math.round(kpiCardRect.height),
          width: Math.round(kpiCardRect.width),
          padding: kpiCardStyle.padding,
          margin: kpiCardStyle.margin,
          titles: kpiCards.map(c => c.querySelector('.dashboard-kpi-head span')?.textContent || 'N/A')
        },
        chartsGrid: {
          top: Math.round(chartsGridRect.top)
        }
      };
    });
    
    console.log('\n' + '='.repeat(90));
    console.log('KPI GRID (Active, Going On, Completed Today, This Week, This Month, Checklist)');
    console.log('='.repeat(90));
    
    const spaceAbove = measurements.kpiGrid.top - measurements.hero.bottom;
    const spaceBelow = measurements.chartsGrid.top - measurements.kpiGrid.bottom;
    
    console.log(`\nCommand Hero ends at: ${measurements.hero.bottom}px`);
    console.log(`KPI Grid starts at: ${measurements.kpiGrid.top}px`);
    console.log(`SPACE ABOVE KPI Grid: ${spaceAbove}px\n`);
    
    console.log(`Individual KPI Card:`);
    console.log(`  Height: ${measurements.kpiCard.height}px`);
    console.log(`  Width: ${measurements.kpiCard.width}px`);
    console.log(`  Padding: ${measurements.kpiCard.padding}`);
    console.log(`  Margin: ${measurements.kpiCard.margin}\n`);
    
    console.log(`KPI Grid (all 6 cards):`);
    console.log(`  Layout: 6 columns in 1 row`);
    console.log(`  Grid gap: ${measurements.kpiGrid.gap}`);
    console.log(`  Total grid height: ${measurements.kpiGrid.height}px\n`);
    
    console.log(`Card labels:`);
    measurements.kpiCard.titles.forEach((title, i) => {
      console.log(`  ${i + 1}. ${title}`);
    });
    
    console.log(`\nKPI Grid ends at: ${measurements.kpiGrid.bottom}px`);
    console.log(`Charts Grid starts at: ${measurements.chartsGrid.top}px`);
    console.log(`SPACE BELOW KPI Grid: ${spaceBelow}px\n`);
    
    console.log('='.repeat(90));
    console.log('KPI SECTION BREAKDOWN:');
    console.log('='.repeat(90));
    console.log(`
╔═══════════════════════════════════════════════════╗
║ SPACE ABOVE .......................... ${String(spaceAbove).padStart(2)}px ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║ [Active] [Going On] [Completed Today]             ║
║ [This Week] [This Month] [Checklist]              ║
║                                                   ║
║ (6 cards in 1 row, each ${measurements.kpiCard.height}px tall)           ║
║                                                   ║
║ HEIGHT ........................... ${String(measurements.kpiGrid.height).padStart(2)}px ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║ SPACE BELOW ............................. ${String(spaceBelow).padStart(2)}px ║
╚═══════════════════════════════════════════════════╝

KPI SECTION TOTAL: ${spaceAbove} + ${measurements.kpiGrid.height} + ${spaceBelow} = ${spaceAbove + measurements.kpiGrid.height + spaceBelow}px
`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
