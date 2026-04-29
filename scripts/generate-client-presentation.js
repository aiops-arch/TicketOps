const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outPath = path.join(__dirname, "..", "TicketOps_Client_Presentation.pdf");

const doc = new PDFDocument({
  size: "A4",
  layout: "landscape",
  margin: 36,
  info: {
    Title: "TicketOps Client Presentation",
    Author: "TicketOps",
    Subject: "Restaurant Maintenance Ticket Management System"
  }
});

doc.pipe(fs.createWriteStream(outPath));

const C = {
  ink: "#17211f",
  muted: "#5f6f6a",
  line: "#d9e3df",
  paper: "#f6f8f7",
  white: "#ffffff",
  dark: "#162320",
  teal: "#2e6f73",
  tealSoft: "#e7f2f2",
  green: "#3f7d5a",
  greenSoft: "#edf7ef",
  amber: "#b56d31",
  amberSoft: "#fff2dc",
  red: "#b8443e",
  redSoft: "#fde9e7",
  purple: "#67598c",
  purpleSoft: "#f0edf7"
};

const W = doc.page.width;
const H = doc.page.height;
const M = 38;
let pageNo = 0;

function page(title, subtitle = "") {
  if (pageNo > 0) doc.addPage();
  pageNo += 1;
  doc.rect(0, 0, W, H).fill(C.paper);
  doc.rect(0, 0, W, 38).fill(C.dark);
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(11).text("TicketOps", M, 14);
  doc.font("Helvetica").fontSize(9).text(`Client Presentation | ${pageNo}`, W - 205, 14, {
    width: 165,
    align: "right"
  });

  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(26).text(title, M, 62, {
    width: W - 2 * M
  });
  if (subtitle) {
    doc.fillColor(C.muted).font("Helvetica").fontSize(12).text(subtitle, M, 98, {
      width: W - 2 * M,
      lineGap: 2
    });
  }
  doc.moveTo(M, 128).lineTo(W - M, 128).strokeColor(C.line).stroke();
}

function text(value, x, y, width, size = 11, color = C.ink, font = "Helvetica", opts = {}) {
  doc.fillColor(color).font(font).fontSize(size).text(value, x, y, {
    width,
    lineGap: opts.lineGap ?? 3,
    align: opts.align || "left"
  });
}

function heading(value, x, y, width, color = C.ink) {
  text(value, x, y, width, 15, color, "Helvetica-Bold", { lineGap: 2 });
}

function card(x, y, width, height, title, lines, options = {}) {
  const fill = options.fill || C.white;
  const stroke = options.stroke || C.line;
  const accent = options.accent;
  doc.roundedRect(x, y, width, height, 10).fillAndStroke(fill, stroke);
  if (accent) doc.roundedRect(x, y, 8, height, 4).fill(accent);
  text(title, x + 18, y + 16, width - 36, options.titleSize || 13, C.ink, "Helvetica-Bold");
  let cy = y + 46;
  lines.forEach((line) => {
    text(line, x + 18, cy, width - 36, options.bodySize || 10.5, options.bodyColor || C.muted);
    cy += doc.heightOfString(line, { width: width - 36 }) + 9;
  });
}

function stat(x, y, width, title, value, color, fill) {
  doc.roundedRect(x, y, width, 76, 10).fillAndStroke(fill, color);
  text(value, x + 16, y + 14, width - 32, 24, color, "Helvetica-Bold");
  text(title, x + 16, y + 49, width - 32, 10.5, C.ink, "Helvetica-Bold");
}

function bullets(items, x, y, width, color = C.teal, size = 10.7) {
  let cy = y;
  items.forEach((item) => {
    doc.circle(x, cy + 7, 3).fill(color);
    text(item, x + 15, cy, width - 15, size, C.ink);
    cy += doc.heightOfString(item, { width: width - 15 }) + 11;
  });
  return cy;
}

function flowBox(x, y, width, height, label, fill = C.tealSoft, stroke = C.teal) {
  doc.roundedRect(x, y, width, height, 9).fillAndStroke(fill, stroke);
  text(label, x + 10, y + 15, width - 20, 10.5, C.ink, "Helvetica-Bold", { align: "center" });
}

function arrow(x1, y1, x2, y2) {
  doc.strokeColor(C.muted).lineWidth(1.2).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 6;
  doc.path(`M ${x2} ${y2} L ${x2 - size * Math.cos(angle - Math.PI / 6)} ${y2 - size * Math.sin(angle - Math.PI / 6)} L ${x2 - size * Math.cos(angle + Math.PI / 6)} ${y2 - size * Math.sin(angle + Math.PI / 6)} Z`).fill(C.muted);
}

