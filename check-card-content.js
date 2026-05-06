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

  const cardChecks = await page.evaluate(() => {
    const checks = {
      intelCards: [],
      kpiCards: [],
      chartCards: [],
      summaryPanels: [],
      issues: []
    };

    // Check Intel Cards
    document.querySelectorAll(".intel-card").forEach((card, idx) => {
      const label = card.querySelector(".intel-label");
      const strong = card.querySelector("strong");
      const para = card.querySelector("p");

      const cardInfo = {
        index: idx,
        label: label ? label.textContent : "N/A",
        value: strong ? strong.textContent : "N/A",
        description: para ? para.textContent : "N/A",
        cardHeight: card.offsetHeight,
        contentHeight: card.scrollHeight,
        isOverflowing: card.scrollHeight > card.offsetHeight,
        labelWidth: label ? label.offsetWidth : 0,
        labelScrollWidth: label ? label.scrollWidth : 0,
        isTruncated: label && label.scrollWidth > label.offsetWidth
      };

      checks.intelCards.push(cardInfo);

      if (cardInfo.isOverflowing) {
        checks.issues.push(`Intel Card ${idx} overflowing: ${cardInfo.contentHeight}px content > ${cardInfo.cardHeight}px height`);
      }
      if (cardInfo.isTruncated) {
        checks.issues.push(`Intel Card ${idx} label truncated`);
      }
    });

    // Check KPI Cards
    document.querySelectorAll(".dashboard-kpi").forEach((card, idx) => {
      const label = card.querySelector(".dashboard-kpi-head span");
      const value = card.querySelector("strong");
      const detail = card.querySelector("small");

      const cardInfo = {
        index: idx,
        label: label ? label.textContent : "N/A",
        value: value ? value.textContent : "N/A",
        detail: detail ? detail.textContent : "N/A",
        cardHeight: card.offsetHeight,
        contentHeight: card.scrollHeight,
        isOverflowing: card.scrollHeight > card.offsetHeight,
        hasOverflow: window.getComputedStyle(card).overflow !== "visible"
      };

      checks.kpiCards.push(cardInfo);

      if (cardInfo.isOverflowing) {
        checks.issues.push(`KPI Card ${idx} overflowing: ${cardInfo.contentHeight}px content > ${cardInfo.cardHeight}px height`);
      }
    });

    // Check Chart Cards
    document.querySelectorAll(".ops-chart:not(.trend-card)").forEach((card, idx) => {
      const label = card.querySelector("span");
      const value = card.querySelector("strong");

      const cardInfo = {
        index: idx,
        label: label ? label.textContent : "N/A",
        value: value ? value.textContent : "N/A",
        cardHeight: card.offsetHeight,
        contentHeight: card.scrollHeight,
        isOverflowing: card.scrollHeight > card.offsetHeight
      };

      checks.chartCards.push(cardInfo);

      if (cardInfo.isOverflowing) {
        checks.issues.push(`Chart Card ${idx} overflowing: ${cardInfo.contentHeight}px content > ${cardInfo.cardHeight}px height`);
      }
    });

    // Check Summary Panels
    document.querySelectorAll(".dashboard-summary-grid .panel").forEach((panel, idx) => {
      const heading = panel.querySelector("h2");
      const kicker = panel.querySelector(".section-kicker");
      const content = panel.querySelector("[id^='dashboardSummary'], [id^='openClaw'], [id^='categoryRepair'], [id^='outletHealth']");

      const panelInfo = {
        index: idx,
        title: heading ? heading.textContent : "N/A",
        kicker: kicker ? kicker.textContent : "N/A",
        panelHeight: panel.offsetHeight,
        contentHeight: panel.scrollHeight,
        isOverflowing: panel.scrollHeight > panel.offsetHeight,
        contentArea: content ? content.offsetHeight : "no content area"
      };

      checks.summaryPanels.push(panelInfo);

      if (panelInfo.isOverflowing) {
        checks.issues.push(`Summary Panel ${idx} overflowing: ${panelInfo.contentHeight}px content > ${panelInfo.panelHeight}px height`);
      }
    });

    return checks;
  });

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("INDIVIDUAL CARD CONTENT CHECK");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Intel Cards
  console.log("INTEL STRIP CARDS (4 cards):");
  console.log("┌──────────────────────────────────────────────────────────┐");
  cardChecks.intelCards.forEach((card, idx) => {
    console.log(`│ Card ${idx}: ${card.label}`);
    console.log(`│   Value: ${card.value}`);
    console.log(`│   Description: ${card.description}`);
    console.log(`│   Card Height: ${card.cardHeight}px | Content Height: ${card.contentHeight}px`);
    const status = card.isOverflowing ? "❌ OVERFLOWING" : "✓ OK";
    console.log(`│   Status: ${status}`);
    if (card.isTruncated) console.log(`│   ⚠️  Label truncated (${card.labelScrollWidth}px > ${card.labelWidth}px)`);
    console.log(`│`);
  });
  console.log("└──────────────────────────────────────────────────────────┘\n");

  // KPI Cards
  console.log("KPI GRID CARDS (6 cards):");
  console.log("┌──────────────────────────────────────────────────────────┐");
  cardChecks.kpiCards.forEach((card, idx) => {
    console.log(`│ Card ${idx}: ${card.label}`);
    console.log(`│   Value: ${card.value}`);
    console.log(`│   Detail: ${card.detail}`);
    console.log(`│   Card Height: ${card.cardHeight}px | Content Height: ${card.contentHeight}px`);
    const status = card.isOverflowing ? "❌ OVERFLOWING" : "✓ OK";
    console.log(`│   Status: ${status}`);
    console.log(`│`);
  });
  console.log("└──────────────────────────────────────────────────────────┘\n");

  // Chart Cards
  console.log("CHART CARDS (4 charts):");
  console.log("┌──────────────────────────────────────────────────────────┐");
  cardChecks.chartCards.forEach((card, idx) => {
    console.log(`│ Card ${idx}: ${card.label}`);
    console.log(`│   Value: ${card.value}`);
    console.log(`│   Card Height: ${card.cardHeight}px | Content Height: ${card.contentHeight}px`);
    const status = card.isOverflowing ? "❌ OVERFLOWING" : "✓ OK";
    console.log(`│   Status: ${status}`);
    console.log(`│`);
  });
  console.log("└──────────────────────────────────────────────────────────┘\n");

  // Summary Panels
  console.log("SUMMARY PANELS (3 panels):");
  console.log("┌──────────────────────────────────────────────────────────┐");
  cardChecks.summaryPanels.forEach((panel, idx) => {
    console.log(`│ Panel ${idx}: ${panel.kicker} - ${panel.title}`);
    console.log(`│   Panel Height: ${panel.panelHeight}px | Content Height: ${panel.contentHeight}px`);
    const status = panel.isOverflowing ? "❌ OVERFLOWING" : "✓ OK";
    console.log(`│   Status: ${status}`);
    console.log(`│`);
  });
  console.log("└──────────────────────────────────────────────────────────┘\n");

  // Issues Summary
  console.log("ISSUES FOUND:");
  if (cardChecks.issues.length === 0) {
    console.log("✓ No overflow or truncation issues detected!");
  } else {
    console.log(`❌ ${cardChecks.issues.length} issue(s) found:\n`);
    cardChecks.issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
  }

  console.log("\n═══════════════════════════════════════════════════════════════");

  await browser.close();
})();
