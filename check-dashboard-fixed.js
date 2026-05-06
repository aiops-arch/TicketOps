const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 900 });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    console.log('Logging in...');
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => {
      return document.body.classList.contains('has-session');
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n✓ Dashboard loaded\n');
    
    // Check CSS properties
    const kpiGridCSS = await page.$eval('#dashboardKpiGrid', el => {
      const style = window.getComputedStyle(el);
      return {
        gridTemplateColumns: style.gridTemplateColumns,
        gap: style.gap
      };
    });
    
    console.log('=== KPI GRID ===');
    console.log('Grid columns:', kpiGridCSS.gridTemplateColumns);
    console.log('Gap:', kpiGridCSS.gap);
    
    const kpiCount = await page.$$eval('#dashboardKpiGrid article', els => els.length);
    console.log('KPI cards:', kpiCount);
    
    // Check chart grid
    const chartGridCSS = await page.$eval('#dashboardCharts', el => {
      const style = window.getComputedStyle(el);
      return {
        gridTemplateColumns: style.gridTemplateColumns,
        gap: style.gap
      };
    });
    
    console.log('\n=== CHART GRID ===');
    console.log('Grid columns:', chartGridCSS.gridTemplateColumns);
    console.log('Gap:', chartGridCSS.gap);
    
    const chartCount = await page.$$eval('#dashboardCharts .ops-chart', els => els.length);
    console.log('Chart items:', chartCount);
    
    // Check if Live Command Board is visible
    const summaryGrid = await page.$eval('#dashboardSummaryGrid', el => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        visible: rect.top < window.innerHeight
      };
    });
    
    console.log('\n=== LIVE COMMAND BOARD ===');
    console.log('Position from top:', summaryGrid.top + 'px');
    console.log('Visible:', summaryGrid.visible);
    
    console.log('\nTaking screenshot...');
    await page.screenshot({ path: 'dashboard-fixed.png', fullPage: false });
    console.log('✓ Screenshot saved: dashboard-fixed.png\n');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
