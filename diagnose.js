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
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.type("#loginUsername", "aiops");
  await page.type("#loginPassword", "AIops");
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: "diagnose.png", fullPage: false });

  const info = await page.evaluate(() => {
    const hero = document.querySelector(".command-hero");
    const heroRect = hero?.getBoundingClientRect();
    const h2 = hero?.querySelector("h2");
    const p = hero?.querySelector("p");
    const metrics = hero?.querySelector(".hero-metrics");
    const modeSwitch = hero?.querySelector(".dashboard-mode-switcher");
    const kicker = hero?.querySelector(".section-kicker");

    const cs = (el) => el ? window.getComputedStyle(el) : null;

    return {
      hero: {
        rect: heroRect ? { top: Math.round(heroRect.top), left: Math.round(heroRect.left), width: Math.round(heroRect.width), height: Math.round(heroRect.height), right: Math.round(heroRect.right), bottom: Math.round(heroRect.bottom) } : null,
        padding: cs(hero)?.padding,
        display: cs(hero)?.display,
        gridTemplateColumns: cs(hero)?.gridTemplateColumns,
        overflow: cs(hero)?.overflow,
        height: hero?.offsetHeight
      },
      h2: { text: h2?.textContent, height: h2?.offsetHeight, fontSize: cs(h2)?.fontSize, overflow: cs(h2)?.overflow },
      p: { text: p?.textContent?.substring(0, 60), height: p?.offsetHeight, fontSize: cs(p)?.fontSize },
      kicker: { text: kicker?.textContent, height: kicker?.offsetHeight },
      metrics: {
        height: metrics?.offsetHeight,
        childCount: metrics?.children.length,
        display: cs(metrics)?.display
      },
      modeSwitch: {
        height: modeSwitch?.offsetHeight,
        display: cs(modeSwitch)?.display
      },
      totalChildrenHeight: Array.from(hero?.children || []).reduce((sum, el) => sum + el.offsetHeight, 0),
      heroScrollHeight: hero?.scrollHeight
    };
  });

  console.log("COMMAND HERO DIAGNOSIS");
  console.log("═══════════════════════════════════════");
  console.log("Hero rect:", JSON.stringify(info.hero.rect));
  console.log("Hero height:", info.hero.height + "px");
  console.log("Hero scrollHeight:", info.heroScrollHeight + "px");
  console.log("Hero padding:", info.hero.padding);
  console.log("Hero display:", info.hero.display);
  console.log("Hero grid-template-columns:", info.hero.gridTemplateColumns);
  console.log("Hero overflow:", info.hero.overflow);
  console.log("\nContent:");
  console.log("  Kicker:", info.kicker?.text, "| height:", info.kicker?.height + "px");
  console.log("  h2:", info.h2?.text, "| height:", info.h2?.height + "px", "| font:", info.h2?.fontSize);
  console.log("  p:", info.p?.text, "| height:", info.p?.height + "px", "| font:", info.p?.fontSize);
  console.log("  Mode switcher height:", info.modeSwitch?.height + "px");
  console.log("  Metrics height:", info.metrics?.height + "px", "| children:", info.metrics?.childCount);
  console.log("\n  Total children height:", info.totalChildrenHeight + "px");
  console.log("  Hero container height:", info.hero.height + "px");
  if (info.heroScrollHeight > info.hero.height) {
    console.log("  ❌ OVERFLOW: " + (info.heroScrollHeight - info.hero.height) + "px clipped");
  } else {
    console.log("  ✓ Content fits");
  }

  await browser.close();
})();
