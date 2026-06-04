const puppeteer = require("puppeteer-core");

const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const base = process.env.TICKETOPS_AUDIT_BASE || "http://localhost:3000";
const username = process.env.TICKETOPS_AUDIT_USER || "aiops";
const password = process.env.TICKETOPS_AUDIT_PASSWORD || "AIops";

const routes = [
  ["dashboard.html", "dashboard"],
  ["manager.html", "manager"],
  ["admin.html", "admin"],
  ["scheduler.html", "scheduler"],
  ["masters.html", "masters"],
  ["history.html", "history"],
  ["reports.html", "reports"]
];

const viewports = [
  { name: "desktop", width: 1440, height: 950, isMobile: false },
  { name: "laptop", width: 1280, height: 820, isMobile: false },
  { name: "tablet", width: 900, height: 1100, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];

function routeUrl(route, mode = "browser") {
  const url = new URL(route, `${base}/`);
  if (mode) url.searchParams.set("data", mode);
  return url.toString();
}

async function clearSession(page, route = "dashboard.html") {
  await page.goto(routeUrl(route), { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    localStorage.removeItem("ticketops-auth-user-v2");
    localStorage.removeItem("ticketops-bootstrap-cache-v1");
    localStorage.removeItem("ticketops-bootstrap-cache-v2");
    localStorage.removeItem("ticketops-bootstrap-cache-v3");
    sessionStorage.removeItem("ticketops-last-view");
  });
}

async function login(page, route = "dashboard.html") {
  await clearSession(page, route);
  await page.goto(routeUrl(route), { waitUntil: "networkidle0" });
  await page.waitForSelector("#loginScreen:not(.is-hidden)", { timeout: 10000 });
  await page.type("#loginUsername", username);
  await page.type("#loginPassword", password);
  await page.$eval("#loginForm", (form) => form.requestSubmit());
  await page.waitForSelector("#appShell:not(.is-hidden)", { timeout: 15000 });
  await page.waitForFunction(() => !document.body.classList.contains("is-app-loading"), { timeout: 15000 });
}

async function auditPage(page, expectedView) {
  return page.evaluate((view) => {
    const visible = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };

    const activeView = document.querySelector(".view.is-active");
    const activeRect = activeView?.getBoundingClientRect();
    const overflowX = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);

    const clippedText = [...document.querySelectorAll(`
      .view.is-active button,
      .view.is-active .section-kicker,
      .view.is-active .heading-chip,
      .view.is-active .badge,
      .view.is-active .priority-badge,
      .view.is-active .status-badge,
      .view.is-active .ticket-id,
      .view.is-active .ticket-title,
      .view.is-active .ticket-meta,
      .view.is-active .task-row strong,
      .view.is-active .master-row strong,
      .view.is-active .rule-row strong
    `)].filter((el) => {
      if (!visible(el)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return false;
      const style = getComputedStyle(el);
      if (style.overflow === "visible" && style.whiteSpace !== "nowrap") return false;
      return el.scrollWidth > Math.ceil(rect.width + 3) || el.scrollHeight > Math.ceil(rect.height + 3);
    }).slice(0, 20).map((el) => ({
      text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
      selector: el.id ? `#${el.id}` : String(el.className || el.tagName).slice(0, 80),
      width: Math.round(el.getBoundingClientRect().width),
      scrollWidth: el.scrollWidth,
      height: Math.round(el.getBoundingClientRect().height),
      scrollHeight: el.scrollHeight
    }));

    const emptyRequiredPanels = [...document.querySelectorAll(".view.is-active .panel")].filter(visible).map((panel) => {
      const heading = panel.querySelector(".panel-heading h2")?.textContent.trim() || panel.className;
      const content = [...panel.children].filter((child) => !child.classList.contains("panel-heading"));
      const hasVisibleContent = content.some(visible);
      return hasVisibleContent ? null : heading;
    }).filter(Boolean);

    const overlapping = [...document.querySelectorAll(".view.is-active .panel-heading, .view.is-active .ticket-card, .view.is-active .task-row, .view.is-active .outlet-card, .view.is-active .repair-row")]
      .filter(visible)
      .slice(0, 120)
      .map((el) => {
        const children = [...el.children].filter(visible);
        for (let i = 0; i < children.length; i += 1) {
          const a = children[i].getBoundingClientRect();
          for (let j = i + 1; j < children.length; j += 1) {
            const b = children[j].getBoundingClientRect();
            const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            if (overlapX > 8 && overlapY > 8) {
              return {
                selector: el.id ? `#${el.id}` : String(el.className || el.tagName).slice(0, 80),
                a: children[i].textContent.trim().replace(/\s+/g, " ").slice(0, 40),
                b: children[j].textContent.trim().replace(/\s+/g, " ").slice(0, 40),
                overlapX: Math.round(overlapX),
                overlapY: Math.round(overlapY)
              };
            }
          }
        }
        return null;
      }).filter(Boolean).slice(0, 10);

    return {
      expectedView: view,
      view: document.body.dataset.view || "",
      activeView: activeView?.id || "",
      activeTab: document.querySelector(".tab.is-active")?.dataset.view || "",
      hasSession: document.body.classList.contains("has-session"),
      activeHeight: Math.round(activeRect?.height || 0),
      overflowX,
      clippedText,
      emptyRequiredPanels,
      overlapping
    };
  }, expectedView);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  const results = [];

  for (const viewport of viewports) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("requestfailed", (request) => {
      const url = request.url();
      if (!/fonts\.googleapis|fonts\.gstatic/.test(url)) {
        failedRequests.push(`${request.failure()?.errorText || "failed"} ${url}`);
      }
    });

    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      isMobile: viewport.isMobile,
      deviceScaleFactor: viewport.isMobile ? 2 : 1
    });

    for (const [route, expectedView] of routes) {
      await login(page, route);
      await page.waitForFunction((view) => document.body.dataset.view === view, { timeout: 10000 }, expectedView);
      const result = await auditPage(page, expectedView);
      results.push({
        viewport: viewport.name,
        route,
        ...result,
        consoleErrors: [...consoleErrors],
        failedRequests: [...failedRequests]
      });
      consoleErrors.length = 0;
      failedRequests.length = 0;
    }

    await page.close();
  }

  await browser.close();

  const failures = results.filter((result) =>
    result.view !== result.expectedView ||
    result.activeView !== result.expectedView ||
    result.overflowX > 2 ||
    result.consoleErrors.length ||
    result.failedRequests.length ||
    result.clippedText.length ||
    result.emptyRequiredPanels.length ||
    result.overlapping.length
  );

  console.log(JSON.stringify({ checked: results.length, failures, results }, null, 2));

  if (failures.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
