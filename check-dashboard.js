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
    
    console.log('Logging in as aiops/AIops...');
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForFunction(() => {
      return document.body.classList.contains('has-session');
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('✓ Dashboard loaded');
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'dashboard-check.png' });
    console.log('✓ Screenshot saved');
    
    // Check CSS properties
    const kpiGridCSS = await page.$eval('#dashboardKpiGrid', el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        gap: style.gap,
        marginBottom: style.marginBottom
      };
    });
    
    console.log('\n=== KPI GRID CSS ===');
    console.log('Display:', kpiGridCSS.display);
    console.log('Columns:', kpiGridCSS.gridTemplateColumns);
    console.log('Gap:', kpiGridCSS.gap);
    console.log('Margin-Bottom:', kpiGridCSS.marginBottom);
    
    // Count KPI cards
    const kpiCount = await page.$$eval('#dashboardKpiGrid article', els => els.length);
    console.log('\nKPI Cards rendered:', kpiCount);
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
