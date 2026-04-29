const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outPath = path.join(__dirname, "..", "TicketOps_Client_Presentation.pdf");

const doc = new PDFDocument({
  size: "A4",
  margin: 42,
  info: {
    Title: "TicketOps Client Presentation",
    Author: "TicketOps",
    Subject: "Restaurant Maintenance Ticket Management System"
  }
});

doc.pipe(fs.createWriteStream(outPath));

const C = {
  ink: "#1c2523",
  muted: "#64716d",
  faint: "#f6f8f7",
  line: "#dce4e0",
  teal: "#2f6f73",
  tealSoft: "#e9f4f4",
  green: "#3f7d5a",
  greenSoft: "#edf7ef",
  amber: "#b96f33",
  amberSoft: "#fff4df",
  red: "#b4443f",
  redSoft: "#fde9e7",
  purple: "#695b8c",
  purpleSoft: "#f0edf7",
  dark: "#182421",
  white: "#ffffff"
};

let pageNo = 0;

function page(title, subtitle) {
  if (pageNo > 0) doc.addPage();
  pageNo += 1;
  doc.rect(0, 0, doc.page.width, 34).fill(C.dark);
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(10).text("TicketOps", 42, 12);
  doc.font("Helvetica").fontSize(8).text(`Client Presentation | Page ${pageNo}`, 430, 12, { width: 120, align: "right" });
  doc.fillColor(C.ink);
  if (title) {
    doc.font("Helvetica-Bold").fontSize(22).text(title, 42, 58);
    if (subtitle) doc.font("Helvetica").fontSize(10).fillColor(C.muted).text(subtitle, 42, 88, { width: 500 });
    doc.moveTo(42, 112).lineTo(553, 112).strokeColor(C.line).stroke();
    doc.fillColor(C.ink);
    doc.y = 132;
  }
}

function section(title, y = doc.y) {
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(13).text(title, 42, y);
  doc.y += 10;
}

function body(text, options = {}) {
  doc.fillColor(options.color || C.ink).font("Helvetica").fontSize(options.size || 9.5)
    .text(text, options.x || 42, options.y || doc.y, {
      width: options.width || 510,
      lineGap: options.lineGap || 3,
      align: options.align || "left"
    });
}

function bullet(items, x = 55, width = 480) {
  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink);
  items.forEach((item) => {
    doc.circle(x, doc.y + 5, 2).fill(C.teal);
    doc.fillColor(C.ink).text(item, x + 12, doc.y - 2, { width, lineGap: 2 });
    doc.moveDown(0.45);
  });
}

function card(x, y, w, h, title, lines, fill = C.white, stroke = C.line) {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(fill, stroke);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(10).text(title, x + 12, y + 12, { width: w - 24 });
  doc.fillColor(C.muted).font("Helvetica").fontSize(8.5);
  let ty = y + 31;
  lines.forEach((line) => {
    doc.text(line, x + 12, ty, { width: w - 24 });
    ty += 13;
  });
}

function metric(x, y, label, value, color = C.teal, soft = C.tealSoft) {
  doc.roundedRect(x, y, 116, 70, 8).fillAndStroke(soft, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(22).text(value, x + 12, y + 13);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.5).text(label, x + 12, y + 44, { width: 92 });
}

function table(x, y, widths, rows, headerFill = C.tealSoft) {
  let cy = y;
  rows.forEach((row, idx) => {
    const fill = idx === 0 ? headerFill : C.white;
    const height = Math.max(28, ...row.map((cell, i) => doc.heightOfString(String(cell), { width: widths[i] - 12 }) + 14));
    let cx = x;
    row.forEach((cell, i) => {
      doc.rect(cx, cy, widths[i], height).fillAndStroke(fill, C.line);
      doc.fillColor(C.ink).font(idx === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(idx === 0 ? 8.8 : 8.4)
        .text(String(cell), cx + 6, cy + 8, { width: widths[i] - 12 });
      cx += widths[i];
    });
    cy += height;
  });
  doc.y = cy + 14;
}

function flowBox(x, y, w, h, text, fill = C.tealSoft, stroke = C.teal) {
  doc.roundedRect(x, y, w, h, 7).fillAndStroke(fill, stroke);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.8).text(text, x + 8, y + 10, {
    width: w - 16,
    align: "center"
  });
}

