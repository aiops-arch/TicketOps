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
    
    const calc = await page.evaluate(() => {
      const vp = { width: window.innerWidth, height: window.innerHeight };
      const appShell = document.querySelector('.ops-portal[data-view="dashboard"] .app-shell');
      const appRect = appShell.getBoundingClientRect();
      const appPadding = { left: 32, right: 32, top: 24, bottom: 24 };
      const contentWidth = appRect.width - appPadding.left - appPadding.right;
      
      const intelCards = Array.from(document.querySelectorAll('.intel-strip .intel-card'));
      const intelCardWidth = intelCards[0].getBoundingClientRect().width;
      const kpiCards = Array.from(document.querySelectorAll('#dashboardKpiGrid article'));
      const kpiCardWidth = kpiCards[0].getBoundingClientRect().width;
      const charts = Array.from(document.querySelectorAll('#dashboardCharts .ops-chart'));
      const chartWidth = charts[0].getBoundingClientRect().width;
      const panels = Array.from(document.querySelectorAll('.dashboard-summary-grid .panel'));
      const panelWidth = panels[0].getBoundingClientRect().width;
      
      return {
        viewport: vp,
        appShell: { width: appRect.width, contentWidth, padding: appPadding },
        intel: { cards: 4, width: intelCardWidth, gap: 16 },
        kpi: { cards: 6, width: kpiCardWidth, gap: 16 },
        charts: { count: 5, width: chartWidth, gap: 16 },
        summary: { panels: 3, width: panelWidth, gap: 20 },
        heights: {
          intel: document.querySelector('.intel-strip').getBoundingClientRect().height,
          hero: document.querySelector('.command-hero').getBoundingClientRect().height,
          kpi: document.querySelector('#dashboardKpiGrid').getBoundingClientRect().height,
          charts: document.querySelector('#dashboardCharts').getBoundingClientRect().height,
          summary: document.querySelector('.dashboard-summary-grid').getBoundingClientRect().height
        }
      };
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('DETAILED LAYOUT CALCULATION');
    console.log('='.repeat(100));
    
    const c = calc;
    
    console.log('\nWIDTH CALCULATION:');
    console.log('─'.repeat(100));
    console.log(`Viewport: ${c.viewport.width}px`);
    console.log(`App shell padding: Left 32px + Right 32px = 64px`);
    console.log(`Content width: ${c.appShell.contentWidth}px\n`);
    
    const intelW = (c.intel.width * c.intel.cards) + (c.intel.gap * (c.intel.cards - 1));
    console.log(`Intel Strip: ${c.intel.width}px × 4 cards + 16px × 3 gaps = ${intelW}px - ${intelW <= c.appShell.contentWidth ? '✓ FIT' : '✗ OVERFLOW'}`);
    
    const kpiW = (c.kpi.width * c.kpi.cards) + (c.kpi.gap * (c.kpi.cards - 1));
    console.log(`KPI Grid:    ${c.kpi.width}px × 6 cards + 16px × 5 gaps = ${kpiW}px - ${kpiW <= c.appShell.contentWidth ? '✓ FIT' : '✗ OVERFLOW'}`);
    
    const chartsW = (c.charts.width * c.charts.count) + (c.charts.gap * (c.charts.count - 1));
    console.log(`Charts Grid: ${c.charts.width}px × 5 charts + 16px × 4 gaps = ${chartsW}px - ${chartsW <= c.appShell.contentWidth ? '✓ FIT' : '✗ OVERFLOW'}`);
    
    const summaryW = (c.summary.width * c.summary.panels) + (c.summary.gap * (c.summary.panels - 1));
    console.log(`Summary:     ${c.summary.width}px × 3 panels + 20px × 2 gaps = ${summaryW}px - ${summaryW <= c.appShell.contentWidth ? '✓ FIT' : '✗ OVERFLOW'}\n`);
    
    console.log('HEIGHT CALCULATION:');
    console.log('─'.repeat(100));
    const h = c.heights;
    const totalH = 24 + h.intel + 24 + h.hero + 20 + h.kpi + 20 + h.charts + 20 + h.summary + 24;
    console.log(`Top padding:        24px`);
    console.log(`Intel strip:        ${h.intel}px`);
    console.log(`Gap:                24px`);
    console.log(`Command hero:       ${h.hero}px`);
    console.log(`Gap:                20px`);
    console.log(`KPI grid:           ${h.kpi}px`);
    console.log(`Gap:                20px`);
    console.log(`Charts grid:        ${h.charts}px`);
    console.log(`Gap:                20px`);
    console.log(`Summary grid:       ${h.summary}px`);
    console.log(`Bottom padding:     24px`);
    console.log('─'.repeat(100));
    console.log(`TOTAL HEIGHT:       ${totalH}px`);
    console.log(`Viewport height:    ${c.viewport.height}px`);
    console.log(`Remaining space:    ${c.viewport.height - totalH}px - ${totalH <= c.viewport.height ? '✓ FITS' : '✗ OVERFLOW'}\n`);
    
    console.log('='.repeat(100));
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
