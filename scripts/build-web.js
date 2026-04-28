const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "www");

const files = [
  "index.html",
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

const apiBase = process.env.TICKETOPS_API_BASE || "";
const config = JSON.stringify({ apiBase });
fs.writeFileSync(path.join(out, "frontend-config.js"), `window.TICKETOPS_CONFIG = ${config};\n`);

console.log(`Web assets copied to ${out}`);
