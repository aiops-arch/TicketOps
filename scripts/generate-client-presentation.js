const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outPath = path.join(__dirname, "..", "TicketOps_Client_Presentation.pdf");
const doc = new PDFDocument({
  size: "A4",
  margin: 40,
  info: {
    Title: "TicketOps Client Presentation",
    Author: "TicketOps",
    Subject: "Restaurant Maintenance Ticket Management System"
  }
});

doc.pipe(fs.createWriteStream(outPath));

const C = {
  ink: "#17211f",
  muted: "#687570",
  hair: "#dbe4df",
  paper: "#f7f9f8",
  dark: "#162320",
  teal: "#2e6f73",
  teal2: "#e8f3f3",
  green: "#407a57",
  green2: "#edf7ef",
  amber: "#b36a2e",
  amber2: "#fff2dc",
  red: "#b8443e",
  red2: "#fde9e7",
  purple: "#67598c",
  purple2: "#f0edf7",
  white: "#ffffff"
};

let pageNo = 0;

function addPage(title, subtitle = "") {
  if (pageNo > 0) doc.addPage();
  pageNo += 1;
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.paper);
  doc.rect(0, 0, doc.page.width, 36).fill(C.dark);
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(10).text("TicketOps", 40, 13);
  doc.font("Helvetica").fontSize(8).text(`Client Deck | ${pageNo}`, 460, 13, { width: 92, align: "right" });

  if (title) {
    doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(21).text(title, 40, 58);
    if (subtitle) doc.fillColor(C.muted).font("Helvetica").fontSize(9.5).text(subtitle, 40, 86, { width: 510 });
    doc.moveTo(40, 112).lineTo(555, 112).strokeColor(C.hair).stroke();
    doc.y = 132;
  }
}

function text(t, x = 40, y = doc.y, w = 515, size = 9.2, color = C.ink, font = "Helvetica") {
  doc.fillColor(color).font(font).fontSize(size).text(t, x, y, { width: w, lineGap: 2.5 });
}

function title(t, y = doc.y) {
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(12.5).text(t, 40, y);
  doc.y += 8;
}