function arrow(x1, y1, x2, y2) {
  doc.strokeColor(C.muted).lineWidth(1).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 5;
  doc.path(`M ${x2} ${y2} L ${x2 - size * Math.cos(angle - Math.PI / 6)} ${y2 - size * Math.sin(angle - Math.PI / 6)} L ${x2 - size * Math.cos(angle + Math.PI / 6)} ${y2 - size * Math.sin(angle + Math.PI / 6)} Z`).fill(C.muted);
}

function footerNote(text) {
  doc.roundedRect(42, 730, 511, 44, 8).fillAndStroke(C.faint, C.line);
  doc.fillColor(C.muted).font("Helvetica").fontSize(8.5).text(text, 56, 744, { width: 482, lineGap: 2 });
}

// Cover
page();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.faint);
doc.rect(0, 0, doc.page.width, 250).fill(C.dark);
doc.fillColor(C.white).font("Helvetica-Bold").fontSize(30).text("TicketOps", 42, 78);
doc.font("Helvetica").fontSize(15).fillColor("#d7e4e0")
  .text("Restaurant Maintenance Ticket Management System", 42, 118, { width: 420 });
doc.font("Helvetica").fontSize(10).fillColor("#bfd1cc")
  .text("Client-ready workflow, system design, mobile build, Supabase data model and implementation roadmap.", 42, 150, { width: 430, lineGap: 4 });
metric(42, 306, "Outlets", "4");
metric(166, 306, "Managers", "4", C.purple, C.purpleSoft);
metric(290, 306, "Technicians", "4", C.green, C.greenSoft);
metric(414, 306, "Admin", "1", C.amber, C.amberSoft);
card(42, 420, 511, 130, "Core Objective", [
  "Replace WhatsApp-based maintenance communication with a structured digital workflow.",
  "Reduce operational chaos, improve response time, create accountability and produce business intelligence."
], C.white, C.line);
footerNote("Prepared for client presentation. Current build includes web app, REST API, Supabase-ready schema, Android APK, iOS project preparation and Flutter mobile app foundation.");

// Executive summary
page("Executive Summary", "What has been created and why it matters.");
section("Current Position");
body("TicketOps has moved beyond planning. It now has a working product base with web, backend, Android APK, Supabase data architecture, iOS project preparation and detailed operating documentation.");
doc.moveDown(1);
metric(42, 205, "Web App", "Ready", C.teal, C.tealSoft);
metric(166, 205, "Backend", "REST", C.green, C.greenSoft);
metric(290, 205, "Database", "Supabase", C.purple, C.purpleSoft);
metric(414, 205, "Android", "APK", C.amber, C.amberSoft);
doc.y = 310;
section("Client Value");
bullet([
  "Every maintenance issue gets a ticket ID, owner, status and timeline.",
  "Admin can assign work based on technician attendance and availability.",
  "Technicians must give reasons for blocked, resolved and reopened work.",
  "Managers can verify whether the issue is actually fixed.",
  "Reports show operational alerts, workload and maintenance patterns."
]);
section("Current Limitation", doc.y + 10);
bullet([
  "Supabase structure is ready, but live credentials must be connected.",
  "iOS project is prepared, but final Apple IPA signing needs macOS/Xcode.",
  "Authentication, real photo uploads and production notifications are next-stage work."
]);

