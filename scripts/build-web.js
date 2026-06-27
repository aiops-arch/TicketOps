const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const out = path.join(root, "www");

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "customer.html",
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(out, file));
}

fs.cpSync(path.join(srcDir, "assets"), path.join(out, "assets"), { recursive: true });
fs.cpSync(path.join(srcDir, "vendor"), path.join(out, "vendor"), { recursive: true });

const DEFAULT_GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFg_7RGPt0HQIX_4oxmr_G8Br-UYT8GllmHKD3jf15cZvaods4bI4rFc8-sdmrgCEO/exec";
const configuredApiBase = process.env.TICKETOPS_GOOGLE_APPS_SCRIPT_URL || DEFAULT_GOOGLE_APPS_SCRIPT_URL || process.env.TICKETOPS_API_BASE || "";
const staleApiBasePattern = /(ticketops-api\.onrender\.com|supabase\.co|ksfbnsdqbaccuebrrhvu)/i;
const apiBase = staleApiBasePattern.test(configuredApiBase) ? "" : configuredApiBase;
fs.writeFileSync(path.join(out, "frontend-config.js"), `window.TICKETOPS_CONFIG = ${JSON.stringify({ apiBase })};\n`);

console.log(`Web assets copied to ${out}`);
