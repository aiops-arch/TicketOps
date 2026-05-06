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
      const hero = document.querySelector('.command-hero');
      const kpiGrid = document.querySelector('#dashboardKpiGrid');
      
      const intelRect = intelStrip.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const kpiRect = kpiGrid.getBoundingClientRect();
      
      const heroStyle = window.getComputedStyle(hero);
      
      return {
        intelStrip: {
          bottom: Math.round(intelRect.bottom)
        },
        hero: {
          top: Math.round(heroRect.top),
          height: Math.round(heroRect.height),
          padding: heroStyle.padding,
          margin: heroStyle.margin,
          bottom: Math.round(heroRect.bottom)
        },
        kpiGrid: {
          top: Math.round(kpiRect.top)
        }
      };
    });
    
    console.log('\n' + '='.repeat(90));
    console.log('COMMAND HERO (LIVE COMMAND BOARD) - DETAILED MEASUREMENTS');
    console.log('='.repeat(90));
    
    const spaceAbove = measurements.hero.top - measurements.intelStrip.bottom;
    const spaceBelow = measurements.kpiGrid.top - measurements.hero.bottom;
    
    console.log(`\nIntel Strip ends at: ${measurements.intelStrip.bottom}px`);
    console.log(`Command Hero starts at: ${measurements.hero.top}px`);
    console.log(`SPACE ABOVE Command Hero: ${spaceAbove}px\n`);
    
    console.log(`Command Hero height: ${measurements.hero.height}px`);
    console.log(`  ├─ Padding: ${measurements.hero.padding}`);
    console.log(`  └─ Margin: ${measurements.hero.margin}\n`);
    
    console.log(`Command Hero ends at: ${measurements.hero.bottom}px`);
    console.log(`KPI Grid starts at: ${measurements.kpiGrid.top}px`);
    console.log(`SPACE BELOW Command Hero: ${spaceBelow}px\n`);
    
    console.log('='.repeat(90));
    console.log('COMMAND HERO SECTION BREAKDOWN:');
    console.log('='.repeat(90));
    console.log(`
╔════════════════════════════════════════════════╗
║ SPACE ABOVE ........................ ${String(spaceAbove).padStart(2)}px ║
╠════════════════════════════════════════════════╣
║                                                ║
║ TicketOps Command Board                        ║
║ (Operations Pulse)                             ║
║ [OPEN 0] [CRITICAL 0] [READY 0/0]             ║
║                                                ║
║ HEIGHT ......................... ${String(measurements.hero.height).padStart(3)}px ║
║                                                ║
╠════════════════════════════════════════════════╣
║ SPACE BELOW ....................... ${String(spaceBelow).padStart(2)}px ║
╚════════════════════════════════════════════════╝

COMMAND HERO SECTION TOTAL: ${spaceAbove} + ${measurements.hero.height} + ${spaceBelow} = ${spaceAbove + measurements.hero.height + spaceBelow}px
`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
