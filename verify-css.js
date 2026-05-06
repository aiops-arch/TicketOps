const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  
  const page = await browser.newPage();
  // Disable cache completely
  await page.setCacheEnabled(false);
  page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Loading with cache disabled...\n');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => {
      return document.body.classList.contains('has-session');
    }, { timeout: 10000 });
    
    await page.waitForFunction(() => {
      return document.querySelectorAll('#dashboardKpiGrid article').length > 0;
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check actual computed styles and spacing
    const details = await page.evaluate(() => {
      const appShell = document.querySelector('.ops-portal[data-view="dashboard"] .app-shell');
      const intelStrip = document.querySelector('.intel-strip');
      const hero = document.querySelector('.command-hero');
      const kpiGrid = document.querySelector('#dashboardKpiGrid');
      const summaryPanel = document.querySelector('.dashboard-summary-grid');
      
      return {
        appShell: {
          bg: window.getComputedStyle(appShell).backgroundColor,
          padding: window.getComputedStyle(appShell).padding,
          display: window.getComputedStyle(appShell).display
        },
        intelStrip: {
          gap: window.getComputedStyle(intelStrip).gap,
          marginBottom: window.getComputedStyle(intelStrip).marginBottom,
          gridColumns: window.getComputedStyle(intelStrip).gridTemplateColumns
        },
        hero: {
          background: window.getComputedStyle(hero).background.substring(0, 60),
          padding: window.getComputedStyle(hero).padding,
          borderRadius: window.getComputedStyle(hero).borderRadius
        },
        kpiGrid: {
          gap: window.getComputedStyle(kpiGrid).gap,
          gridColumns: window.getComputedStyle(kpiGrid).gridTemplateColumns.substring(0, 80),
          marginBottom: window.getComputedStyle(kpiGrid).marginBottom,
          background: window.getComputedStyle(document.querySelector('.dashboard-kpi')).background.substring(0, 80)
        },
        summaryPanel: {
          gap: window.getComputedStyle(summaryPanel).gap,
          gridColumns: window.getComputedStyle(summaryPanel).gridTemplateColumns.substring(0, 80),
          panelPadding: window.getComputedStyle(document.querySelector('#dashboardSummaryGrid .panel')).padding
        }
      };
    });
    
    console.log('=== ACTUAL CSS VALUES ===\n');
    console.log('App Shell:');
    console.log('  Background:', details.appShell.bg);
    console.log('  Padding:', details.appShell.padding);
    console.log('  Display:', details.appShell.display);
    
    console.log('\nIntel Strip:');
    console.log('  Gap:', details.intelStrip.gap);
    console.log('  Margin-bottom:', details.intelStrip.marginBottom);
    console.log('  Grid columns:', details.intelStrip.gridColumns);
    
    console.log('\nCommand Hero:');
    console.log('  Background:', details.hero.background);
    console.log('  Padding:', details.hero.padding);
    console.log('  Border-radius:', details.hero.borderRadius);
    
    console.log('\nKPI Grid:');
    console.log('  Gap:', details.kpiGrid.gap);
    console.log('  Grid columns:', details.kpiGrid.gridColumns);
    console.log('  Margin-bottom:', details.kpiGrid.marginBottom);
    console.log('  Card background:', details.kpiGrid.background);
    
    console.log('\nSummary Grid:');
    console.log('  Gap:', details.summaryPanel.gap);
    console.log('  Columns:', details.summaryPanel.gridColumns);
    console.log('  Panel padding:', details.summaryPanel.panelPadding);
    
    await page.screenshot({ path: 'verify-styles-1920.png', fullPage: true });
    console.log('\n✓ Screenshot saved: verify-styles-1920.png\n');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
