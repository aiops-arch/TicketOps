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

  // Check scrolling
  const scrollInfo = await page.evaluate(() => {
    const dashboard = document.querySelector("#dashboard");
    const appShell = document.querySelector(".app-shell");

    return {
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollable: document.documentElement.scrollHeight > window.innerHeight,
      dashboardScrollHeight: dashboard ? dashboard.scrollHeight : 0,
      appShellScrollHeight: appShell ? appShell.scrollHeight : 0,
      appShellClientHeight: appShell ? appShell.clientHeight : 0,
      bodyScrollHeight: document.body.scrollHeight,
      windowScrollHeight: window.scrollHeight
    };
  });

  console.log("SCROLL CHECK:");
  console.log("  Document scrollHeight:", scrollInfo.documentHeight + "px");
  console.log("  Viewport height:", scrollInfo.viewportHeight + "px");
  console.log("  Is scrollable?", scrollInfo.scrollable ? "YES ❌" : "NO ✓");
  console.log("\n  Dashboard scrollHeight:", scrollInfo.dashboardScrollHeight + "px");
  console.log("  AppShell scrollHeight:", scrollInfo.appShellScrollHeight + "px");
  console.log("  AppShell clientHeight:", scrollInfo.appShellClientHeight + "px");

  // Take screenshot
  await page.screenshot({ path: "scroll-check.png", fullPage: false });
  console.log("\n  Screenshot saved: scroll-check.png");

  await browser.close();
})();