function pill(x, y, w, label, color = C.teal, fill = C.teal2) {
  doc.roundedRect(x, y, w, 26, 13).fillAndStroke(fill, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(8.8).text(label, x + 10, y + 8, { width: w - 20, align: "center" });
}

function stat(x, y, label, value, color = C.teal, fill = C.teal2) {
  doc.roundedRect(x, y, 118, 66, 8).fillAndStroke(fill, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(21).text(value, x + 12, y + 12);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8).text(label, x + 12, y + 42, { width: 94 });
}

function box(x, y, w, h, heading, lines, fill = C.white, stroke = C.hair) {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(fill, stroke);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(10).text(heading, x + 12, y + 12, { width: w - 24 });
  let cy = y + 32;
  doc.font("Helvetica").fontSize(8.4).fillColor(C.muted);
  lines.forEach((line) => {
    doc.text(line, x + 12, cy, { width: w - 24 });
    cy += 13;
  });
}

function bullets(items, x = 50, w = 485) {
  doc.font("Helvetica").fontSize(9).fillColor(C.ink);
  items.forEach((item) => {
    doc.circle(x, doc.y + 5, 2).fill(C.teal);
    doc.fillColor(C.ink).text(item, x + 12, doc.y - 2, { width: w, lineGap: 2 });
    doc.moveDown(0.45);
  });
}

function table(x, y, widths, rows, header = C.teal2) {
  let cy = y;
  rows.forEach((row, idx) => {
    const h = Math.max(25, ...row.map((cell, i) => doc.heightOfString(String(cell), { width: widths[i] - 12 }) + 13));
    let cx = x;
    row.forEach((cell, i) => {
      doc.rect(cx, cy, widths[i], h).fillAndStroke(idx === 0 ? header : C.white, C.hair);
      doc.fillColor(C.ink).font(idx === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(8.2)
        .text(String(cell), cx + 6, cy + 7, { width: widths[i] - 12, lineGap: 1.5 });
      cx += widths[i];
    });
    cy += h;
  });
  doc.y = cy + 12;
}

function flow(x, y, w, h, label, fill = C.teal2, stroke = C.teal) {
  doc.roundedRect(x, y, w, h, 7).fillAndStroke(fill, stroke);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.4).text(label, x + 8, y + 10, { width: w - 16, align: "center" });
}

function arrow(x1, y1, x2, y2) {
  doc.strokeColor(C.muted).lineWidth(0.8).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 4.5;
  doc.path(`M ${x2} ${y2} L ${x2 - s * Math.cos(a - Math.PI / 6)} ${y2 - s * Math.sin(a - Math.PI / 6)} L ${x2 - s * Math.cos(a + Math.PI / 6)} ${y2 - s * Math.sin(a + Math.PI / 6)} Z`).fill(C.muted);
}

function note(t) {
  doc.roundedRect(40, 730, 515, 42, 8).fillAndStroke(C.white, C.hair);
  text(t, 54, 743, 487, 8.3, C.muted);
}

// 1 Cover
addPage();
doc.rect(0, 0, doc.page.width, 255).fill(C.dark);
doc.fillColor(C.white).font("Helvetica-Bold").fontSize(33).text("TicketOps", 42, 78);
doc.font("Helvetica").fontSize(14).fillColor("#d8e4e1").text("Maintenance Ticket Management System", 42, 121);
doc.font("Helvetica").fontSize(9.6).fillColor("#bdcdc9")
  .text("Client presentation: workflow, operating model, product progress and pilot roadmap.", 42, 150, { width: 420 });
pill(42, 190, 90, "4 Outlets", C.teal, C.teal2);
pill(142, 190, 105, "4 Managers", C.purple, C.purple2);
pill(257, 190, 115, "4 Technicians", C.green, C.green2);
pill(382, 190, 75, "1 Admin", C.amber, C.amber2);
box(42, 325, 511, 110, "Purpose", [
  "Replace WhatsApp maintenance chaos with a controlled ticket workflow.",
  "Improve response time, ownership, verification and business visibility."
], C.white, C.hair);
box(42, 465, 511, 92, "Current Position", [
  "Working web app, REST API, Supabase-ready model, Android APK, iOS project preparation and documentation are complete.",
  "Next focus: live Supabase, authentication, photo uploads, deployment and pilot testing."
], C.green2, C.green);
note("Recommended client decision: approve a focused pilot using web + Android + Supabase before full rollout.");

// 2 Executive
addPage("Executive Snapshot", "A compact view of what exists and what it enables.");
stat(40, 145, "Web App", "Built", C.teal, C.teal2);
stat(172, 145, "Backend", "REST", C.green, C.green2);
stat(304, 145, "Database", "Ready", C.purple, C.purple2);
stat(436, 145, "Android", "APK", C.amber, C.amber2);
title("What TicketOps Gives The Business", 250);
bullets([
  "One official record for every maintenance issue.",
  "Clear ownership across manager, admin and technician.",
  "Attendance-aware assignment instead of blind dispatching.",
  "Mandatory reasons for blocked, resolved and reopened work.",
  "Operational alerts and reports for management visibility."
]);
title("What Is Still Needed Before Production", doc.y + 12);
bullets([
  "Connect live Supabase credentials.",
  "Add authentication and role-based login.",
  "Add photo upload/storage for issue and resolution proof.",
  "Deploy backend/frontend and test with real users.",
  "Build signed Android release and final iOS IPA on macOS."
]);

// 3 Problem
addPage("Problem And Business Risk", "Why informal maintenance communication breaks down.");
box(40, 145, 245, 120, "Current WhatsApp Pattern", [
  "Issue reported in chat",
  "Admin/technician may miss context",
  "No reliable SLA or owner",
  "Follow-ups happen manually",
  "Proof and history are fragmented"
], C.red2, C.red);
box(310, 145, 245, 120, "Business Impact", [
  "Delayed repairs",
  "Repeated issues not visible",
  "Manager frustration",
  "Technician accountability gaps",
  "No usable maintenance intelligence"
], C.amber2, C.amber);
title("Core Diagnosis", 315);
text("The business does not only need messaging. It needs a maintenance operating record: ticket ID, owner, priority, attendance-aware assignment, proof, verification and reporting.", 40, doc.y, 515, 11, C.ink, "Helvetica-Bold");
title("Failure Chain", 410);
flow(45, 455, 90, 42, "Issue");
flow(160, 455, 90, 42, "WhatsApp", C.amber2, C.amber);
flow(275, 455, 90, 42, "No Owner", C.red2, C.red);
flow(390, 455, 90, 42, "Manual Follow-up");
arrow(135, 476, 160, 476);
arrow(250, 476, 275, 476);
arrow(365, 476, 390, 476);
note("The system response: every issue becomes a ticket with state, owner, timeline and verification.");

// 4 Solution
addPage("Solution Model", "A structured but lightweight operating workflow.");
title("Operating Rule");
text("No ticket ID = no official maintenance work.", 40, doc.y, 515, 15, C.red, "Helvetica-Bold");
doc.y += 18;
box(40, 200, 245, 105, "Manager", ["Create ticket quickly", "Track assigned work", "Approve or reopen"], C.teal2, C.teal);
box(310, 200, 245, 105, "Admin", ["View all work", "Assign/reassign", "Monitor blocked and critical tickets"], C.purple2, C.purple);
box(40, 335, 245, 105, "Technician", ["Check in", "Acknowledge/start", "Block or resolve with reason"], C.green2, C.green);
box(310, 335, 245, 105, "System", ["Ticket ID", "Priority, history, alerts", "Reports and audit trail"], C.white, C.hair);
title("Design Principle", 500);
bullets([
  "Fast for low-tech users.",
  "Mobile-first.",
  "Photo/proof-ready.",
  "Small-team practical: no over-engineered enterprise stack."
]);

// 5 Workflow
addPage("End-To-End Workflow", "From issue creation to closure or reopen.");
const fx = [42, 207, 372];
const fy = [150, 245, 340, 435];
[
  [fx[0], fy[0], "Manager reports issue"],
  [fx[1], fy[0], "Ticket ID created"],
  [fx[2], fy[0], "Priority set"],
  [fx[0], fy[1], "Attendance checked"],
  [fx[1], fy[1], "Admin assigns"],
  [fx[2], fy[1], "Technician accepts"],
  [fx[0], fy[2], "Work starts"],
  [fx[1], fy[2], "Blocked / updated"],
  [fx[2], fy[2], "Resolved with reason"],
  [fx[0], fy[3], "Manager verifies"],
  [fx[1], fy[3], "Closed"],
  [fx[2], fy[3], "Reopened if rejected"]
].forEach(([x, y, t]) => flow(x, y, 130, 44, t));
[
  [172,172,207,172],[337,172,372,172],[437,194,437,245],[372,267,337,267],[207,267,172,267],
  [107,289,107,340],[172,362,207,362],[337,362,372,362],[437,384,437,435],[372,457,337,457],[207,457,172,457]
].forEach((a) => arrow(...a));
note("The flow is designed for real restaurant operations: quick capture, controlled assignment, technician execution, manager verification and reopen handling.");

// 6 Attendance
addPage("Attendance-Aware Assignment", "Technician availability is part of dispatch logic.");
table(40, 150, [145, 370], [
  ["Availability", "Assignment Behavior"],
  ["Present", "Eligible for normal assignment"],
  ["Busy", "Admin can assign with workload awareness"],
  ["Break / Leave / Absent / Off Duty", "Skipped by normal assignment"],
  ["Emergency Available", "Can be used for critical work"],
  ["Admin Override", "Allowed only with visible reason"]
], C.green2);
title("Smart Assignment Logic", doc.y + 8);
flow(50, doc.y + 20, 105, 42, "New Ticket");
flow(180, doc.y + 20, 105, 42, "Check Attendance");
flow(310, doc.y + 20, 105, 42, "Match Skill");
flow(440, doc.y + 20, 105, 42, "Suggest Tech");
arrow(155, doc.y + 41, 180, doc.y + 41);
arrow(285, doc.y + 41, 310, doc.y + 41);
arrow(415, doc.y + 41, 440, doc.y + 41);
doc.y += 95;
bullets([
  "Unstarted work returns to admin queue if assigned technician becomes unavailable.",
  "In-progress work requires admin decision: pause, wait or reassign.",
  "Critical tickets should not wait silently because one technician is unavailable."
]);

// 7 Build status
addPage("Current Build Status", "What has already been produced.");
table(40, 145, [165, 105, 245], [
  ["Area", "Status", "Client Meaning"],
  ["Web app", "Built", "Core flows can be viewed and tested"],
  ["REST API", "Built", "Backend rules and data operations exist"],
  ["Supabase", "Ready", "Schema and adapter exist; credentials needed"],
  ["Android", "APK built", "Android testing can start"],
  ["iOS", "Prepared", "Final Apple build requires macOS/Xcode"],
  ["Flutter mobile", "Added", "Native mobile foundation exists"],
  ["Docs", "Built", "Workflow, API, mobile and deployment notes exist"]
], C.teal2);
title("Local Deliverables", doc.y + 8);
bullets([
  "TicketOps-debug.apk",
  "TicketOps-Flutter-release.apk",
  "TicketOps_Client_Presentation.pdf"
]);

// 8 Architecture
addPage("Technical Architecture", "Simple stack, clear ownership, production-ready direction.");
flow(45, 165, 110, 44, "Web App");
flow(45, 250, 110, 44, "Android APK");
flow(45, 335, 110, 44, "iOS Project");
flow(238, 250, 120, 58, "REST API", C.green2, C.green);
flow(445, 205, 110, 44, "Supabase", C.purple2, C.purple);
flow(445, 320, 110, 44, "JSON Demo", C.amber2, C.amber);
arrow(155,187,238,270);
arrow(155,272,238,279);
arrow(155,357,238,300);
arrow(358,270,445,227);
arrow(358,300,445,342);
title("Architecture Rules", 440);
bullets([
  "Frontend and mobile apps call the REST API.",
  "Supabase service role key stays backend-only.",
  "REST API owns workflow validation.",
  "JSON fallback is for demo/testing only."
]);

// 9 Roadmap
addPage("Roadmap To Pilot", "Recommended path from current build to live trial.");
table(40, 145, [85, 235, 195], [
  ["Phase", "Focus", "Outcome"],
  ["1", "Connect Supabase and confirm master data", "Real database ready"],
  ["2", "Add role login and photo uploads", "Pilot-grade workflow"],
  ["3", "Deploy backend/web and configure APK API URL", "Live Android/web testing"],
  ["4", "Add SLA jobs, notifications and reports", "Operational control"],
  ["5", "Mac/Xcode iOS signing", "Apple app readiness"]
], C.purple2);
title("Pilot Recommendation", doc.y + 10);
text("Start with one outlet and one technician. Validate behavior, response time, blocked/reopen handling and manager approval before rolling out to all outlets.", 40, doc.y, 515, 10.5, C.ink, "Helvetica-Bold");

// 10 Decision
addPage("Client Go-Ahead", "Decisions needed to move into pilot.");
box(40, 145, 515, 95, "Recommended Approval", [
  "Approve TicketOps pilot preparation using the current foundation.",
  "Next scope: Supabase connection, login, photo uploads, deployment and pilot QA."
], C.green2, C.green);
title("Inputs Needed From Client", 285);
bullets([
  "Supabase project credentials or approval to create/configure them.",
  "Final outlet names, users and technician skills.",
  "Decision on Android/web pilot sequence.",
  "Hosting choice: Render/Vercel/Supabase or alternate stack.",
  "Mac/cloud Mac access for final iOS build when ready."
]);
title("Bottom Line", 525);
text("TicketOps is ready to move from build foundation into controlled pilot preparation. The core workflow is in place; the next work is production readiness.", 40, doc.y, 515, 13, C.teal, "Helvetica-Bold");

doc.end();
console.log(outPath);