function table(x, y, widths, rows, headerFill = C.tealSoft) {
  let cy = y;
  rows.forEach((row, index) => {
    const height = Math.max(
      34,
      ...row.map((cell, i) => doc.heightOfString(String(cell), { width: widths[i] - 18 }) + 18)
    );
    let cx = x;
    row.forEach((cell, i) => {
      doc.rect(cx, cy, widths[i], height).fillAndStroke(index === 0 ? headerFill : C.white, C.line);
      text(
        String(cell),
        cx + 9,
        cy + 10,
        widths[i] - 18,
        index === 0 ? 10.3 : 9.8,
        C.ink,
        index === 0 ? "Helvetica-Bold" : "Helvetica",
        { lineGap: 2 }
      );
      cx += widths[i];
    });
    cy += height;
  });
  return cy;
}

function callout(x, y, width, title, body, color = C.teal, fill = C.tealSoft) {
  doc.roundedRect(x, y, width, 78, 10).fillAndStroke(fill, color);
  text(title, x + 18, y + 15, width - 36, 13, color, "Helvetica-Bold");
  text(body, x + 18, y + 39, width - 36, 10.5, C.ink);
}

// 1. Cover
page("TicketOps", "Restaurant Maintenance Ticket Management System");
doc.rect(0, 0, W, 210).fill(C.dark);
text("TicketOps", M, 72, 360, 38, C.white, "Helvetica-Bold");
text("Structured maintenance workflow for restaurants", M, 122, 470, 17, "#d8e5e1", "Helvetica");
text("Replacing WhatsApp chaos with ticket ownership, technician attendance, verification, alerts and actionable reports.", M, 154, 570, 12.5, "#bfd0cc");
stat(560, 72, 72, "Outlets", "4", C.teal, C.tealSoft);
stat(646, 72, 92, "Managers", "4", C.purple, C.purpleSoft);
stat(752, 72, 112, "Technicians", "4", C.green, C.greenSoft);

card(48, 260, 350, 130, "Core Objective", [
  "Create one official maintenance record for every issue.",
  "Improve response time, ownership, verification and business intelligence."
], { fill: C.white, accent: C.teal, titleSize: 15, bodySize: 11 });
card(430, 260, 360, 130, "Current Build Position", [
  "Web app, REST API, Supabase-ready schema, Android APK, iOS project and Flutter mobile foundation are already in place.",
  "Next work is production readiness."
], { fill: C.greenSoft, stroke: C.green, accent: C.green, titleSize: 15, bodySize: 11 });
callout(48, 425, 742, "Recommended Client Decision", "Approve a controlled pilot: Supabase connection, login, photo upload, deployment and one-outlet live test.", C.amber, C.amberSoft);

// 2. Executive summary
page("Executive Summary", "What has been built, why it matters, and what remains before pilot.");
stat(48, 152, 135, "Web App", "Built", C.teal, C.tealSoft);
stat(198, 152, 135, "Backend", "REST", C.green, C.greenSoft);
stat(348, 152, 135, "Database", "Ready", C.purple, C.purpleSoft);
stat(498, 152, 135, "Android", "APK", C.amber, C.amberSoft);
stat(648, 152, 135, "iOS", "Prepared", C.red, C.redSoft);

card(48, 260, 350, 185, "Business Value", [
  "Every issue has a ticket ID, owner, priority and current status.",
  "Admin can assign based on technician attendance and workload.",
  "Technicians must record blocked, resolved and reopened reasons.",
  "Managers verify whether work is actually complete.",
  "Reports convert daily maintenance activity into business visibility."
], { fill: C.white, accent: C.teal });
card(430, 260, 360, 185, "Before Production", [
  "Connect live Supabase project credentials.",
  "Add role-based login.",
  "Add photo upload and storage.",
  "Deploy backend/frontend.",
  "Run pilot QA with real outlet users."
], { fill: C.white, accent: C.amber });

// 3. Problem and impact
page("Problem And Business Impact", "WhatsApp is fast for communication, but weak as an operating system.");
card(48, 150, 230, 165, "WhatsApp Gaps", [
  "No official ticket ID.",
  "No clear owner.",
  "No SLA timer.",
  "No verification loop.",
  "No structured reporting."
], { fill: C.redSoft, stroke: C.red, accent: C.red });
card(306, 150, 230, 165, "Operational Pain", [
  "Repeated follow-ups.",
  "Missed or duplicated requests.",
  "Technician confusion.",
  "Admin becomes manual dispatcher.",
  "Managers escalate everything."
], { fill: C.amberSoft, stroke: C.amber, accent: C.amber });
card(564, 150, 230, 165, "Business Risk", [
  "Delayed repairs.",
  "Food safety exposure.",
  "Customer-facing disruption.",
  "Higher repair cost.",
  "No insight into repeat failures."
], { fill: C.white, accent: C.purple });

