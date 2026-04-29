const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outPath = path.join(__dirname, "..", "TicketOps_Client_Presentation.pdf");
const doc = new PDFDocument({
  size: "A4",
  layout: "landscape",
  margin: 30,
  info: {
    Title: "TicketOps Client Presentation",
    Author: "TicketOps",
    Subject: "Restaurant Maintenance Ticket Management System"
  }
});

doc.pipe(fs.createWriteStream(outPath));

const W = doc.page.width;
const H = doc.page.height;
const M = 30;

const C = {
  ink: "#17211f",
  muted: "#687570",
  line: "#d8e2dd",
  paper: "#f6f8f7",
  white: "#ffffff",
  dark: "#162320",
  teal: "#2e6f73",
  tealSoft: "#e8f3f3",
  green: "#3f7d5a",
  greenSoft: "#edf7ef",
  amber: "#b36a2e",
  amberSoft: "#fff2dc",
  red: "#b8443e",
  redSoft: "#fde9e7",
  purple: "#67598c",
  purpleSoft: "#f0edf7"
};

let pageNo = 0;

function page(title, subtitle = "") {
  if (pageNo > 0) doc.addPage();
  pageNo += 1;
  doc.rect(0, 0, W, H).fill(C.paper);
  doc.rect(0, 0, W, 34).fill(C.dark);
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(10).text("TicketOps", M, 12);
  doc.font("Helvetica").fontSize(8).text(`Client Presentation | ${pageNo}`, W - 170, 12, { width: 140, align: "right" });
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(22).text(title, M, 55);
  if (subtitle) doc.fillColor(C.muted).font("Helvetica").fontSize(9.5).text(subtitle, M, 83, { width: W - 2 * M });
  doc.moveTo(M, 106).lineTo(W - M, 106).strokeColor(C.line).stroke();
}

function t(text, x, y, w, size = 8.8, color = C.ink, font = "Helvetica", options = {}) {
  doc.fillColor(color).font(font).fontSize(size).text(text, x, y, {
    width: w,
    lineGap: options.lineGap ?? 1.8,
    align: options.align || "left"
  });
}

function box(x, y, w, h, title, lines, fill = C.white, stroke = C.line, accent = null) {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(fill, stroke);
  if (accent) doc.rect(x, y, 5, h).fill(accent);
  t(title, x + 14, y + 12, w - 28, 10, C.ink, "Helvetica-Bold");
  let cy = y + 34;
  lines.forEach((line) => {
    t(line, x + 14, cy, w - 28, 8.2, C.muted);
    cy += doc.heightOfString(line, { width: w - 28 }) + 6;
  });
}

function stat(x, y, w, label, value, color, fill) {
  doc.roundedRect(x, y, w, 62, 8).fillAndStroke(fill, color);
  t(value, x + 12, y + 10, w - 24, 20, color, "Helvetica-Bold");
  t(label, x + 12, y + 39, w - 24, 8, C.ink, "Helvetica-Bold");
}

function bulletList(items, x, y, w, color = C.teal) {
  let cy = y;
  items.forEach((item) => {
    doc.circle(x, cy + 5, 2.2).fill(color);
    t(item, x + 12, cy - 1, w - 12, 8.6, C.ink);
    cy += doc.heightOfString(item, { width: w - 12 }) + 8;
  });
  return cy;
}

function table(x, y, widths, rows, headerFill = C.tealSoft) {
  let cy = y;
  rows.forEach((row, idx) => {
    const height = Math.max(25, ...row.map((cell, i) => doc.heightOfString(String(cell), { width: widths[i] - 12 }) + 14));
    let cx = x;
    row.forEach((cell, i) => {
      doc.rect(cx, cy, widths[i], height).fillAndStroke(idx === 0 ? headerFill : C.white, C.line);
      t(String(cell), cx + 6, cy + 7, widths[i] - 12, idx === 0 ? 8.2 : 7.9, C.ink, idx === 0 ? "Helvetica-Bold" : "Helvetica");
      cx += widths[i];
    });
    cy += height;
  });
  return cy;
}

function flow(x, y, w, h, label, fill = C.tealSoft, stroke = C.teal) {
  doc.roundedRect(x, y, w, h, 7).fillAndStroke(fill, stroke);
  t(label, x + 8, y + 9, w - 16, 8, C.ink, "Helvetica-Bold", { align: "center" });
}

function arrow(x1, y1, x2, y2) {
  doc.strokeColor(C.muted).lineWidth(0.8).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 4;
  doc.path(`M ${x2} ${y2} L ${x2 - s * Math.cos(a - Math.PI / 6)} ${y2 - s * Math.sin(a - Math.PI / 6)} L ${x2 - s * Math.cos(a + Math.PI / 6)} ${y2 - s * Math.sin(a + Math.PI / 6)} Z`).fill(C.muted);
}

