const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "www");

const files = [
  "index.html",
  "dashboard.html",
  "manager.html",
  "admin.html",
  "scheduler.html",
  "masters.html",
  "technician.html",
  "history.html",
  "reports.html",
  "customer.html",
  "styles.css",
  "customer.css",
  "app.js",
  "customer.js",
  "manifest.webmanifest",
  "sw.js"
];

function copyFile(relativePath) {
  fs.copyFileSync(path.join(root, relativePath), path.join(out, relativePath));
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  copyFile(file);
}

fs.cpSync(path.join(root, "assets"), path.join(out, "assets"), { recursive: true });
fs.cpSync(path.join(root, "vendor"), path.join(out, "vendor"), { recursive: true });

const DEFAULT_GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFg_7RGPt0HQIX_4oxmr_G8Br-UYT8GllmHKD3jf15cZvaods4bI4rFc8-sdmrgCEO/exec";
const configuredApiBase = process.env.TICKETOPS_GOOGLE_APPS_SCRIPT_URL || DEFAULT_GOOGLE_APPS_SCRIPT_URL || process.env.TICKETOPS_API_BASE || "";
const staleApiBasePattern = /(ticketops-api\.onrender\.com|supabase\.co|ksfbnsdqbaccuebrrhvu)/i;
const apiBase = staleApiBasePattern.test(configuredApiBase) ? "" : configuredApiBase;
const config = JSON.stringify({ apiBase });
fs.writeFileSync(path.join(out, "frontend-config.js"), `window.TICKETOPS_CONFIG = ${config};\n`);

console.log(`Web assets copied to ${out}`);
