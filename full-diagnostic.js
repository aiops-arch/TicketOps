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
    
    const diagnosis = await page.evaluate(() => {
      const getRect = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          id: el.id || 'no-id',
          class: el.className.split(' ').slice(0, 3).join(' ') || 'no-class',
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          padding: style.padding,
          margin: style.margin,
          overflow: style.overflow,
          display: style.display,
          position: style.position
        };
      };
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      return {
        viewport: { width: viewportWidth, height: viewportHeight },
        elements: {
          appShell: getRect(document.querySelector('.ops-portal[data-view="dashboard"] .app-shell')),
          intelStrip: getRect(document.querySelector('.intel-strip')),
          intelCard1: getRect(document.querySelector('.intel-card')),
          commandHero: getRect(document.querySelector('.command-hero')),
          kpiGrid: getRect(document.querySelector('#dashboardKpiGrid')),
          kpiCard1: getRect(document.querySelector('#dashboardKpiGrid article')),
          chartsGrid: getRect(document.querySelector('#dashboardCharts')),
          summaryGrid: getRect(document.querySelector('.dashboard-summary-grid')),
          summaryPanel1: getRect(document.querySelector('.dashboard-summary-grid .panel')),
          summaryPanel2: getRect(document.querySelector('.dashboard-summary-grid .panel:nth-child(2)')),
          summaryPanel3: getRect(document.querySelector('.dashboard-summary-grid .panel:nth-child(3)'))
        }
      };
    });
    
    console.log('='.repeat(100));
    console.log('FULL LAYOUT DIAGNOSTIC - 1920x1080');
    console.log('='.repeat(100));
    
    const e = diagnosis.elements;
    const vp = diagnosis.viewport;
    
    console.log(`\nVIEWPORT: ${vp.width}x${vp.height}`);
    console.log(`\n${'ELEMENT'.padEnd(20)} | TOP | LEFT | BOTTOM | RIGHT | WIDTH | HEIGHT | OVERFLOW | MARGIN | PADDING`);
    console.log('-'.repeat(140));
    
    for (const [name, rect] of Object.entries(e)) {
      if (!rect) {
        console.log(`${name.padEnd(20)} | MISSING/NOT FOUND`);
        continue;
      }
      console.log(
        `${name.padEnd(20)} | ${String(rect.top).padEnd(3)} | ${String(rect.left).padEnd(4)} | ${String(rect.bottom).padEnd(6)} | ${String(rect.right).padEnd(5)} | ${String(rect.width).padEnd(5)} | ${String(rect.height).padEnd(6)} | ${rect.overflow.padEnd(8)} | ${rect.margin.substring(0, 20).padEnd(20)} | ${rect.padding.substring(0, 20)}`
      );
    }
    
    console.log('\n' + '='.repeat(100));
    console.log('OVERLAP DETECTION');
    console.log('='.repeat(100));
    
    // Check for overlaps
    const overlaps = [];
    const elements = Object.entries(e).filter(([_, r]) => r !== null);
    
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const [name1, rect1] = elements[i];
        const [name2, rect2] = elements[j];
        
        const overlapping = !(
          rect1.right < rect2.left ||
          rect1.left > rect2.right ||
          rect1.bottom < rect2.top ||
          rect1.top > rect2.bottom
        );
        
        if (overlapping) {
          overlaps.push(`⚠️  ${name1} OVERLAPS ${name2}`);
        }
      }
    }
    
    if (overlaps.length === 0) {
      console.log('✓ No overlaps detected');
    } else {
      overlaps.forEach(o => console.log(o));
    }
    
    console.log('\n' + '='.repeat(100));
    console.log('SPACING ISSUES');
    console.log('='.repeat(100));
    
    // Check spacing
    if (e.intelStrip && e.commandHero) {
      const gap = e.commandHero.top - e.intelStrip.bottom;
      console.log(`\nIntel Strip → Command Hero gap: ${gap}px ${gap < 10 ? '⚠️  TOO TIGHT' : '✓'}`);
    }
    
    if (e.commandHero && e.kpiGrid) {
      const gap = e.kpiGrid.top - e.commandHero.bottom;
      console.log(`Command Hero → KPI Grid gap: ${gap}px ${gap < 10 ? '⚠️  TOO TIGHT' : '✓'}`);
    }
    
    if (e.kpiGrid && e.chartsGrid) {
      const gap = e.chartsGrid.top - e.kpiGrid.bottom;
      console.log(`KPI Grid → Charts Grid gap: ${gap}px ${gap < 10 ? '⚠️  TOO TIGHT' : '✓'}`);
    }
    
    if (e.chartsGrid && e.summaryGrid) {
      const gap = e.summaryGrid.top - e.chartsGrid.bottom;
      console.log(`Charts Grid → Summary Grid gap: ${gap}px ${gap < 10 ? '⚠️  TOO TIGHT' : '✓'}`);
    }
    
    // Check panel spacing
    if (e.summaryPanel1 && e.summaryPanel2) {
      const gap = e.summaryPanel2.left - e.summaryPanel1.right;
      console.log(`\nSummary Panel 1 → Panel 2 horizontal gap: ${gap}px ${gap < 10 ? '⚠️  TOO TIGHT' : '✓'}`);
    }
    
    if (e.summaryPanel2 && e.summaryPanel3) {
      const gap = e.summaryPanel3.left - e.summaryPanel2.right;
      console.log(`Summary Panel 2 → Panel 3 horizontal gap: ${gap}px ${gap < 10 ? '⚠️  TOO TIGHT' : '✓'}`);
    }
    
    // Check if using full viewport width
    console.log(`\n${'-'.repeat(100)}`);
    if (e.appShell) {
      const rightOverflow = vp.width - e.appShell.right;
      const leftOverflow = e.appShell.left;
      console.log(`App Shell width: ${e.appShell.width}px of available ${vp.width}px`);
      console.log(`Left overflow: ${leftOverflow}px, Right overflow: ${rightOverflow}px`);
      if (leftOverflow > 24 || rightOverflow > 24) {
        console.log('⚠️  NOT USING FULL WIDTH - excessive side padding/margins');
      }
    }
    
    console.log('\n' + '='.repeat(100));
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
