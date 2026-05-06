const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Loading redesigned dashboard at 1920x1080...\n');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => {
      return document.body.classList.contains('has-session');
    }, { timeout: 10000 });
    
    await page.waitForFunction(() => {
      return document.querySelectorAll('#dashboardKpiGrid article').length > 0;
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 1500));
    
    console.log('✓ Dashboard loaded\n');
    
    // Get measurements
    const measurements = await page.evaluate(() => {
      const sections = {
        intelStrip: {
          display: window.getComputedStyle(document.querySelector('.intel-strip')).display,
          gridColumns: window.getComputedStyle(document.querySelector('.intel-strip')).gridTemplateColumns,
          gap: window.getComputedStyle(document.querySelector('.intel-strip')).gap,
          background: window.getComputedStyle(document.querySelector('.intel-card')).backgroundColor
        },
        hero: {
          background: window.getComputedStyle(document.querySelector('.command-hero')).background,
          fontSize: window.getComputedStyle(document.querySelector('.command-hero h2')).fontSize
        },
        kpiGrid: {
          gridColumns: window.getComputedStyle(document.querySelector('#dashboardKpiGrid')).gridTemplateColumns,
          cards: document.querySelectorAll('#dashboardKpiGrid article').length,
          gap: window.getComputedStyle(document.querySelector('#dashboardKpiGrid')).gap
        },
        chartGrid: {
          gridColumns: window.getComputedStyle(document.querySelector('#dashboardCharts')).gridTemplateColumns,
          charts: document.querySelectorAll('#dashboardCharts .ops-chart').length,
          gap: window.getComputedStyle(document.querySelector('#dashboardCharts')).gap
        },
        summaryGrid: {
          gridColumns: window.getComputedStyle(document.querySelector('.dashboard-summary-grid')).gridTemplateColumns,
          gap: window.getComputedStyle(document.querySelector('.dashboard-summary-grid')).gap
        }
      };
      return sections;
    });
    
    console.log('=== LAYOUT MEASUREMENTS ===\n');
    console.log('Intel Strip:');
    console.log('  Grid:', measurements.intelStrip.gridColumns);
    console.log('  Gap:', measurements.intelStrip.gap);
    console.log('  Card bg:', measurements.intelStrip.background);
    
    console.log('\nCommand Hero:');
    console.log('  Font size (h2):', measurements.hero.fontSize);
    console.log('  Background:', measurements.hero.background.substring(0, 80) + '...');
    
    console.log('\nKPI Grid:');
    console.log('  Columns:', measurements.kpiGrid.gridColumns);
    console.log('  Cards:', measurements.kpiGrid.cards);
    console.log('  Gap:', measurements.kpiGrid.gap);
    
    console.log('\nChart Grid:');
    console.log('  Columns:', measurements.chartGrid.gridColumns);
    console.log('  Charts:', measurements.chartGrid.charts);
    console.log('  Gap:', measurements.chartGrid.gap);
    
    console.log('\nSummary Grid:');
    console.log('  Columns:', measurements.summaryGrid.gridColumns);
    console.log('  Gap:', measurements.summaryGrid.gap);
    
    console.log('\n✓ Taking full page screenshot...');
    await page.screenshot({ path: 'redesign-1920x1080.png', fullPage: true });
    console.log('✓ Screenshot saved: redesign-1920x1080.png\n');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
