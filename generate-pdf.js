const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const logoBytes = fs.readFileSync(path.join(__dirname, 'www', 'assets', 'ticketops-logo-tight.png'));
const logoB64 = 'data:image/png;base64,' + logoBytes.toString('base64');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{
  width:794px;height:1123px;overflow:hidden;
  font-family:"Space Grotesk",system-ui,sans-serif;
  font-size:10px;color:#0e1c1a;background:#fff;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}

/* ─── PAGE ─── */
.page{
  width:794px;height:1123px;
  display:grid;
  grid-template-rows:100px 1fr 90px 36px;
  overflow:hidden;
}

/* ─── HEADER ─── */
.hdr{
  display:grid;
  grid-template-columns:auto 1fr auto;
  align-items:center;gap:20px;
  padding:0 32px;
  background:linear-gradient(135deg,#1d5550 0%,#2f756f 50%,#38918b 100%);
  position:relative;overflow:hidden;
}
.hdr::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse at 70% 0%,rgba(61,184,216,0.25),transparent 55%),
    radial-gradient(ellipse at 100% 100%,rgba(255,255,255,0.05),transparent 40%);
}
.hdr-logo-wrap{
  position:relative;z-index:2;
  background:#fff;border-radius:10px;
  padding:5px 10px;
  box-shadow:0 2px 10px rgba(0,0,0,0.18);
  display:flex;align-items:center;justify-content:center;
}
.hdr-logo-wrap img{width:82px;height:48px;object-fit:contain;display:block;}
.hdr-copy{position:relative;z-index:2;}
.hdr-eyebrow{
  font-size:8.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;
  color:rgba(184,238,248,0.85);margin-bottom:4px;
  display:flex;align-items:center;gap:6px;
}
.hdr-eyebrow::before{content:"";width:5px;height:5px;border-radius:50%;background:#3db8d8;box-shadow:0 0 6px rgba(61,184,216,0.7);}
.hdr-title{
  font-family:"Fraunces",Georgia,serif;font-size:30px;font-weight:700;
  line-height:1.0;color:#fff;letter-spacing:-0.5px;
}
.hdr-title em{font-style:normal;color:#b8eef8;}
.hdr-sub{
  font-size:10px;font-weight:500;color:rgba(218,242,245,0.82);
  line-height:1.45;margin-top:5px;max-width:340px;
}
.hdr-badges{position:relative;z-index:2;display:flex;flex-direction:column;gap:6px;align-items:flex-end;}
.hdr-badge{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:999px;
  border:1px solid rgba(61,184,216,0.4);background:rgba(255,255,255,0.08);
  font-size:8px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
  color:#b8eef8;white-space:nowrap;
}
.hdr-badge b{color:#fff;}

/* ─── BODY ─── */
.body{display:grid;grid-template-columns:1fr 1fr;overflow:hidden;}

/* ─── COLUMNS ─── */
.col{display:flex;flex-direction:column;justify-content:space-between;padding:22px 22px 18px 30px;overflow:hidden;}
.col-r{padding-left:22px;padding-right:30px;background:#f4faf8;border-left:1px solid #d8eae6;}

/* ─── SECTION ─── */
.sec{flex-shrink:0;}
.sec-label{display:flex;align-items:center;gap:6px;margin-bottom:8px;}
.bar{width:3px;height:14px;border-radius:2px;flex-shrink:0;}
.bar-red{background:#b2645d;} .bar-teal{background:#2f756f;}
.bar-cyan{background:#3db8d8;} .bar-blue{background:#4a78a0;}
.sec-kicker{font-size:8.5px;font-weight:800;letter-spacing:0.11em;text-transform:uppercase;color:#6a8480;}
.sec-title{font-family:"Fraunces",Georgia,serif;font-size:16px;font-weight:700;color:#0e1c1a;line-height:1.1;margin-bottom:8px;}
.sec-body{font-size:9.5px;font-weight:500;color:#2d4a46;line-height:1.55;}

/* ─── DIVIDER ─── */
.div{height:1px;background:#d8eae6;margin:16px 0;flex-shrink:0;}

/* ─── PROBLEM LIST ─── */
.prob-list{display:flex;flex-direction:column;gap:6px;margin-top:8px;}
.prob{
  display:grid;grid-template-columns:18px 1fr;gap:6px;align-items:start;
  padding:7px 10px;border-radius:7px;
  border-left:2.5px solid #b2645d;background:rgba(178,100,93,0.045);
}
.prob-ico{font-size:11px;line-height:1.4;}
.prob-txt{font-size:9px;font-weight:600;color:#2d4a46;line-height:1.45;}
.prob-txt strong{display:block;font-size:9.5px;color:#a0504a;margin-bottom:1px;}

/* ─── STATUS CHAIN ─── */
.chain{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:8px;}
.snode{padding:4px 7px;border-radius:5px;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}
.sarr{font-size:8px;color:#8aaba6;}
.s1{background:rgba(74,120,160,0.12);color:#4a78a0;}
.s2{background:rgba(61,184,216,0.12);color:#1c8db0;}
.s3{background:rgba(196,147,56,0.12);color:#8a6218;}
.s4{background:rgba(47,117,111,0.12);color:#2f756f;}
.s5{background:rgba(178,100,93,0.12);color:#a0504a;}
.s6{background:rgba(122,107,146,0.12);color:#5a4d72;}
.s7{background:rgba(58,138,104,0.12);color:#3a8a68;}

.hbox{
  padding:11px 13px;border-radius:8px;
  border-left:3px solid #2f756f;
  background:linear-gradient(135deg,rgba(47,117,111,0.06),rgba(61,184,216,0.03));
  margin-top:9px;
}
.hbox p{font-size:9.5px;font-weight:500;color:#2d4a46;line-height:1.55;}
.hbox strong{color:#1d5550;font-weight:700;}

/* ─── FLOW STEPS ─── */
.flow{display:flex;flex-direction:column;gap:0;margin-top:8px;position:relative;}
.flow::before{
  content:"";position:absolute;left:11px;top:20px;bottom:20px;width:1px;
  background:linear-gradient(180deg,#3db8d8,#2f756f,rgba(47,117,111,0.15));
}
.fstep{display:grid;grid-template-columns:24px 1fr;gap:9px;align-items:start;padding:6px 0;}
.fdot{
  width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:800;flex-shrink:0;position:relative;z-index:1;color:#fff;
}
.d1{background:#2f756f;} .d2{background:#3db8d8;} .d3{background:#4a78a0;}
.d4{background:#c49338;} .d5{background:#3a8a68;}
.fstep-body strong{display:block;font-size:9.5px;font-weight:700;color:#0e1c1a;margin-bottom:2px;}
.fstep-body span{font-size:8.5px;font-weight:500;color:#6a8480;line-height:1.45;}

/* ─── MODULE GRID ─── */
.mods{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;}
.mod{padding:9px 11px;border-radius:8px;border:1px solid #d8eae6;background:#fff;}
.mod-ico{font-size:13px;line-height:1;margin-bottom:4px;}
.mod-name{font-size:9px;font-weight:800;color:#0e1c1a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;}
.mod-desc{font-size:8px;font-weight:500;color:#6a8480;line-height:1.4;}

/* ─── BOTTOM STRIP ─── */
.strip{
  display:grid;grid-template-columns:auto 1px 1fr;
  gap:0;align-items:center;
  padding:0 32px;
  border-top:1px solid #d0e8e4;
  background:linear-gradient(135deg,rgba(47,117,111,0.04),rgba(61,184,216,0.02));
}
.strip-roles{display:flex;align-items:center;gap:7px;padding-right:24px;}
.strip-label{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#8aaba6;margin-right:4px;}
.chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;font-size:8.5px;font-weight:700;}
.chip-dot{width:4px;height:4px;border-radius:50%;}
.c1{background:rgba(47,117,111,0.1);color:#1d5550;border:1px solid rgba(47,117,111,0.22);}
.c1 .chip-dot{background:#2f756f;}
.c2{background:rgba(58,138,104,0.09);color:#2a6e4e;border:1px solid rgba(58,138,104,0.2);}
.c2 .chip-dot{background:#3a8a68;}
.c3{background:rgba(61,184,216,0.08);color:#1f7a9a;border:1px solid rgba(61,184,216,0.2);}
.c3 .chip-dot{background:#3db8d8;}
.c4{background:rgba(196,147,56,0.09);color:#8a6218;border:1px solid rgba(196,147,56,0.2);}
.c4 .chip-dot{background:#c49338;}
.strip-sep{width:1px;height:48px;background:#d0e8e4;}
.strip-outcomes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-left:24px;}
.out{padding:7px 10px;border-radius:7px;text-align:center;}
.out-a{background:rgba(47,117,111,0.07);border:1px solid rgba(47,117,111,0.16);}
.out-b{background:rgba(61,184,216,0.06);border:1px solid rgba(61,184,216,0.18);}
.out-c{background:rgba(58,138,104,0.06);border:1px solid rgba(58,138,104,0.16);}
.out-num{display:block;font-family:"Fraunces",Georgia,serif;font-size:22px;font-weight:700;line-height:1;margin-bottom:3px;}
.out-a .out-num{color:#2f756f;} .out-b .out-num{color:#3db8d8;} .out-c .out-num{color:#3a8a68;}
.out-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;line-height:1.35;}
.out-a .out-lbl{color:#2f756f;} .out-b .out-lbl{color:#2a9ab8;} .out-c .out-lbl{color:#3a8a68;}

/* ─── FOOTER ─── */
.ftr{
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;
  padding:0 32px;border-top:1px solid #e8f2f0;
  background:#fff;
}
.ftr-l,.ftr-r{font-size:7.5px;font-weight:600;color:#8aaba6;}
.ftr-r{text-align:right;}
.ftr-c{display:flex;align-items:center;gap:5px;justify-content:center;}
.ftr-dot{width:4px;height:4px;border-radius:50%;background:#3db8d8;}
.ftr-brand{font-family:"Fraunces",Georgia,serif;font-size:10px;font-weight:700;color:#1d5550;}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <header class="hdr">
    <div class="hdr-logo-wrap">
      <img src="${logoB64}" alt="TicketOps">
    </div>
    <div class="hdr-copy">
      <div class="hdr-eyebrow">Field Operations Intelligence Platform</div>
      <h1 class="hdr-title">TicketOps <em>Flow</em></h1>
      <p class="hdr-sub">The command layer between a broken asset and a closed ticket — designed for multi-outlet food service and retail operations.</p>
    </div>
    <div class="hdr-badges">
      <div class="hdr-badge"><b>8</b> Purpose-Built Modules</div>
      <div class="hdr-badge"><b>4</b> Role-Based Workspaces</div>
      <div class="hdr-badge"><b>Live</b> Real-Time Command</div>
    </div>
  </header>

  <!-- BODY -->
  <div class="body">

    <!-- LEFT COLUMN -->
    <div class="col">

      <div class="sec">
        <div class="sec-label"><div class="bar bar-red"></div><span class="sec-kicker">The Problem — Before TicketOps</span></div>
        <h2 class="sec-title">Operations ran on chaos</h2>
        <p class="sec-body">Multi-outlet businesses had no structured way to report, assign, and close equipment failures. Issues lived in WhatsApp threads and vanished within hours.</p>
        <div class="prob-list">
          <div class="prob">
            <span class="prob-ico">💬</span>
            <div class="prob-txt"><strong>No Accountability Trail</strong>Issues reported on WhatsApp had no owner, no timestamp, no follow-up — they disappeared in the scroll.</div>
          </div>
          <div class="prob">
            <span class="prob-ico">🔧</span>
            <div class="prob-txt"><strong>Blind Technician Dispatch</strong>Admins guessed availability. Technicians arrived without context, priority, or assigned scope.</div>
          </div>
          <div class="prob">
            <span class="prob-ico">📋</span>
            <div class="prob-txt"><strong>Zero Preventive Maintenance</strong>Gas valves, freezer temps, fire extinguishers — checked from memory or skipped entirely.</div>
          </div>
          <div class="prob">
            <span class="prob-ico">🏪</span>
            <div class="prob-txt"><strong>No Cross-Outlet Visibility</strong>A P1 crisis at one location while another had idle technicians — completely invisible to the admin.</div>
          </div>
          <div class="prob">
            <span class="prob-ico">📊</span>
            <div class="prob-txt"><strong>No Closure Evidence</strong>No photos, no status chain, no audit trail. Managers could not verify if work was actually done.</div>
          </div>
        </div>
      </div>

      <div class="div"></div>

      <div class="sec">
        <div class="sec-label"><div class="bar bar-cyan"></div><span class="sec-kicker">Ticket Lifecycle — End to End</span></div>
        <h2 class="sec-title">Every issue, tracked to closure</h2>
        <div class="chain">
          <span class="snode s1">New</span><span class="sarr">→</span>
          <span class="snode s2">Assigned</span><span class="sarr">→</span>
          <span class="snode s3">Acknowledged</span><span class="sarr">→</span>
          <span class="snode s4">In Progress</span><span class="sarr">→</span>
          <span class="snode s5">Blocked</span><span class="sarr">→</span>
          <span class="snode s6">Verification</span><span class="sarr">→</span>
          <span class="snode s7">Closed</span>
        </div>
        <div class="hbox">
          <p>Every status change is <strong>timestamped, role-gated, and photo-evidenced</strong> where required. P1 food safety issues mandate photos at creation. Managers hold the final key — no ticket closes without their sign-off.</p>
        </div>
      </div>

    </div>

    <!-- RIGHT COLUMN -->
    <div class="col col-r">

      <div class="sec">
        <div class="sec-label"><div class="bar bar-teal"></div><span class="sec-kicker">The Solution — What TicketOps Delivers</span></div>
        <h2 class="sec-title">One platform. Every role. Live.</h2>
        <div class="flow">
          <div class="fstep">
            <div class="fdot d1">1</div>
            <div class="fstep-body"><strong>Manager raises a ticket with photo evidence</strong><span>Outlet, asset, area, category and impact captured at source. Priority auto-set P1–P4. Photos mandatory for food safety and critical issues.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d2">2</div>
            <div class="fstep-body"><strong>Smart Dispatch assigns the right technician</strong><span>Admin sees real-time attendance, service area coverage, and active job load. System surfaces the best available tech instantly.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d3">3</div>
            <div class="fstep-body"><strong>Technician works through a structured queue</strong><span>Dedicated workspace shows active tickets, phased checklists (Morning / Mid-Day / Closing / Weekly), and photo upload on resolution.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d4">4</div>
            <div class="fstep-body"><strong>Manager verifies and closes the loop</strong><span>Resolved tickets enter a verification gate. Manager reviews evidence and approves or reopens — no silent closures, ever.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d5">5</div>
            <div class="fstep-body"><strong>Admin monitors everything in real time</strong><span>Live dashboard shows SLA heat, outlet pressure, dispatch coverage, and next actions needed across every outlet simultaneously.</span></div>
          </div>
        </div>
      </div>

      <div class="div"></div>

      <div class="sec">
        <div class="sec-label"><div class="bar bar-blue"></div><span class="sec-kicker">Platform Modules</span></div>
        <h2 class="sec-title">8 purpose-built workspaces</h2>
        <div class="mods">
          <div class="mod"><div class="mod-ico">▦</div><div class="mod-name">Live Dashboard</div><div class="mod-desc">SLA heat, outlet health, dispatch coverage &amp; activity.</div></div>
          <div class="mod"><div class="mod-ico">◉</div><div class="mod-name">Manager Desk</div><div class="mod-desc">Create tickets, upload photos, run verification gate.</div></div>
          <div class="mod"><div class="mod-ico">⚙</div><div class="mod-name">Admin Control</div><div class="mod-desc">Assign jobs, manage attendance, view field dashboards.</div></div>
          <div class="mod"><div class="mod-ico">⚒</div><div class="mod-name">Technician Work</div><div class="mod-desc">Task queue, phased checklists, and photo evidence.</div></div>
          <div class="mod"><div class="mod-ico">◷</div><div class="mod-name">Scheduler</div><div class="mod-desc">Daily &amp; weekly preventive maintenance rule engine.</div></div>
          <div class="mod"><div class="mod-ico">▣</div><div class="mod-name">Masters</div><div class="mod-desc">Outlets, assets, categories, technicians &amp; dispatch windows.</div></div>
          <div class="mod"><div class="mod-ico">H</div><div class="mod-name">History Archive</div><div class="mod-desc">Searchable closed records with photos &amp; ownership trail.</div></div>
          <div class="mod"><div class="mod-ico">▤</div><div class="mod-name">Reports</div><div class="mod-desc">Operations analytics, performance &amp; closure metrics.</div></div>
        </div>
      </div>

    </div>
  </div>

  <!-- BOTTOM STRIP -->
  <div class="strip">
    <div class="strip-roles">
      <span class="strip-label">Roles</span>
      <span class="chip c1"><span class="chip-dot"></span>Admin</span>
      <span class="chip c2"><span class="chip-dot"></span>Manager</span>
      <span class="chip c3"><span class="chip-dot"></span>Technician</span>
      <span class="chip c4"><span class="chip-dot"></span>Auditor</span>
    </div>
    <div class="strip-sep"></div>
    <div class="strip-outcomes">
      <div class="out out-a">
        <span class="out-num">100%</span>
        <span class="out-lbl">Ticket Visibility Across All Outlets</span>
      </div>
      <div class="out out-b">
        <span class="out-num">0</span>
        <span class="out-lbl">Silent Closures Without Manager Sign-Off</span>
      </div>
      <div class="out out-c">
        <span class="out-num">P1–P4</span>
        <span class="out-lbl">Auto-Priority From Impact at Creation</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="ftr">
    <div class="ftr-l">Confidential · Internal Operations Document · May 2026</div>
    <div class="ftr-c">
      <div class="ftr-dot"></div>
      <span class="ftr-brand">TicketOps Flow</span>
      <div class="ftr-dot"></div>
    </div>
    <div class="ftr-r">Field Operations Intelligence · Multi-Outlet Command Platform</div>
  </footer>

</div>
</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  // Small wait to ensure render is complete
  await new Promise(r => setTimeout(r, 1000));

  await page.pdf({
    path: path.join(__dirname, 'www', 'TicketOps-Flow.pdf'),
    width: '210mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });

  await browser.close();
  console.log('PDF generated.');
})();
