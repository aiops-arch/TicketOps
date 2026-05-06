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
      const kpiGrid = document.querySelector('#dashboardKpiGrid');
      const chartsGrid = document.querySelector('#dashboardCharts');
      const charts = Array.from(document.querySelectorAll('#dashboardCharts .ops-chart'));
      const summaryGrid = document.querySelector('.dashboard-summary-grid');
      
      const kpiGridRect = kpiGrid.getBoundingClientRect();
      const chartsGridRect = chartsGrid.getBoundingClientRect();
      const chartRect = charts[0].getBoundingClientRect();
      const summaryGridRect = summaryGrid.getBoundingClientRect();
      
      const chartsGridStyle = window.getComputedStyle(chartsGrid);
      const chartStyle = window.getComputedStyle(charts[0]);
      
      return {
        kpiGrid: {
          bottom: Math.round(kpiGridRect.bottom)
        },
        chartsGrid: {
          top: Math.round(chartsGridRect.top),
          height: Math.round(chartsGridRect.height),
          padding: chartsGridStyle.padding,
          margin: chartsGridStyle.margin,
          gap: chartsGridStyle.gap,
          bottom: Math.round(chartsGridRect.bottom)
        },
        chart: {
          height: Math.round(chartRect.height),
          width: Math.round(chartRect.width),
          padding: chartStyle.padding,
          margin: chartStyle.margin
        },
        summaryGrid: {
          top: Math.round(summaryGridRect.top)
        },
        chartLabels: charts.map(c => c.querySelector('span')?.textContent || 'N/A')
      };
    });
    
    console.log('\n' + '='.repeat(90));
    console.log('CHARTS GRID (7D Flow, Donut Charts, Metrics)');
    console.log('='.repeat(90));
    
    const spaceAbove = measurements.chartsGrid.top - measurements.kpiGrid.bottom;
    const spaceBelow = measurements.summaryGrid.top - measurements.chartsGrid.bottom;
    
    console.log(`\nKPI Grid ends at: ${measurements.kpiGrid.bottom}px`);
    console.log(`Charts Grid starts at: ${measurements.chartsGrid.top}px`);
    console.log(`SPACE ABOVE Charts Grid: ${spaceAbove}px\n`);
    
    console.log(`Individual Chart Card:`);
    console.log(`  Height: ${measurements.chart.height}px`);
    console.log(`  Width: ${measurements.chart.width}px`);
    console.log(`  Padding: ${measurements.chart.padding}`);
    console.log(`  Margin: ${measurements.chart.margin}\n`);
    
    console.log(`Charts Grid (all 5 charts):`);
    console.log(`  Layout: 5 columns in 1 row`);
    console.log(`  Grid gap: ${measurements.chartsGrid.gap}`);
    console.log(`  Total grid height: ${measurements.chartsGrid.height}px\n`);
    
    console.log(`Chart labels:`);
    measurements.chartLabels.forEach((label, i) => {
      console.log(`  ${i + 1}. ${label}`);
    });
    
    console.log(`\nCharts Grid ends at: ${measurements.chartsGrid.bottom}px`);
    console.log(`Summary Grid starts at: ${measurements.summaryGrid.top}px`);
    console.log(`SPACE BELOW Charts Grid: ${spaceBelow}px\n`);
    
    console.log('='.repeat(90));
    console.log('CHARTS SECTION BREAKDOWN:');
    console.log('='.repeat(90));
    console.log(`
╔═══════════════════════════════════════════════════╗
║ SPACE ABOVE .......................... ${String(spaceAbove).padStart(2)}px ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║ [7D Flow] [Donut1] [Donut2] [Donut3] [Donut4]    ║
║                                                   ║
║ (5 charts in 1 row, each ${measurements.chart.height}px tall)          ║
║                                                   ║
║ HEIGHT ........................... ${String(measurements.chartsGrid.height).padStart(2)}px ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║ SPACE BELOW ............................. ${String(spaceBelow).padStart(2)}px ║
╚═══════════════════════════════════════════════════╝

CHARTS SECTION TOTAL: ${spaceAbove} + ${measurements.chartsGrid.height} + ${spaceBelow} = ${spaceAbove + measurements.chartsGrid.height + spaceBelow}px
`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
