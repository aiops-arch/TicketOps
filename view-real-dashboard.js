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
    console.log('Loading at 1920x1080...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    console.log('Logging in...');
    await page.type('#loginUsername', 'aiops');
    await page.type('#loginPassword', 'AIops');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => {
      return document.body.classList.contains('has-session');
    }, { timeout: 10000 });
    
    await page.waitForFunction(() => {
      const kpiCards = document.querySelectorAll('#dashboardKpiGrid article');
      return kpiCards.length > 0;
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 1500));
    
    console.log('✓ Dashboard loaded at 1920x1080\n');
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'dashboard-1920x1080.png', fullPage: false });
    console.log('✓ Screenshot saved: dashboard-1920x1080.png\n');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
