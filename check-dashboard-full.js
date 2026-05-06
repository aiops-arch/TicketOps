const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 2000 });
  
  try {
    console.log('Loading...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    console.log('Logging in...');
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => {
      return document.body.classList.contains('has-session');
    }, { timeout: 10000 });
    
    // Wait for data to load
    await page.waitForFunction(() => {
      const kpiCards = document.querySelectorAll('#dashboardKpiGrid article');
      return kpiCards.length > 0;
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('\n✓ Dashboard with data loaded\n');
    
    // Get measurements
    const measurements = await page.evaluate(() => {
      const kpiGrid = document.querySelector('#dashboardKpiGrid');
      const kpiCards = document.querySelectorAll('#dashboardKpiGrid article');
      const chartGrid = document.querySelector('#dashboardCharts');
      const chartItems = document.querySelectorAll('#dashboardCharts .ops-chart');
      const summaryGrid = document.querySelector('#dashboardSummaryGrid');
      
      const kpiStyle = window.getComputedStyle(kpiGrid);
      const chartStyle = window.getComputedStyle(chartGrid);
      
      return {
        kpiGridColumns: kpiStyle.gridTemplateColumns,
        kpiGridGap: kpiStyle.gap,
        kpiCount: kpiCards.length,
        chartGridColumns: chartStyle.gridTemplateColumns,
        chartGridGap: chartStyle.gap,
        chartCount: chartItems.length,
        summaryGridVisible: !!summaryGrid,
        summaryGridTop: summaryGrid?.getBoundingClientRect().top
      };
    });
    
    console.log('KPI GRID:');
    console.log('  Columns:', measurements.kpiGridColumns);
    console.log('  Gap:', measurements.kpiGridGap);
    console.log('  Cards:', measurements.kpiCount);
    console.log('\nCHART GRID:');
    console.log('  Columns:', measurements.chartGridColumns);
    console.log('  Gap:', measurements.chartGridGap);
    console.log('  Items:', measurements.chartCount);
    console.log('\nLIVE COMMAND BOARD:');
    console.log('  Visible:', measurements.summaryGridVisible);
    console.log('  Top position:', Math.round(measurements.summaryGridTop) + 'px');
    
    await page.screenshot({ path: 'dashboard-full.png', fullPage: true });
    console.log('\n✓ Full screenshot saved: dashboard-full.png\n');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
