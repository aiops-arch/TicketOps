const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setCacheEnabled(false);

  // Login
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.type("#loginUsername", "aiops");
  await page.type("#loginPassword", "AIops");
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  // Measure all sections
  const measurements = await page.evaluate(() => {
    const appShell = document.querySelector(".app-shell");
    const intelStrip = document.querySelector(".intel-strip");
    const commandHero = document.querySelector(".command-hero");
    const kpiGrid = document.querySelector(".dashboard-kpi-grid");
    const chartsGrid = document.querySelector(".ops-chart-grid");
    const summaryGrid = document.querySelector(".dashboard-summary-grid");

    const getHeight = (el) => el ? el.offsetHeight : 0;
    const getComputedStyle = (el) => el ? window.getComputedStyle(el) : null;

    const result = {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      appShell: {
        height: getHeight(appShell),
        padding: appShell ? getComputedStyle(appShell).padding : "0",
        gap: appShell ? getComputedStyle(appShell).gap : "0"
      },
      sections: {
        intelStrip: { height: getHeight(intelStrip), marginBottom: getComputedStyle(intelStrip)?.marginBottom },
        commandHero: { height: getHeight(commandHero), marginBottom: getComputedStyle(commandHero)?.marginBottom },
        kpiGrid: { height: getHeight(kpiGrid), marginTop: getComputedStyle(kpiGrid)?.marginTop },
        chartsGrid: { height: getHeight(chartsGrid), marginTop: getComputedStyle(chartsGrid)?.marginTop },
        summaryGrid: { height: getHeight(summaryGrid), marginTop: getComputedStyle(summaryGrid)?.marginTop }
      },
      details: {}
    };

    // Detailed breakdown
    if (intelStrip) {
      const card = intelStrip.querySelector(".intel-card");
      result.details.intelCard = {
        height: card ? card.offsetHeight : 0,
        count: intelStrip.querySelectorAll(".intel-card").length
      };
    }

    if (commandHero) {
      result.details.commandHero = {
        height: commandHero.offsetHeight,
        padding: getComputedStyle(commandHero).padding
      };
    }

    if (kpiGrid) {
      const card = kpiGrid.querySelector(".dashboard-kpi");
      result.details.kpiCard = {
        height: card ? card.offsetHeight : 0,
        count: kpiGrid.querySelectorAll(".dashboard-kpi").length
      };
    }

    if (chartsGrid) {
      const chart = chartsGrid.querySelector(".ops-chart");
      result.details.chartCard = {
        height: chart ? chart.offsetHeight : 0,
        count: chartsGrid.querySelectorAll(".ops-chart").length
      };
    }

    if (summaryGrid) {
      const panel = summaryGrid.querySelector(".panel");
      result.details.summaryPanel = {
        height: panel ? panel.offsetHeight : 0,
        count: summaryGrid.querySelectorAll(".panel").length
      };
    }

    return result;
  });

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("DASHBOARD HEIGHT BREAKDOWN - 1920×1080 VIEWPORT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("VIEWPORT:", measurements.viewport.width + "×" + measurements.viewport.height);
  console.log("AVAILABLE HEIGHT:", measurements.viewport.height + "px\n");

  console.log("APP-SHELL SETTINGS:");
  console.log("  Padding:", measurements.appShell.padding);
  console.log("  Gap between sections:", measurements.appShell.gap);
  console.log("  Total app-shell height:", measurements.appShell.height + "px\n");

  console.log("SECTION BREAKDOWN:");
  console.log("┌─────────────────────────────────────────────────────────────┐");

  let runningTotal = 0;

  // Intel Strip
  const intelHeight = measurements.sections.intelStrip.height;
  console.log(`│ INTEL STRIP (${measurements.details.intelCard.count} cards)`);
  console.log(`│   Height: ${intelHeight}px (card: ${measurements.details.intelCard.height}px)`);
  runningTotal += intelHeight;
  console.log(`│   Running total: ${runningTotal}px`);

  // Gap
  const gapValue = parseInt(measurements.appShell.gap) || 24;
  runningTotal += gapValue;
  console.log(`│   Gap after: ${gapValue}px`);
  console.log(`│   Running total: ${runningTotal}px\n`);

  // Command Hero
  const heroHeight = measurements.sections.commandHero.height;
  console.log(`│ COMMAND HERO`);
  console.log(`│   Height: ${heroHeight}px`);
  console.log(`│   Padding: ${measurements.details.commandHero.padding}`);
  runningTotal += heroHeight;
  console.log(`│   Running total: ${runningTotal}px`);
  runningTotal += gapValue;
  console.log(`│   Gap after: ${gapValue}px`);
  console.log(`│   Running total: ${runningTotal}px\n`);

  // KPI Grid
  const kpiHeight = measurements.sections.kpiGrid.height;
  console.log(`│ KPI GRID (${measurements.details.kpiCard.count} cards)`);
  console.log(`│   Height: ${kpiHeight}px (card: ${measurements.details.kpiCard.height}px)`);
  runningTotal += kpiHeight;
  console.log(`│   Running total: ${runningTotal}px`);
  runningTotal += gapValue;
  console.log(`│   Gap after: ${gapValue}px`);
  console.log(`│   Running total: ${runningTotal}px\n`);

  // Charts Grid
  const chartsHeight = measurements.sections.chartsGrid.height;
  console.log(`│ CHARTS GRID (${measurements.details.chartCard.count} charts)`);
  console.log(`│   Height: ${chartsHeight}px (card: ${measurements.details.chartCard.height}px)`);
  runningTotal += chartsHeight;
  console.log(`│   Running total: ${runningTotal}px`);
  runningTotal += gapValue;
  console.log(`│   Gap after: ${gapValue}px`);
  console.log(`│   Running total: ${runningTotal}px\n`);

  // Summary Grid
  const summaryHeight = measurements.sections.summaryGrid.height;
  console.log(`│ SUMMARY GRID (${measurements.details.summaryPanel.count} panels)`);
  console.log(`│   Height: ${summaryHeight}px (panel: ${measurements.details.summaryPanel.height}px)`);
  runningTotal += summaryHeight;
  console.log(`│   Running total: ${runningTotal}px`);

  console.log("└─────────────────────────────────────────────────────────────┘\n");

  const topPadding = parseInt(measurements.appShell.padding.split(" ")[0]) || 24;
  const bottomPadding = parseInt(measurements.appShell.padding.split(" ")[2]) || 24;
  const totalPadding = topPadding + bottomPadding;

  console.log("FINAL CALCULATION:");
  console.log(`  All sections: ${runningTotal}px`);
  console.log(`  Top padding: ${topPadding}px`);
  console.log(`  Bottom padding: ${bottomPadding}px`);
  console.log(`  Total padding: ${totalPadding}px`);
  console.log(`  ─────────────────────────`);

  const finalTotal = runningTotal + totalPadding;
  console.log(`  TOTAL HEIGHT NEEDED: ${finalTotal}px`);
  console.log(`  AVAILABLE HEIGHT: ${measurements.viewport.height}px`);
  console.log(`  ─────────────────────────`);

  const overflow = finalTotal - measurements.viewport.height;
  if (overflow > 0) {
    console.log(`  ❌ OVERFLOW: ${overflow}px (SCROLLING REQUIRED)`);
  } else {
    console.log(`  ✓ FIT: ${Math.abs(overflow)}px space remaining`);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");

  await browser.close();
})();
