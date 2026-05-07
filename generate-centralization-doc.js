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
.page{
  width:794px;height:1123px;
  display:grid;
  grid-template-rows:104px 1fr 88px 34px;
  overflow:hidden;
}

/* ─── HEADER ─── */
.hdr{
  display:grid;
  grid-template-columns:auto 1fr auto;
  align-items:center;gap:20px;
  padding:0 32px;
  background:linear-gradient(135deg,#11294a 0%,#1a3f6f 45%,#1e4d87 100%);
  position:relative;overflow:hidden;
}
.hdr::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse at 72% 0%,rgba(96,165,250,0.22),transparent 55%),
    radial-gradient(ellipse at 100% 100%,rgba(255,255,255,0.04),transparent 40%);
}
.hdr-logo-wrap{
  position:relative;z-index:2;background:#fff;border-radius:10px;
  padding:5px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.22);
  display:flex;align-items:center;justify-content:center;
}
.hdr-logo-wrap img{width:82px;height:48px;object-fit:contain;display:block;}
.hdr-copy{position:relative;z-index:2;}
.hdr-eyebrow{
  font-size:8.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;
  color:rgba(147,197,253,0.9);margin-bottom:4px;
  display:flex;align-items:center;gap:6px;
}
.hdr-eyebrow::before{content:"";width:5px;height:5px;border-radius:50%;background:#60a5fa;box-shadow:0 0 6px rgba(96,165,250,0.7);}
.hdr-title{
  font-family:"Fraunces",Georgia,serif;font-size:28px;font-weight:700;
  line-height:1.0;color:#fff;letter-spacing:-0.5px;
}
.hdr-title em{font-style:normal;color:#93c5fd;}
.hdr-sub{
  font-size:9.5px;font-weight:500;color:rgba(219,234,254,0.82);
  line-height:1.45;margin-top:5px;max-width:360px;
}
.hdr-badges{position:relative;z-index:2;display:flex;flex-direction:column;gap:5px;align-items:flex-end;}
.hdr-badge{
  display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;
  border:1px solid rgba(96,165,250,0.4);background:rgba(255,255,255,0.08);
  font-size:7.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
  color:#bfdbfe;white-space:nowrap;
}
.hdr-badge b{color:#fff;}

/* ─── BODY ─── */
.body{display:grid;grid-template-columns:1fr 1fr;overflow:hidden;}

/* ─── COLUMNS ─── */
.col{
  display:flex;flex-direction:column;gap:0;
  padding:18px 20px 16px 28px;overflow:hidden;
}
.col-r{padding-left:20px;padding-right:28px;background:#f4f7ff;border-left:1px solid #dce6f5;}

/* ─── SECTION ─── */
.sec{flex-shrink:0;}
.sec-label{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.bar{width:3px;height:13px;border-radius:2px;flex-shrink:0;}
.bar-red{background:#e05252;} .bar-blue{background:#2563eb;}
.bar-indigo{background:#6366f1;} .bar-teal{background:#0d9488;}
.bar-amber{background:#d97706;}
.sec-kicker{font-size:8px;font-weight:800;letter-spacing:0.11em;text-transform:uppercase;color:#6474a0;}
.sec-title{font-family:"Fraunces",Georgia,serif;font-size:15px;font-weight:700;color:#0e1c3a;line-height:1.1;margin-bottom:7px;}
.sec-body{font-size:9px;font-weight:500;color:#2d3a5a;line-height:1.55;}

/* ─── DIVIDER ─── */
.div{height:1px;background:#dce6f5;margin:12px 0;flex-shrink:0;}

/* ─── FRAGMENT LIST ─── */
.frag-list{display:flex;flex-direction:column;gap:5px;margin-top:7px;}
.frag{
  display:grid;grid-template-columns:18px 1fr;gap:6px;align-items:start;
  padding:8px 10px;border-radius:7px;
  border-left:2.5px solid #e05252;background:rgba(224,82,82,0.04);
}
.frag-ico{font-size:11px;line-height:1.4;}
.frag-txt{font-size:9px;font-weight:600;color:#2d3a5a;line-height:1.5;}
.frag-txt strong{display:block;font-size:9.5px;color:#b94040;margin-bottom:2px;}

/* ─── STATUS CHAIN ─── */
.chain{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:7px;}
.snode{padding:4px 7px;border-radius:5px;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}
.sarr{font-size:9px;color:#8090b4;}
.s1{background:rgba(37,99,235,0.1);color:#1d4ed8;}
.s2{background:rgba(13,148,136,0.1);color:#0f766e;}
.s3{background:rgba(196,147,56,0.1);color:#8a6218;}
.s4{background:rgba(99,102,241,0.1);color:#4338ca;}
.s5{background:rgba(224,82,82,0.1);color:#b94040;}
.s6{background:rgba(109,40,217,0.1);color:#6d28d9;}
.s7{background:rgba(22,163,74,0.1);color:#15803d;}

.chain-note{
  margin-top:8px;padding:9px 12px;border-radius:7px;
  border-left:3px solid #2563eb;
  background:linear-gradient(135deg,rgba(37,99,235,0.05),rgba(96,165,250,0.02));
}
.chain-note p{font-size:9px;font-weight:500;color:#2d3a5a;line-height:1.55;}
.chain-note strong{color:#1d4ed8;font-weight:700;}

/* ─── COMPARE ─── */
.compare{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:7px;}
.comp-box{padding:10px 12px;border-radius:8px;}
.comp-before{background:rgba(224,82,82,0.05);border:1px solid rgba(224,82,82,0.18);}
.comp-after{background:rgba(37,99,235,0.05);border:1px solid rgba(37,99,235,0.18);}
.comp-label{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;}
.comp-before .comp-label{color:#b94040;}
.comp-after .comp-label{color:#1d4ed8;}
.comp-item{font-size:8.5px;font-weight:500;color:#2d3a5a;line-height:1.6;padding-left:10px;position:relative;}
.comp-item::before{content:"";position:absolute;left:0;top:6px;width:4px;height:4px;border-radius:50%;}
.comp-before .comp-item::before{background:#e05252;}
.comp-after .comp-item::before{background:#2563eb;}

/* ─── FLOW STEPS ─── */
.flow{display:flex;flex-direction:column;gap:0;margin-top:7px;position:relative;}
.flow::before{
  content:"";position:absolute;left:11px;top:20px;bottom:20px;width:1px;
  background:linear-gradient(180deg,#60a5fa,#2563eb,rgba(37,99,235,0.1));
}
.fstep{display:grid;grid-template-columns:24px 1fr;gap:9px;align-items:start;padding:5px 0;}
.fdot{
  width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:800;flex-shrink:0;position:relative;z-index:1;color:#fff;
}
.d1{background:#11294a;} .d2{background:#1d4ed8;} .d3{background:#0d9488;}
.d4{background:#6366f1;} .d5{background:#be123c;}
.fstep-body strong{display:block;font-size:9.5px;font-weight:700;color:#0e1c3a;margin-bottom:2px;}
.fstep-body span{font-size:8.5px;font-weight:500;color:#5464a0;line-height:1.5;}

/* ─── COMMAND LAYERS ─── */
.layers{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px;}
.layer{padding:11px 12px;border-radius:8px;border:1px solid #dce6f5;background:#fff;position:relative;overflow:hidden;}
.layer::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;}
.l1::before{background:linear-gradient(90deg,#1d4ed8,#60a5fa);}
.l2::before{background:linear-gradient(90deg,#0d9488,#2dd4bf);}
.l3::before{background:linear-gradient(90deg,#6366f1,#a78bfa);}
.l4::before{background:linear-gradient(90deg,#be123c,#fb7185);}
.layer-ico{font-size:14px;line-height:1;margin-bottom:4px;}
.layer-name{font-size:9px;font-weight:800;color:#0e1c3a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;}
.layer-desc{font-size:8.5px;font-weight:500;color:#5464a0;line-height:1.45;}

/* ─── DATA FLOW ─── */
.dataflow-wrap{margin-top:10px;}
.dataflow{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:6px;}
.dnode{
  padding:5px 10px;border-radius:6px;
  font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;
  border:1px solid;white-space:nowrap;
}
.dn1{background:rgba(219,234,254,0.6);color:#1d4ed8;border-color:rgba(37,99,235,0.25);}
.dn2{background:rgba(220,252,231,0.6);color:#15803d;border-color:rgba(21,128,61,0.25);}
.dn3{background:rgba(243,232,255,0.6);color:#6d28d9;border-color:rgba(109,40,217,0.25);}
.dn4{background:rgba(255,237,213,0.6);color:#c2410c;border-color:rgba(194,65,12,0.25);}
.dn5{background:rgba(219,234,254,0.9);color:#1e3a8a;border-color:rgba(30,58,138,0.3);}
.darr{font-size:10px;color:#94a3b8;}

/* ─── RULE BOX ─── */
.rule-box{
  margin-top:10px;padding:11px 14px;border-radius:9px;
  background:linear-gradient(135deg,#1a3f6f,#11294a);
  border:1px solid rgba(96,165,250,0.25);
}
.rule-box-label{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#93c5fd;margin-bottom:5px;}
.rule-box p{font-size:9.5px;font-weight:600;color:#e0eeff;line-height:1.55;}
.rule-box em{font-style:normal;color:#60a5fa;}

/* ─── BOTTOM STRIP ─── */
.strip{
  display:grid;grid-template-columns:auto 1px 1fr;
  gap:0;align-items:center;padding:0 32px;
  border-top:1px solid #dce6f5;
  background:linear-gradient(135deg,rgba(37,99,235,0.04),rgba(96,165,250,0.02));
}
.strip-roles{display:flex;align-items:center;gap:7px;padding-right:22px;}
.strip-label{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#8090b4;margin-right:4px;}
.chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;font-size:8px;font-weight:700;}
.chip-dot{width:4px;height:4px;border-radius:50%;}
.c1{background:rgba(37,99,235,0.09);color:#1d4ed8;border:1px solid rgba(37,99,235,0.2);}
.c1 .chip-dot{background:#2563eb;}
.c2{background:rgba(13,148,136,0.09);color:#0f766e;border:1px solid rgba(13,148,136,0.2);}
.c2 .chip-dot{background:#0d9488;}
.c3{background:rgba(99,102,241,0.09);color:#4338ca;border:1px solid rgba(99,102,241,0.2);}
.c3 .chip-dot{background:#6366f1;}
.c4{background:rgba(190,18,60,0.08);color:#9f1239;border:1px solid rgba(190,18,60,0.18);}
.c4 .chip-dot{background:#be123c;}
.strip-sep{width:1px;height:44px;background:#dce6f5;}
.strip-outcomes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-left:22px;}
.out{padding:7px 10px;border-radius:7px;text-align:center;}
.out-a{background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.16);}
.out-b{background:rgba(13,148,136,0.06);border:1px solid rgba(13,148,136,0.16);}
.out-c{background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.16);}
.out-num{display:block;font-family:"Fraunces",Georgia,serif;font-size:20px;font-weight:700;line-height:1;margin-bottom:3px;}
.out-a .out-num{color:#1d4ed8;} .out-b .out-num{color:#0d9488;} .out-c .out-num{color:#4338ca;}
.out-lbl{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;line-height:1.35;}
.out-a .out-lbl{color:#1d4ed8;} .out-b .out-lbl{color:#0f766e;} .out-c .out-lbl{color:#4338ca;}

/* ─── FOOTER ─── */
.ftr{
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;
  padding:0 32px;border-top:1px solid #e8eef8;background:#fff;
}
.ftr-l,.ftr-r{font-size:7.5px;font-weight:600;color:#8090b4;}
.ftr-r{text-align:right;}
.ftr-c{display:flex;align-items:center;gap:5px;justify-content:center;}
.ftr-dot{width:4px;height:4px;border-radius:50%;background:#2563eb;}
.ftr-brand{font-family:"Fraunces",Georgia,serif;font-size:10px;font-weight:700;color:#11294a;}
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
      <div class="hdr-eyebrow">Centralized Maintenance Operations Platform</div>
      <h1 class="hdr-title">TicketOps <em>Central Command</em></h1>
      <p class="hdr-sub">How a fragmented, WhatsApp-driven maintenance chain becomes a single controlled operating system — full accountability from first report to final closure.</p>
    </div>
    <div class="hdr-badges">
      <div class="hdr-badge"><b>1</b> Platform for All Outlets</div>
      <div class="hdr-badge"><b>4</b> Roles, 1 Source of Truth</div>
      <div class="hdr-badge"><b>Zero</b> Silent Closures</div>
    </div>
  </header>

  <!-- BODY -->
  <div class="body">

    <!-- LEFT COLUMN -->
    <div class="col">

      <div class="sec">
        <div class="sec-label"><div class="bar bar-red"></div><span class="sec-kicker">The Centralization Problem — Before TicketOps</span></div>
        <h2 class="sec-title">Maintenance lived everywhere, owned by nobody</h2>
        <p class="sec-body">Across 4 outlets, issues traveled through WhatsApp chats, phone calls, verbal instructions, and personal memory — five separate unconnected records that could never be reconciled.</p>
        <div class="frag-list">
          <div class="frag">
            <span class="frag-ico">💬</span>
            <div class="frag-txt"><strong>WhatsApp Threads — No Ownership</strong>Issues in group chats had no assigned owner. Follow-ups were informal and buried by new messages within hours.</div>
          </div>
          <div class="frag">
            <span class="frag-ico">📞</span>
            <div class="frag-txt"><strong>Phone Calls — No Record</strong>Verbal job assignments left no log. If a technician was replaced mid-shift, the task simply vanished with no trace.</div>
          </div>
          <div class="frag">
            <span class="frag-ico">🏪</span>
            <div class="frag-txt"><strong>Outlet Isolation — No Cross-Visibility</strong>A P1 refrigeration failure at one outlet and an idle technician at another were completely invisible to the admin.</div>
          </div>
          <div class="frag">
            <span class="frag-ico">📋</span>
            <div class="frag-txt"><strong>No Single Closure Gate</strong>Work was declared "done" without manager verification or photo proof — repeat failures had no traceable root cause.</div>
          </div>
        </div>
      </div>

      <div class="div"></div>

      <div class="sec">
        <div class="sec-label"><div class="bar bar-teal"></div><span class="sec-kicker">Ticket Lifecycle — Centralized End to End</span></div>
        <h2 class="sec-title">Every issue tracked through one unified chain</h2>
        <div class="chain">
          <span class="snode s1">New</span><span class="sarr">→</span>
          <span class="snode s2">Assigned</span><span class="sarr">→</span>
          <span class="snode s3">Acknowledged</span><span class="sarr">→</span>
          <span class="snode s4">In Progress</span><span class="sarr">→</span>
          <span class="snode s5">Blocked</span><span class="sarr">→</span>
          <span class="snode s6">Verification</span><span class="sarr">→</span>
          <span class="snode s7">Closed</span>
        </div>
        <div class="chain-note">
          <p>Every status change is <strong>timestamped, role-gated, and photo-evidenced</strong> where required. No status can be skipped. Manager holds the final key — no ticket closes without explicit sign-off. Rejected tickets reopen with a mandatory reason.</p>
        </div>
      </div>

      <div class="div"></div>

      <div class="sec">
        <div class="sec-label"><div class="bar bar-amber"></div><span class="sec-kicker">Before vs. After Centralization</span></div>
        <h2 class="sec-title">One platform replaces five broken channels</h2>
        <div class="compare">
          <div class="comp-box comp-before">
            <div class="comp-label">Before — Fragmented</div>
            <div class="comp-item">WhatsApp for reporting</div>
            <div class="comp-item">Phone calls for assignment</div>
            <div class="comp-item">Memory for follow-up</div>
            <div class="comp-item">No priority system</div>
            <div class="comp-item">No attendance link</div>
            <div class="comp-item">No proof of closure</div>
            <div class="comp-item">No cross-outlet view</div>
          </div>
          <div class="comp-box comp-after">
            <div class="comp-label">After — TicketOps</div>
            <div class="comp-item">Ticket ID at creation</div>
            <div class="comp-item">Attendance-smart dispatch</div>
            <div class="comp-item">Live status for every role</div>
            <div class="comp-item">Auto-priority P1–P4</div>
            <div class="comp-item">Skill + load matching</div>
            <div class="comp-item">Manager verification gate</div>
            <div class="comp-item">Full searchable history</div>
          </div>
        </div>
      </div>

    </div>

    <!-- RIGHT COLUMN -->
    <div class="col col-r">

      <div class="sec">
        <div class="sec-label"><div class="bar bar-blue"></div><span class="sec-kicker">How TicketOps Centralizes the Entire Chain</span></div>
        <h2 class="sec-title">Every outlet. Every role. One operating record.</h2>
        <div class="flow">
          <div class="fstep">
            <div class="fdot d1">1</div>
            <div class="fstep-body"><strong>Single intake point — ticket replaces the WhatsApp message</strong><span>Every issue from any outlet enters through one structured form. Outlet, asset, category, impact, and photo captured at source. No message can be lost.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d2">2</div>
            <div class="fstep-body"><strong>Centralized dispatch — attendance and workload in one view</strong><span>Admin sees real-time availability, skill match, and active load for all technicians across all outlets simultaneously. No more blind guessing by phone.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d3">3</div>
            <div class="fstep-body"><strong>Technician works from one structured queue — no verbal updates</strong><span>Single workspace shows assigned tickets, PM checklists, blocked reason, and photo upload on resolution. Every action is timestamped and role-gated.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d4">4</div>
            <div class="fstep-body"><strong>Mandatory verification gate — manager closes every ticket</strong><span>All resolved tickets require manager sign-off before closing. Rejection triggers a documented reopen. Zero silent closures are architecturally possible.</span></div>
          </div>
          <div class="fstep">
            <div class="fdot d5">5</div>
            <div class="fstep-body"><strong>Every data point feeds one live command dashboard</strong><span>SLA heat, outlet pressure, dispatch coverage, category failures, and team utilization — all from a single Supabase record, visible in real time to admin.</span></div>
          </div>
        </div>
      </div>

      <div class="div"></div>

      <div class="sec">
        <div class="sec-label"><div class="bar bar-indigo"></div><span class="sec-kicker">Central Command Layers</span></div>
        <h2 class="sec-title">4 layers that lock the system shut</h2>
        <div class="layers">
          <div class="layer l1">
            <div class="layer-ico">▦</div>
            <div class="layer-name">Ticket Hub</div>
            <div class="layer-desc">All issues from all outlets in one filterable live board. Priority, status, outlet, and owner always visible to every role.</div>
          </div>
          <div class="layer l2">
            <div class="layer-ico">◉</div>
            <div class="layer-name">Dispatch Brain</div>
            <div class="layer-desc">Attendance-linked assignment. Skill, load, and service area visible before every job. Override logs a mandatory reason.</div>
          </div>
          <div class="layer l3">
            <div class="layer-ico">⚙</div>
            <div class="layer-name">Verification Gate</div>
            <div class="layer-desc">Manager sign-off required for every closure. Rejection creates a documented reopen trail — no work disappears unverified.</div>
          </div>
          <div class="layer l4">
            <div class="layer-ico">▤</div>
            <div class="layer-name">Analytics Core</div>
            <div class="layer-desc">Outlet health, SLA breaches, technician performance, and repeat failures — all from one source, no manual compiling needed.</div>
          </div>
        </div>
      </div>

      <div class="dataflow-wrap">
        <div class="sec-label" style="margin-bottom:5px;"><div class="bar bar-blue"></div><span class="sec-kicker">Unified Data Flow</span></div>
        <div class="dataflow">
          <span class="dnode dn1">4 Outlets</span><span class="darr">→</span>
          <span class="dnode dn2">Ticket API</span><span class="darr">→</span>
          <span class="dnode dn3">Supabase DB</span><span class="darr">→</span>
          <span class="dnode dn4">All Roles</span><span class="darr">→</span>
          <span class="dnode dn5">Live Dashboard</span>
        </div>
      </div>

      <div class="rule-box">
        <div class="rule-box-label">The Governing Principle</div>
        <p><em>No ticket ID = no official maintenance work.</em> WhatsApp may still exist for emergency coordination — but every issue must eventually become a ticket with an owner, a status, a technician, a timeline, proof of work, and a verified closure. That is the contract the system enforces.</p>
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
      <span class="chip c4"><span class="chip-dot"></span>Owner</span>
    </div>
    <div class="strip-sep"></div>
    <div class="strip-outcomes">
      <div class="out out-a">
        <span class="out-num">4 → 1</span>
        <span class="out-lbl">Outlets Into One Operating Record</span>
      </div>
      <div class="out out-b">
        <span class="out-num">0</span>
        <span class="out-lbl">Unverified Closures Possible</span>
      </div>
      <div class="out out-c">
        <span class="out-num">Live</span>
        <span class="out-lbl">Cross-Outlet Command Visibility</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="ftr">
    <div class="ftr-l">Confidential · Internal Operations Document · May 2026</div>
    <div class="ftr-c">
      <div class="ftr-dot"></div>
      <span class="ftr-brand">TicketOps Central Command</span>
      <div class="ftr-dot"></div>
    </div>
    <div class="ftr-r">Centralized Maintenance Intelligence · Multi-Outlet Control Platform</div>
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
  await new Promise(r => setTimeout(r, 1200));

  await page.pdf({
    path: path.join(__dirname, 'TicketOps-CentralCommand.pdf'),
    width: '210mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });

  await browser.close();
  console.log('PDF generated: TicketOps-CentralCommand.pdf');
})();
