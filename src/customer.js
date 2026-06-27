const portalData = {
  stats: [
    { label: "Open orders", value: "12", meta: "4 due this week" },
    { label: "Pending invoices", value: "3", meta: "INR 42,800" },
    { label: "Support SLA", value: "96%", meta: "Last 30 days" },
    { label: "Usage health", value: "88%", meta: "Stable account" }
  ],
  orders: [
    { id: "ORD-2408", activity: "Quarterly service pack", status: "In progress", date: "Apr 28", value: "INR 18,400" },
    { id: "ORD-2407", activity: "Kitchen asset audit", status: "Scheduled", date: "Apr 30", value: "INR 9,200" },
    { id: "ORD-2399", activity: "Emergency freezer repair", status: "Completed", date: "Apr 24", value: "INR 6,850" },
    { id: "ORD-2388", activity: "Preventive maintenance visit", status: "Completed", date: "Apr 18", value: "INR 12,100" }
  ],
  invoices: [
    { id: "INV-8831", period: "April 2026", status: "Due", due: "May 05", amount: "INR 42,800" },
    { id: "INV-8794", period: "March 2026", status: "Paid", due: "Apr 05", amount: "INR 38,600" },
    { id: "INV-8755", period: "February 2026", status: "Paid", due: "Mar 05", amount: "INR 41,250" }
  ],
  tickets: [
    { id: "SUP-1805", subject: "Invoice clarification", status: "Open", owner: "Customer success", updated: "Today" },
    { id: "SUP-1772", subject: "Technician visit timing", status: "Waiting", owner: "Operations", updated: "Yesterday" },
    { id: "SUP-1708", subject: "Asset list update", status: "Closed", owner: "Support desk", updated: "Apr 20" }
  ]
};

const pages = {
  dashboard: {
    eyebrow: "Customer command center",
    title: "Account Overview",
    render: renderDashboard
  },
  orders: {
    eyebrow: "Orders and activity",
    title: "Service Activity",
    render: renderOrders
  },
  billing: {
    eyebrow: "Billing and invoices",
    title: "Financial Control",
    render: renderBilling
  },
  support: {
    eyebrow: "Support and tickets",
    title: "Support Desk",
    render: renderSupport
  },
  profile: {
    eyebrow: "Profile and settings",
    title: "Account Settings",
    render: renderProfile
  }
};

function toneFor(status) {
  const value = status.toLowerCase();
  if (value.includes("paid") || value.includes("completed") || value.includes("closed")) return "good";
  if (value.includes("due") || value.includes("open")) return "danger";
  return "warn";
}

function statusPill(status) {
  return `<span class="status-pill" data-tone="${toneFor(status)}">${status}</span>`;
}

