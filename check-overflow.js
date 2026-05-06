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
    
    const check = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      
      return {
        viewport,
        bodyWidth: body.offsetWidth,
        bodyScrollWidth: body.scrollWidth,
        htmlScrollWidth: html.scrollWidth,
        bodyHeight: body.offsetHeight,
        bodyScrollHeight: body.scrollHeight,
        htmlScrollHeight: html.scrollHeight,
        horizontalOverflow: body.scrollWidth > window.innerWidth,
        verticalOverflow: body.scrollHeight > window.innerHeight,
        overflowX: window.getComputedStyle(body).overflowX,
        overflowY: window.getComputedStyle(body).overflowY
      };
    });
    
    console.log('\n=== OVERFLOW CHECK ===\n');
    console.log('Viewport:', `${check.viewport.w}x${check.viewport.h}`);
    console.log('Body width:', check.bodyWidth, '(scrollWidth:', check.bodyScrollWidth + ')');
    console.log('Body height:', check.bodyHeight, '(scrollHeight:', check.bodyScrollHeight + ')');
    console.log('\nHorizontal overflow:', check.horizontalOverflow ? '✗ YES - content extends beyond viewport' : '✓ NO');
    console.log('Vertical overflow:', check.verticalOverflow ? '⚠️  YES - content extends below viewport' : '✓ NO');
    console.log('\nCSS overflow:', `X: ${check.overflowX}, Y: ${check.overflowY}`);
    
    if (check.horizontalOverflow) {
      console.log(`\n⚠️  PROBLEM: Content is ${check.bodyScrollWidth}px wide but viewport is ${check.viewport.w}px`);
      console.log(`   Overflow: ${check.bodyScrollWidth - check.viewport.w}px (${Math.round((check.bodyScrollWidth / check.viewport.w - 1) * 100)}% wider than screen)`);
    }
    
    await page.screenshot({ path: 'overflow-check.png', fullPage: true });
    console.log('\n✓ Screenshot saved: overflow-check.png\n');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
