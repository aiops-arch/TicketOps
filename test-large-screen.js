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
      const intelCard = document.querySelector('.intel-card');
      const hero = document.querySelector('.command-hero');
      const kpiCard = document.querySelector('#dashboardKpiGrid article');
      const chart = document.querySelector('#dashboardCharts .ops-chart');
      const panel = document.querySelector('.dashboard-summary-grid .panel');
      
      return {
        intelCard: {
          height: Math.round(intelCard.getBoundingClientRect().height),
          padding: window.getComputedStyle(intelCard).padding
        },
        hero: {
          height: Math.round(hero.getBoundingClientRect().height),
          padding: window.getComputedStyle(hero).padding
        },
        kpiCard: {
          height: Math.round(kpiCard.getBoundingClientRect().height)
        },
        chart: {
          height: Math.round(chart.getBoundingClientRect().height)
        },
        panel: {
          height: Math.round(panel.getBoundingClientRect().height)
        }
      };
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('LARGE SCREEN (>1180px) - NEW HEIGHTS');
    console.log('='.repeat(80));
    console.log(`\nIntel Card: ${measurements.intelCard.height}px (padding: ${measurements.intelCard.padding})`);
    console.log(`Command Hero: ${measurements.hero.height}px (padding: ${measurements.hero.padding})`);
    console.log(`KPI Card: ${measurements.kpiCard.height}px`);
    console.log(`Chart: ${measurements.chart.height}px`);
    console.log(`Summary Panel: ${measurements.panel.height}px`);
    console.log('\n✓ Increased heights and spacing for better visual hierarchy\n');
    
    await page.screenshot({ path: 'large-screen-improved.png', fullPage: true });
    console.log('✓ Screenshot saved: large-screen-improved.png\n');
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