// Problem
page("Problem Being Solved", "Why the business needs TicketOps instead of WhatsApp-only maintenance.");
section("Current Operational Reality");
bullet([
  "Restaurant maintenance issues happen during service hours when managers are busy.",
  "WhatsApp messages are fast, but they do not create structured accountability.",
  "Technicians may receive work through calls, messages or verbal instructions.",
  "Admin loses visibility when requests are scattered across chats.",
  "Management cannot easily see which outlet, asset or technician is causing repeated delays."
]);
section("Failure Pattern", doc.y + 10);
flowBox(55, 305, 120, 48, "Issue noticed");
flowBox(220, 305, 120, 48, "WhatsApp sent", C.amberSoft, C.amber);
flowBox(385, 305, 120, 48, "Follow-up calls");
flowBox(55, 410, 120, 48, "Work unclear", C.redSoft, C.red);
flowBox(220, 410, 120, 48, "No proof");
flowBox(385, 410, 120, 48, "No report", C.redSoft, C.red);
arrow(175, 329, 220, 329);
arrow(340, 329, 385, 329);
arrow(445, 353, 445, 410);
arrow(385, 434, 340, 434);
arrow(220, 434, 175, 434);
footerNote("The main issue is not communication. The issue is the lack of a controlled operating record: no owner, no SLA, no proof, no verification and no reusable data.");

// Solution
page("TicketOps Solution", "A simple maintenance operating system for restaurants.");
section("Operating Principle");
body("TicketOps makes the correct workflow easier than informal follow-up. The goal is not to create a heavy enterprise system. The goal is to make every issue visible, owned, tracked, verified and reportable.");
doc.moveDown(1);
card(42, 210, 240, 115, "For Managers", [
  "Create tickets quickly",
  "Track assigned work",
  "Approve or reopen resolved issues"
], C.tealSoft, C.teal);
card(313, 210, 240, 115, "For Technicians", [
  "Check in",
  "See assigned work",
  "Update, block or resolve with reason"
], C.greenSoft, C.green);
card(42, 355, 240, 115, "For Admin", [
  "View all tickets",
  "Assign based on attendance",
  "Monitor critical, blocked and reopened work"
], C.purpleSoft, C.purple);
card(313, 355, 240, 115, "For Business Owner", [
  "See patterns by outlet",
  "Identify repeat failures",
  "Improve technician accountability"
], C.amberSoft, C.amber);
section("Key Rule", 530);
body("No ticket ID = no official maintenance work.", { size: 14, color: C.red });

// Master workflow
page("End-to-End Workflow", "The complete journey from issue reporting to closure.");
const x1 = 42, x2 = 216, x3 = 390;
const yA = 165, yB = 255, yC = 345, yD = 435, yE = 525;
[
  [x1, yA, "Manager reports issue"],
  [x2, yA, "System creates ticket ID"],
  [x3, yA, "Priority calculated"],
  [x1, yB, "Attendance checked"],
  [x2, yB, "Admin assigns technician"],
  [x3, yB, "Technician acknowledges"],
  [x1, yC, "Work in progress"],
  [x2, yC, "Blocked or updated"],
  [x3, yC, "Resolved with reason"],
  [x1, yD, "Manager verifies"],
  [x2, yD, "Closed"],
  [x3, yD, "Reopened if rejected"]
].forEach(([x, y, t]) => flowBox(x, y, 135, 46, t));
[
  [177, yA + 23, x2, yA + 23], [351, yA + 23, x3, yA + 23], [457, yA + 46, 457, yB],
  [390, yB + 23, 351, yB + 23], [216, yB + 23, 177, yB + 23], [109, yB + 46, 109, yC],
  [177, yC + 23, x2, yC + 23], [351, yC + 23, x3, yC + 23], [457, yC + 46, 457, yD],
  [390, yD + 23, 351, yD + 23], [216, yD + 23, 177, yD + 23]
].forEach((a) => arrow(...a));
footerNote("The workflow is intentionally practical: quick manager capture, admin control, technician action, proof/reason capture, manager verification and reopen handling.");