function band(x, y, w, h, title, text, color = C.teal, fill = C.tealSoft) {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(fill, color);
  t(title, x + 14, y + 13, w - 28, 11, color, "Helvetica-Bold");
  t(text, x + 14, y + 36, w - 28, 8.7, C.ink);
}

// Page 1
page("TicketOps: Maintenance Ticket Management System", "Client-ready summary for restaurant maintenance operations.");
t("A practical digital workflow replacing WhatsApp-based maintenance communication with ticket ownership, technician attendance, verification, alerts and reporting.", 30, 125, 455, 13, C.ink, "Helvetica-Bold", { lineGap: 3 });
stat(520, 122, 68, "Outlets", "4", C.teal, C.tealSoft);
stat(600, 122, 78, "Managers", "4", C.purple, C.purpleSoft);
stat(690, 122, 90, "Technicians", "4", C.green, C.greenSoft);
stat(790, 122, 48, "Admin", "1", C.amber, C.amberSoft);
box(30, 220, 250, 120, "Business Problem", [
  "Maintenance is currently communicated informally through WhatsApp.",
  "Requests can be missed, delayed, duplicated or closed without proof."
], C.redSoft, C.red, C.red);
box(300, 220, 250, 120, "TicketOps Response", [
  "Every issue gets a ticket ID, owner, status, timeline and verification.",
  "Admin can assign based on technician availability."
], C.greenSoft, C.green, C.green);
box(570, 220, 240, 120, "Current Product State", [
  "Web app, REST API, Supabase-ready schema, Android APK, iOS project and Flutter mobile foundation exist.",
  "Production readiness work remains."
], C.white, C.line, C.teal);
band(30, 375, 780, 82, "Recommended Go-Ahead", "Proceed with a controlled pilot: connect Supabase, add login, add photo upload, deploy backend/frontend, test Android APK with one outlet, then expand.", C.teal, C.tealSoft);
band(30, 478, 380, 58, "Core Rule", "No ticket ID = no official maintenance work.", C.red, C.redSoft);
band(430, 478, 380, 58, "Pilot Strategy", "Start narrow, validate behavior, then roll out to all four outlets.", C.amber, C.amberSoft);

// Page 2
page("Why The Existing Process Fails", "The issue is not messaging speed. The issue is missing operating control.");
box(30, 130, 245, 145, "WhatsApp Failure Points", [
  "No ticket ID",
  "No single owner",
  "No SLA timer",
  "No manager verification",
  "No structured report"
], C.redSoft, C.red, C.red);
box(300, 130, 245, 145, "Operational Impact", [
  "Repeated follow-ups",
  "Technician confusion",
  "Admin becomes dispatcher manually",
  "Managers over-escalate",
  "No asset/outlet intelligence"
], C.amberSoft, C.amber, C.amber);
box(570, 130, 240, 145, "Business Risk", [
  "Delayed service recovery",
  "Food safety exposure",
  "Customer-facing failures",
  "Higher repair cost",
  "No decision data"
], C.white, C.line, C.purple);
t("Failure Chain", 30, 310, 200, 12, C.ink, "Helvetica-Bold");
const fy = 350;
flow(30, fy, 105, 44, "Issue found");
flow(160, fy, 105, 44, "WhatsApp sent", C.amberSoft, C.amber);
flow(290, fy, 105, 44, "Context lost", C.redSoft, C.red);
flow(420, fy, 105, 44, "Manual chase");
flow(550, fy, 105, 44, "No proof");
flow(680, fy, 105, 44, "No report", C.redSoft, C.red);
[[135,372,160,372],[265,372,290,372],[395,372,420,372],[525,372,550,372],[655,372,680,372]].forEach((a) => arrow(...a));
band(30, 440, 780, 88, "TicketOps Fix", "Convert every maintenance issue into a controlled record: priority, assignment, attendance status, technician action, blocked reason, resolution reason, manager verification and reporting.", C.green, C.greenSoft);

// Page 3
page("Operating Workflow", "Compact end-to-end flow from issue to closure.");
const xs = [35, 170, 305, 440, 575, 710];
const y1 = 145, y2 = 250, y3 = 355;
[
  [xs[0], y1, "Manager creates ticket"],
  [xs[1], y1, "Ticket ID + timestamp"],
  [xs[2], y1, "Priority calculated"],
  [xs[3], y1, "Attendance checked"],
  [xs[4], y1, "Admin assigns"],
  [xs[5], y1, "Technician accepts"],
  [xs[0], y2, "Work starts"],
  [xs[1], y2, "Update or block"],
  [xs[2], y2, "Resolve with reason"],
  [xs[3], y2, "Manager verifies"],
  [xs[4], y2, "Closed"],
  [xs[5], y2, "Reopened if rejected"]
].forEach(([x, y, label]) => flow(x, y, 100, 44, label));
for (let i = 0; i < 5; i += 1) arrow(xs[i] + 100, y1 + 22, xs[i + 1], y1 + 22);
arrow(xs[5] + 50, y1 + 44, xs[5] + 50, y2);
for (let i = 5; i > 0; i -= 1) arrow(xs[i], y2 + 22, xs[i - 1] + 100, y2 + 22);
box(35, y3, 230, 115, "Manager", ["Create issue", "Track status", "Approve/reopen"], C.tealSoft, C.teal, C.teal);
box(295, y3, 230, 115, "Technician", ["Check in", "Acknowledge/start", "Block/resolve with reason"], C.greenSoft, C.green, C.green);
box(555, y3, 230, 115, "Admin", ["Assign/reassign", "Override with reason", "Monitor alerts"], C.purpleSoft, C.purple, C.purple);