heading("Failure Chain", 48, 355, 160);
const fY = 410;
flowBox(48, fY, 110, 54, "Issue found");
flowBox(186, fY, 110, 54, "WhatsApp sent", C.amberSoft, C.amber);
flowBox(324, fY, 110, 54, "Context lost", C.redSoft, C.red);
flowBox(462, fY, 110, 54, "Manual chase");
flowBox(600, fY, 110, 54, "No report", C.redSoft, C.red);
arrow(158, fY + 27, 186, fY + 27);
arrow(296, fY + 27, 324, fY + 27);
arrow(434, fY + 27, 462, fY + 27);
arrow(572, fY + 27, 600, fY + 27);

// 4. Operating workflow
page("TicketOps Operating Workflow", "A controlled path from issue creation to closure or reopen.");
const x = [48, 205, 362, 519, 676];
const y1 = 150;
const y2 = 255;
const y3 = 360;
[
  [x[0], y1, "Manager creates ticket"],
  [x[1], y1, "Ticket ID generated"],
  [x[2], y1, "Priority calculated"],
  [x[3], y1, "Attendance checked"],
  [x[4], y1, "Admin assigns"],
  [x[0], y2, "Technician accepts"],
  [x[1], y2, "Work starts"],
  [x[2], y2, "Update or block"],
  [x[3], y2, "Resolve with reason"],
  [x[4], y2, "Manager verifies"]
].forEach(([a, b, label]) => flowBox(a, b, 122, 56, label));
for (let i = 0; i < 4; i += 1) arrow(x[i] + 122, y1 + 28, x[i + 1], y1 + 28);
arrow(x[4] + 61, y1 + 56, x[4] + 61, y2);
for (let i = 4; i > 0; i -= 1) arrow(x[i], y2 + 28, x[i - 1] + 122, y2 + 28);

card(48, y3, 230, 125, "Close Path", [
  "Manager approves resolution.",
  "Ticket becomes closed.",
  "History remains available for reporting."
], { fill: C.greenSoft, stroke: C.green, accent: C.green });
card(306, y3, 230, 125, "Reopen Path", [
  "Manager rejects or issue returns.",
  "Reopen reason is mandatory.",
  "Admin reviews and reassigns."
], { fill: C.amberSoft, stroke: C.amber, accent: C.amber });
card(564, y3, 230, 125, "Control Rule", [
  "Blocked, resolved and reopened tickets require reasons.",
  "No silent status changes."
], { fill: C.white, accent: C.teal });

// 5. Roles and accountability
page("Role-Based Accountability", "Each user sees the work they need to perform, not a generic ticketing maze.");
table(48, 150, [130, 300, 330], [
  ["Role", "Primary Actions", "Accountability"],
  ["Manager", "Create ticket, add issue details, approve or reopen resolution", "Confirms whether the outlet issue is actually fixed"],
  ["Admin", "Assign, reassign, override, monitor alerts, review blocked/reopened work", "Owns operational control and prioritization"],
  ["Technician", "Check in, acknowledge, start, block, resolve", "Owns execution and must provide reasons/proof"],
  ["System", "Ticket ID, priority, history, alerts, reports", "Preserves audit trail and business intelligence"]
], C.tealSoft);
callout(48, 400, 360, "Design Principle", "Make the correct workflow faster and clearer than WhatsApp follow-up.", C.teal, C.tealSoft);
callout(430, 400, 360, "Behavioral Rule", "No ticket ID means no official maintenance assignment.", C.red, C.redSoft);

// 6. Attendance-aware assignment
page("Attendance-Aware Assignment", "Maintenance work should be assigned to people who are actually available.");
table(48, 145, [160, 300, 300], [
  ["Technician Status", "Assignment Behavior", "Business Reason"],
  ["Present", "Eligible for normal assignment", "Available to accept work"],
  ["Busy", "Admin can assign with workload awareness", "Prevents silent overload"],
  ["Break / Leave / Absent / Off Duty", "Skipped by normal assignment", "Stops dispatching to unavailable technicians"],
  ["Emergency Available", "Eligible for critical work only", "Keeps urgent issues moving"],
  ["Admin Override", "Allowed with visible reason", "Keeps flexibility without losing accountability"]
], C.greenSoft);
heading("Smart Assignment Logic", 48, 383, 260);
flowBox(48, 430, 125, 52, "New ticket");
flowBox(198, 430, 125, 52, "Check priority");
flowBox(348, 430, 125, 52, "Filter attendance");
flowBox(498, 430, 125, 52, "Match skill");
flowBox(648, 430, 125, 52, "Suggest technician");
arrow(173, 456, 198, 456);
arrow(323, 456, 348, 456);
arrow(473, 456, 498, 456);
arrow(623, 456, 648, 456);