// Roles
page("Role-Based Responsibilities", "Clear ownership prevents operational confusion.");
table(42, 150, [110, 190, 210], [
  ["Role", "Main Actions", "Accountability"],
  ["Manager", "Create ticket, add issue details, approve or reject resolution", "Confirms whether the operational problem is actually fixed"],
  ["Technician", "Check in, acknowledge, start, block, resolve", "Owns execution and must provide reasons/proof"],
  ["Admin", "Assign, reassign, override, monitor alerts, review blocked/reopened work", "Owns control, prioritization and escalation"],
  ["System", "Ticket ID, priority, history, alerts, reports", "Preserves audit trail and business intelligence"]
]);
section("Design Decision");
body("The system is role-first. Users see the work they need to do, not a generic enterprise ticketing maze.");

// Attendance
page("Attendance-Aware Assignment", "Maintenance assignment should respect technician availability.");
section("Why Attendance Matters");
bullet([
  "A technician who is absent, on leave or on break should not silently receive normal work.",
  "If a technician becomes unavailable after assignment, unstarted work should return to admin review.",
  "Critical work should still be escalated quickly if no ideal technician is present."
]);
section("Availability Rules", doc.y + 8);
table(42, doc.y + 6, [150, 360], [
  ["Status", "Assignment Behavior"],
  ["Present", "Eligible for normal assignment"],
  ["Busy", "Admin can assign with awareness"],
  ["Break / Leave / Absent / Off Duty", "Skipped by normal assignment"],
  ["Emergency Available", "Can be used for critical work"],
  ["Admin Override", "Allowed, but reason must be visible in history"]
], C.greenSoft);

// System modules
page("System Modules", "What the current product base contains.");
card(42, 145, 240, 100, "Web Application", [
  "Manager, Admin, Technician and Reports flows",
  "Clean mobile-first interface",
  "REST API driven"
], C.tealSoft, C.teal);
card(313, 145, 240, 100, "Backend API", [
  "Node.js + Express",
  "Workflow validation",
  "Supabase or local JSON storage"
], C.greenSoft, C.green);
card(42, 275, 240, 100, "Database Model", [
  "Supabase schema ready",
  "Tickets, technicians, outlets, history, attendance",
  "Service role kept backend-only"
], C.purpleSoft, C.purple);
card(313, 275, 240, 100, "Mobile Apps", [
  "Android APK generated",
  "iOS project prepared",
  "Flutter mobile app foundation added"
], C.amberSoft, C.amber);
card(42, 405, 240, 100, "Documentation", [
  "Workflow, API, Supabase, mobile and user guides",
  "Client and developer handoff material"
], C.white, C.line);
card(313, 405, 240, 100, "Deployment Prep", [
  "Render config",
  "Vercel config",
  "Supabase setup scripts and notes"
], C.white, C.line);

// Architecture
page("Technical Architecture", "Simple, practical and small-team friendly.");
flowBox(42, 170, 110, 50, "Web App");
flowBox(42, 260, 110, 50, "Android APK");
flowBox(42, 350, 110, 50, "iOS Project");
flowBox(240, 260, 120, 58, "REST API Backend", C.greenSoft, C.green);
flowBox(443, 210, 110, 50, "Supabase");
flowBox(443, 325, 110, 50, "Local JSON Demo", C.amberSoft, C.amber);
arrow(152, 195, 240, 280);
arrow(152, 285, 240, 285);
arrow(152, 375, 240, 305);
arrow(360, 275, 443, 235);
arrow(360, 300, 443, 350);
section("Architecture Notes", 455);
bullet([
  "No microservices are required for this business size.",
  "The REST API owns business rules and protects Supabase service credentials.",
  "The same API supports web, Android and future iOS builds.",
  "Local JSON fallback exists only for demo and development convenience."
]);