function statCards(stats = portalData.stats) {
  return `
    <div class="stats-grid">
      ${stats.map((stat) => `
        <article class="stat-card">
          <p class="stat-label">${stat.label}</p>
          <p class="stat-value">${stat.value}</p>
          <p class="stat-meta">${stat.meta}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function tableShell(title, headers, rows) {
  return `
    <section class="table-shell glass-panel">
      <h2>${title}</h2>
      <table class="data-table">
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </section>
  `;
}

function orderRows(orders = portalData.orders) {
  return orders.map((order) => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.activity}</td>
      <td>${statusPill(order.status)}</td>
      <td>${order.date}</td>
      <td>${order.value}</td>
    </tr>
  `);
}

function invoiceRows(invoices = portalData.invoices) {
  return invoices.map((invoice) => `
    <tr>
      <td><strong>${invoice.id}</strong></td>
      <td>${invoice.period}</td>
      <td>${statusPill(invoice.status)}</td>
      <td>${invoice.due}</td>
      <td>${invoice.amount}</td>
    </tr>
  `);
}

function ticketRows(tickets = portalData.tickets) {
  return tickets.map((ticket) => `
    <tr>
      <td><strong>${ticket.id}</strong></td>
      <td>${ticket.subject}</td>
      <td>${statusPill(ticket.status)}</td>
      <td>${ticket.owner}</td>
      <td>${ticket.updated}</td>
    </tr>
  `);
}

function signalList() {
  const signals = [
    { label: "Service readiness", detail: "Next technician window confirmed", value: "94%" },
    { label: "Invoice confidence", detail: "One invoice needs account review", value: "82%" },
    { label: "Support pressure", detail: "Two active threads across account", value: "68%" }
  ];

  return `
    <aside class="side-list">
      <section class="content-card glass-panel">
        <p class="section-kicker">Signals</p>
        <h2>Account Health</h2>
        ${signals.map((signal) => `
          <div class="signal-row">
            <span class="status-dot"></span>
            <div>
              <strong>${signal.label}</strong>
              <p>${signal.detail}</p>
            </div>
            <strong>${signal.value}</strong>
          </div>
        `).join("")}
      </section>
    </aside>
  `;
}

function renderDashboard() {
  return `
    <section class="hero-grid">
      <article class="hero-panel glass-panel">
        <p class="section-kicker">Live account visibility</p>
        <h2 class="page-title font-display">Trusted service view for every order, invoice, and request.</h2>
        <p class="hero-summary">
          A quiet customer command center for operational teams that need clear service status,
          clean financial visibility, and fast support without admin complexity.
        </p>
        <div class="button-row">
          <button class="btn-primary" type="button">Review open work</button>
          <button class="btn-secondary" type="button">Download statement</button>
        </div>
      </article>
      ${signalList()}
    </section>
    ${statCards()}
    <section class="split-grid">
      ${tableShell("Recent orders", ["Order", "Activity", "Status", "Date", "Value"], orderRows(portalData.orders.slice(0, 3)))}
      <section class="content-card glass-panel">
        <p class="section-kicker">Usage</p>
        <h2>Monthly Coverage</h2>
        <div class="mini-card">
          <strong>Preventive maintenance</strong>
          <p>18 of 22 planned visits completed this month.</p>
          <div class="progress-track"><span class="progress-fill" style="width:82%"></span></div>
        </div>
        <div class="mini-card">
          <strong>Support resolution</strong>
          <p>Most requests resolved inside agreed support windows.</p>
          <div class="progress-track"><span class="progress-fill" style="width:96%"></span></div>
        </div>
      </section>
    </section>
  `;
}

function renderOrders() {
  return `
    <section class="content-card glass-panel">
      <div class="button-row">
        <div class="segmented-control" aria-label="Order filters">
          <button class="is-active" type="button">All</button>
          <button type="button">Open</button>
          <button type="button">Completed</button>
        </div>
        <button class="btn-secondary" type="button">Request service</button>
      </div>
    </section>
    ${tableShell("Orders and activity", ["Order", "Activity", "Status", "Date", "Value"], orderRows())}
  `;
}

function renderBilling() {
  return `
    ${statCards([
      { label: "Balance due", value: "INR 42.8k", meta: "Due May 05" },
      { label: "Paid this quarter", value: "INR 118k", meta: "3 invoices" },
      { label: "Avg approval time", value: "1.6d", meta: "Finance workflow" },
      { label: "Billing health", value: "Good", meta: "No blocked service" }
    ])}
    <section class="split-grid">
      ${tableShell("Invoices", ["Invoice", "Period", "Status", "Due", "Amount"], invoiceRows())}
      <section class="content-card glass-panel">
        <p class="section-kicker">Payment profile</p>
        <h2>Account Method</h2>
        <div class="mini-card">
          <strong>Bank transfer</strong>
          <p>Primary payment method for this account. Receipts are matched weekly.</p>
        </div>
        <div class="button-row">
          <button class="btn-primary" type="button">Pay due invoice</button>
          <button class="btn-secondary" type="button">Export ledger</button>
        </div>
      </section>
    </section>
  `;
}

function renderSupport() {
  return `
    <section class="split-grid">
      ${tableShell("Support tickets", ["Ticket", "Subject", "Status", "Owner", "Updated"], ticketRows())}
      <section class="content-card glass-panel">
        <p class="section-kicker">New request</p>
        <h2>Raise Support Ticket</h2>
        <form class="form-grid">
          <div class="field full-span">
            <label for="supportSubject">Subject</label>
            <input id="supportSubject" type="text" placeholder="Example: Need invoice copy" />
          </div>
          <div class="field full-span">
            <label for="supportDetail">Detail</label>
            <textarea id="supportDetail" placeholder="Write the issue clearly"></textarea>
          </div>
          <button class="btn-primary full-span" type="button">Submit request</button>
        </form>
      </section>
    </section>
  `;
}

function renderProfile() {
  return `
    <section class="split-grid">
      <section class="content-card glass-panel">
        <p class="section-kicker">Account profile</p>
        <h2>Customer Details</h2>
        <form class="form-grid">
          <div class="field">
            <label for="company">Company</label>
            <input id="company" type="text" value="Aiko Operations" />
          </div>
          <div class="field">
            <label for="contact">Primary contact</label>
            <input id="contact" type="text" value="Pratik Patel" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" value="operations@example.com" />
          </div>
          <div class="field">
            <label for="plan">Plan</label>
            <select id="plan">
              <option>Premium service account</option>
              <option>Standard service account</option>
            </select>
          </div>
          <button class="btn-primary full-span" type="button">Save profile</button>
        </form>
      </section>
      <section class="content-card glass-panel">
        <p class="section-kicker">Preferences</p>
        <h2>Operational Settings</h2>
        <div class="card-grid" style="grid-template-columns:1fr">
          <div class="mini-card">
            <strong>Invoice delivery</strong>
            <p>Email monthly invoice and attach itemized service activity.</p>
          </div>
          <div class="mini-card">
            <strong>Support visibility</strong>
            <p>Share ticket status with outlet managers and finance contacts.</p>
          </div>
          <div class="mini-card">
            <strong>Account reviews</strong>
            <p>Quarterly account review enabled for service quality checks.</p>
          </div>
        </div>
      </section>
    </section>
  `;
}

function setPage(pageName) {
  const page = pages[pageName] || pages.dashboard;
  document.getElementById("pageEyebrow").textContent = page.eyebrow;
  document.getElementById("pageTitle").textContent = page.title;
  document.getElementById("customerPage").innerHTML = page.render();

  document.querySelectorAll("[data-page]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.page === pageName);
  });

  window.history.replaceState({}, "", `#${pageName}`);
}

document.querySelectorAll("[data-page]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    setPage(item.dataset.page);
  });
});

setPage(window.location.hash.replace("#", "") || "dashboard");