// Page 4
page("Attendance-Aware Assignment", "Work is assigned to people who are actually available.");
table(30, 130, [155, 290, 325], [
  ["Status", "Assignment Behavior", "Business Reason"],
  ["Present", "Eligible for normal assignment", "Technician is available to accept new work"],
  ["Busy", "Admin can assign with warning", "Prevents silent overload"],
  ["Break / Leave / Absent / Off Duty", "Skipped by normal assignment", "Stops dispatching to unavailable people"],
  ["Emergency Available", "Critical work only", "Keeps urgent issues moving"],
  ["Admin Override", "Allowed with reason", "Maintains control while preserving audit trail"]
], C.greenSoft);
t("Smart Assignment Logic", 30, 335, 220, 12, C.ink, "Helvetica-Bold");
flow(30, 375, 120, 42, "New ticket");
flow(180, 375, 120, 42, "Check priority");
flow(330, 375, 120, 42, "Filter attendance");
flow(480, 375, 120, 42, "Match skill");
flow(630, 375, 120, 42, "Suggest tech");
[[150,396,180,396],[300,396,330,396],[450,396,480,396],[600,396,630,396]].forEach((a) => arrow(...a));
band(30, 455, 780, 70, "Mid-Shift Rule", "If assigned work has not started and the technician becomes unavailable, the ticket returns to admin queue. If work is in progress, admin chooses pause, wait or reassign.", C.amber, C.amberSoft);

// Page 5
page("System And Technical Architecture", "Simple enough for a small team, structured enough for accountability.");
flow(45, 150, 115, 46, "Web App");
flow(45, 235, 115, 46, "Android APK");
flow(45, 320, 115, 46, "iOS Project");
flow(285, 235, 130, 58, "REST API Backend", C.greenSoft, C.green);
flow(625, 175, 120, 46, "Supabase", C.purpleSoft, C.purple);
flow(625, 305, 120, 46, "JSON Demo", C.amberSoft, C.amber);
[[160,173,285,250],[160,258,285,264],[160,343,285,285],[415,250,625,198],[415,282,625,328]].forEach((a) => arrow(...a));
box(30, 425, 245, 90, "Frontend Rule", ["Web, Android and iOS use the same REST API.", "No Supabase service key in frontend/mobile."], C.tealSoft, C.teal, C.teal);
box(300, 425, 245, 90, "Backend Rule", ["API owns validation, assignment logic and audit history.", "Service role key stays backend-only."], C.greenSoft, C.green, C.green);
box(570, 425, 240, 90, "Data Rule", ["Supabase is production storage.", "JSON is demo/testing fallback only."], C.purpleSoft, C.purple, C.purple);

// Page 6
page("Build Status And Roadmap", "Current progress, pending production work and client decisions.");
table(30, 130, [145, 90, 250, 285], [
  ["Area", "Status", "Current State", "Next Action"],
  ["Web app", "Built", "Manager/Admin/Technician/Reports flows", "Improve UI through pilot feedback"],
  ["Backend API", "Built", "REST workflow rules in place", "Deploy production API"],
  ["Supabase", "Ready", "Schema and adapter prepared", "Connect credentials and seed data"],
  ["Android", "APK ready", "Debug APK and Flutter release APK exist", "Test on phone with reachable API"],
  ["iOS", "Prepared", "Capacitor project exists", "Use Mac/Xcode for final IPA"],
  ["Production", "Pending", "Auth/photo/storage/deployment still needed", "Build pilot-ready release"]
], C.tealSoft);
box(30, 355, 250, 145, "Client Inputs Needed", [
  "Supabase credentials or project access",
  "Final outlet and user list",
  "Technician names and skills",
  "Hosting decision",
  "Android-first or web+Android pilot"
], C.white, C.line, C.teal);
box(300, 355, 250, 145, "Recommended Next Sprint", [
  "Connect Supabase",
  "Add role login",
  "Add photo upload",
  "Deploy backend/web",
  "Run one-outlet pilot"
], C.greenSoft, C.green, C.green);
box(570, 355, 240, 145, "Go-Ahead Statement", [
  "TicketOps is ready to move from build foundation into pilot preparation.",
  "Approve focused pilot before full rollout."
], C.amberSoft, C.amber, C.amber);

doc.end();
console.log(outPath);