// Mobile and APK
page("Mobile Status", "Android is testable now. iOS is prepared for Mac build.");
section("Android");
bullet([
  "Capacitor Android project exists in `android/`.",
  "Debug APK exists locally as `TicketOps-debug.apk`.",
  "Flutter release APK exists locally as `TicketOps-Flutter-release.apk`.",
  "Physical Android testing requires the API server to be reachable from the phone."
]);
section("iOS / Apple", doc.y + 14);
bullet([
  "iOS project exists in `ios/`.",
  "Windows can prepare and sync iOS code, but cannot produce final signed IPA.",
  "Final iOS build requires macOS, Xcode, CocoaPods and Apple Developer account.",
  "The iOS app will use the same REST API as web and Android."
]);
footerNote("Client message: Android testing can begin now. Apple/iOS build is feasible, but the final signing stage must happen on a Mac or cloud Mac build service.");

// Current progress
page("Current Build Progress", "What is already done versus pending.");
table(42, 145, [175, 105, 230], [
  ["Area", "Status", "Notes"],
  ["Workflow plan", "Done", "Detailed business and system workflow documented"],
  ["Web app", "Built", "Manager/Admin/Technician/Reports flows exist"],
  ["REST API", "Built", "Workflow validation and local/Supabase storage support"],
  ["Supabase model", "Ready", "Schema exists; live credentials still needed"],
  ["Android APK", "Built", "Debug APK available for testing"],
  ["iOS project", "Prepared", "Final IPA requires macOS/Xcode"],
  ["Flutter app", "Added", "Native mobile foundation exists"],
  ["Production auth", "Pending", "Needed before real rollout"],
  ["Photo storage", "Pending", "Needed for issue/resolution proof"]
]);

// Roadmap
page("Recommended Roadmap", "A practical path from prototype to pilot.");
table(42, 145, [90, 190, 230], [
  ["Phase", "Focus", "Outcome"],
  ["Phase 1", "Finalize core ticket workflow, role screens, attendance, assignment", "Pilot-ready operating flow"],
  ["Phase 2", "Connect Supabase, add auth, add photo upload", "Real data and secure users"],
  ["Phase 3", "Deploy backend/frontend, configure mobile API, test Android APK", "Usable live pilot"],
  ["Phase 4", "Add SLA jobs, notifications, reports and asset register", "Operational control and analytics"],
  ["Phase 5", "Mac/Xcode iOS build and release signing", "Apple app delivery path"]
]);
section("Pilot Recommendation", doc.y + 8);
body("Start with one outlet and one technician for live testing. Fix workflow friction before rolling out to all four outlets. This keeps adoption clean and prevents a bad first impression.");

// Client decisions
page("Client Decisions Needed", "To move from build base to live pilot.");
section("Required Inputs");
bullet([
  "Supabase project URL and backend service role key.",
  "Final outlet names and manager names.",
  "Technician names, skills and normal shift/attendance expectations.",
  "Ticket categories and priority rules to confirm.",
  "Decision on Android-only pilot first or web + Android together.",
  "Decision on where backend will be hosted: Render or another provider."
]);
section("Recommended Immediate Decision");
body("Approve a focused pilot build using web + Android + Supabase first. iOS should remain prepared, then be completed after the workflow has been tested with real users.");

// Close
page("Go-Ahead Summary", "What the client can approve now.");
card(42, 155, 511, 120, "Recommended Approval", [
  "Proceed with TicketOps pilot using the current system foundation.",
  "Connect Supabase, deploy backend, add login and photo uploads, then test with one outlet before business-wide rollout."
], C.greenSoft, C.green);
section("Why This Is The Right Next Step", 325);
bullet([
  "The business problem is operational, not theoretical: requests are currently easy to lose.",
  "The system already has the correct workflow spine.",
  "The next work is about production readiness: auth, storage, deployment, notifications and pilot QA.",
  "A controlled pilot will expose real usage friction before full rollout."
]);
footerNote("TicketOps is ready to progress from prototype/build foundation into pilot preparation.");

doc.end();

console.log(outPath);