// 7. Architecture and data
page("System Architecture", "Practical stack for a small restaurant operations team.");
flowBox(55, 165, 120, 56, "Web App");
flowBox(55, 260, 120, 56, "Android APK");
flowBox(55, 355, 120, 56, "iOS Project");
flowBox(335, 260, 145, 70, "REST API Backend", C.greenSoft, C.green);
flowBox(660, 205, 125, 56, "Supabase", C.purpleSoft, C.purple);
flowBox(660, 340, 125, 56, "JSON Demo", C.amberSoft, C.amber);
arrow(175, 193, 335, 278);
arrow(175, 288, 335, 295);
arrow(175, 383, 335, 315);
arrow(480, 282, 660, 233);
arrow(480, 314, 660, 368);

card(48, 445, 235, 80, "Frontend Rule", [
  "Web, Android and iOS call the same REST API."
], { fill: C.tealSoft, stroke: C.teal, accent: C.teal });
card(305, 445, 235, 80, "Backend Rule", [
  "API owns validation, workflow and service credentials."
], { fill: C.greenSoft, stroke: C.green, accent: C.green });
card(562, 445, 235, 80, "Data Rule", [
  "Supabase is production storage. JSON is demo fallback."
], { fill: C.purpleSoft, stroke: C.purple, accent: C.purple });

// 8. Build status
page("Current Build Status", "What exists today and what it means for the client.");
table(48, 145, [140, 105, 260, 255], [
  ["Area", "Status", "Current State", "Next Action"],
  ["Web App", "Built", "Manager/Admin/Technician/Reports flows exist", "Pilot test with real users"],
  ["REST API", "Built", "Workflow validation and storage adapter exist", "Deploy production backend"],
  ["Supabase", "Ready", "Schema and backend adapter prepared", "Connect credentials and seed data"],
  ["Android", "APK Ready", "Debug APK and Flutter APK exist", "Test with reachable API URL"],
  ["iOS", "Prepared", "Project exists in repo", "Build/sign on macOS with Xcode"],
  ["Docs", "Built", "Workflow, API, mobile and deployment docs exist", "Use for client/developer handoff"]
], C.tealSoft);
callout(48, 445, 742, "Current Practical Status", "The product foundation is ready for pilot preparation. It is not yet production-ready until authentication, live Supabase, photo uploads, deployment and QA are completed.", C.amber, C.amberSoft);

// 9. Roadmap
page("Roadmap To Pilot", "Recommended sequence to move safely from prototype to live usage.");
table(48, 145, [90, 300, 370], [
  ["Phase", "Focus", "Outcome"],
  ["1", "Connect Supabase and confirm outlet/technician master data", "Real database foundation"],
  ["2", "Add role login and photo upload", "Pilot-grade accountability"],
  ["3", "Deploy backend/web and configure APK API URL", "Live web + Android testing"],
  ["4", "Add SLA jobs, notifications and improved reporting", "Operational control"],
  ["5", "Use macOS/Xcode for final iOS signing", "Apple app readiness"]
], C.purpleSoft);
card(48, 390, 350, 115, "Pilot Recommendation", [
  "Start with one outlet and one technician.",
  "Validate ticket creation, assignment, blocked reasons, reopen behavior and manager verification before full rollout."
], { fill: C.greenSoft, stroke: C.green, accent: C.green });
card(430, 390, 360, 115, "Client Inputs Needed", [
  "Supabase credentials, final user list, technician skills, ticket categories, hosting decision and Android/iOS rollout preference."
], { fill: C.white, accent: C.teal });

// 10. Go ahead
page("Client Go-Ahead", "A clear approval point for the next stage.");
card(48, 155, 742, 115, "Recommended Approval", [
  "Approve TicketOps pilot preparation using the current system foundation.",
  "Next stage: Supabase connection, login, photo uploads, deployment, Android testing and one-outlet pilot QA."
], { fill: C.greenSoft, stroke: C.green, accent: C.green, titleSize: 16, bodySize: 12 });
card(48, 310, 350, 150, "Why Now", [
  "The operational workflow is already mapped and implemented.",
  "The app, API, Android build and database model are in place.",
  "The remaining work is production readiness, not concept validation."
], { fill: C.white, accent: C.teal, titleSize: 15, bodySize: 11 });
card(430, 310, 360, 150, "Decision Required", [
  "Proceed with controlled pilot scope.",
  "Connect Supabase.",
  "Deploy backend/frontend.",
  "Begin Android/web live testing.",
  "Plan iOS build on macOS when pilot flow is stable."
], { fill: C.amberSoft, stroke: C.amber, accent: C.amber, titleSize: 15, bodySize: 11 });

doc.end();

console.log(outPath);
