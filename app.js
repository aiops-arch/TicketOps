const API_BASE = localStorage.getItem("ticketops-api-base") || "";

let state = {
  outlets: [],
  technicians: [],
  tickets: [],
  reports: {}
};

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

async function loadState() {
  state = await api("/api/bootstrap");
  renderSelects();
  render();
}

async function createTicket(event) {
  event.preventDefault();
  await api("/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      outlet: document.querySelector("#ticketOutlet").value,
      category: document.querySelector("#ticketCategory").value,
      impact: document.querySelector("#ticketImpact").value,
      note: document.querySelector("#ticketNote").value
    })
  });
  document.querySelector("#ticketNote").value = "";
  await loadState();
}

async function setTicketStatus(ticketId, status, detail = "") {
  await api(`/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, detail })
  });
  await loadState();
}

async function assignTicket(ticketId, technicianId) {
  const technician = technicianById(technicianId);
  const payload = { technicianId };
  if (technician && !["Present", "Busy", "Emergency Available"].includes(technician.status)) {
    payload.overrideReason = `Admin override: ${technician.name} is ${technician.status}`;
  }

  await api(`/api/tickets/${ticketId}/assign`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  await loadState();
}

async function updateTechnicianStatus(technicianId, status) {
  await api(`/api/technicians/${technicianId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  await loadState();
}

function technicianById(id) {
  return state.technicians.find((tech) => tech.id === id);
}

function renderSelects() {
  const outletSelect = document.querySelector("#ticketOutlet");
  const activeTechnician = document.querySelector("#activeTechnician");
  const selectedTechnician = activeTechnician.value;

  outletSelect.innerHTML = state.outlets.map((outlet) => `<option>${outlet}</option>`).join("");
  activeTechnician.innerHTML = state.technicians
    .map((tech) => `<option value="${tech.id}">${tech.name}</option>`)
    .join("");

  if (selectedTechnician) activeTechnician.value = selectedTechnician;
}

function ticketCard(ticket, mode) {
  const assigned = technicianById(ticket.assignedTo);
  const suggested = ticket.suggestedTechnician;
  const canVerify = ticket.status === "Resolved" || ticket.status === "Verification Pending";
  const canWork = ["Assigned", "Acknowledged", "In Progress", "Blocked"].includes(ticket.status);

  let actions = "";
  if (mode === "admin") {
    const options = state.technicians
      .map((tech) => {
        const selected = tech.id === (suggested?.id || ticket.assignedTo) ? "selected" : "";
        return `<option value="${tech.id}" ${selected}>${tech.name} - ${tech.status}</option>`;
      })
      .join("");
    actions = `
      <select data-assign="${ticket.id}">${options}</select>
      <button class="small-button primary" data-assign-button="${ticket.id}">Assign</button>
      <button class="small-button warning" data-status="${ticket.id}:Blocked">Blocked</button>
    `;
  }
  if (mode === "manager" && canVerify) {
    actions = `
      <button class="small-button success" data-status="${ticket.id}:Closed">Approve</button>
      <button class="small-button warning" data-status="${ticket.id}:Reopened">Reject / Reopen</button>
    `;
  }
  if (mode === "technician" && canWork) {
    actions = `
      <button class="small-button primary" data-status="${ticket.id}:Acknowledged">Acknowledge</button>
      <button class="small-button primary" data-status="${ticket.id}:In Progress">Start</button>
      <button class="small-button warning" data-status="${ticket.id}:Blocked">Need Part/Vendor</button>
      <button class="small-button success" data-status="${ticket.id}:Resolved">Resolve</button>
    `;
  }

  return `
    <article class="ticket-card">
      <div class="ticket-top">
        <div>
          <h3 class="ticket-title">${ticket.id} - ${ticket.note}</h3>
          <p class="ticket-meta">${ticket.outlet} | ${ticket.category} | ${ticket.impact}</p>
        </div>
        <span class="badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
      </div>
      <div class="badge-row">
        <span class="badge status-${ticket.status.toLowerCase().replaceAll(" ", "-")}">${ticket.status}</span>
        <span class="badge">${assigned ? assigned.name : "Unassigned"}</span>
        ${mode === "admin" && suggested ? `<span class="badge">Suggested: ${suggested.name}</span>` : ""}
      </div>
      ${ticket.history?.length ? `<p class="ticket-meta">Last: ${ticket.history[ticket.history.length - 1].action}</p>` : ""}
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </article>
  `;
}

function renderManager() {
  const list = state.tickets.filter((ticket) => ["Resolved", "Verification Pending", "Closed", "Reopened"].includes(ticket.status));
  document.querySelector("#managerTickets").innerHTML = list.length
    ? list.map((ticket) => ticketCard(ticket, "manager")).join("")
    : `<div class="empty">No tickets waiting for manager action.</div>`;
}

function renderAdmin() {
  document.querySelector("#criticalCount").textContent = state.reports.critical || 0;
  document.querySelector("#newCount").textContent = state.reports.unassigned || 0;
  document.querySelector("#blockedCount").textContent = state.reports.blocked || 0;
  document.querySelector("#presentCount").textContent = state.reports.presentTechnicians || 0;

  document.querySelector("#attendanceBoard").innerHTML = state.technicians.map((tech) => `
    <article class="tech-card">
      <strong>${tech.name}</strong>
      <span>${tech.skill}</span>
      <select class="status-select" data-tech-status="${tech.id}">
        ${["Present", "Busy", "Break", "On Leave", "Absent", "Off Duty", "Emergency Available"].map((status) => (
          `<option ${tech.status === status ? "selected" : ""}>${status}</option>`
        )).join("")}
      </select>
    </article>
  `).join("");

  document.querySelector("#adminTickets").innerHTML = state.tickets
    .filter((ticket) => ticket.status !== "Closed")
    .map((ticket) => ticketCard(ticket, "admin"))
    .join("");
}

function renderTechnician() {
  const activeId = document.querySelector("#activeTechnician").value || state.technicians[0]?.id;
  const list = state.tickets.filter((ticket) => ticket.assignedTo === activeId && ticket.status !== "Closed");
  document.querySelector("#technicianTickets").innerHTML = list.length
    ? list.map((ticket) => ticketCard(ticket, "technician")).join("")
    : `<div class="empty">No active tickets for this technician.</div>`;
}

function renderReports() {
  const cards = [
    ["Open Tickets", state.reports.open || 0],
    ["Blocked Tickets", state.reports.blocked || 0],
    ["Reopened Tickets", state.reports.reopened || 0],
    ["Present Technicians", state.reports.presentTechnicians || 0],
    ["Critical Tickets", state.reports.critical || 0],
    ["Closed Tickets", state.reports.closed || 0],
    ["Unassigned Tickets", state.reports.unassigned || 0],
    ["Attendance Coverage", `${state.reports.presentTechnicians || 0}/${state.reports.technicianCount || 0}`]
  ];
  document.querySelector("#reportsBoard").innerHTML = cards.map(([label, value]) => `
    <article class="report-card">
      <strong>${value}</strong>
      <span>${label}</span>
    </article>
  `).join("");
}

function render() {
  renderManager();
  renderAdmin();
  renderTechnician();
  renderReports();
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("is-active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("is-active"));
    button.classList.add("is-active");
    document.querySelector(`#${button.dataset.view}`).classList.add("is-active");
  });
});

document.querySelector("#ticketForm").addEventListener("submit", createTicket);
document.querySelector("#activeTechnician").addEventListener("change", renderTechnician);
document.querySelector("#resetData").addEventListener("click", async () => {
  await api("/api/reset", { method: "POST" });
  await loadState();
});

document.addEventListener("click", async (event) => {
  const statusTarget = event.target.dataset.status;
  if (statusTarget) {
    const [ticketId, status] = statusTarget.split(":");
    await setTicketStatus(ticketId, status);
  }

  const assignId = event.target.dataset.assignButton;
  if (assignId) {
    const select = document.querySelector(`[data-assign="${assignId}"]`);
    await assignTicket(assignId, select.value);
  }
});

document.addEventListener("change", async (event) => {
  const techId = event.target.dataset.techStatus;
  if (!techId) return;
  await updateTechnicianStatus(techId, event.target.value);
});

loadState().catch((error) => {
  document.querySelector(".app-shell").innerHTML = `
    <section class="panel">
      <h2>API connection failed</h2>
      <p>${error.message}</p>
      <p>Run <strong>npm start</strong> and open <strong>http://localhost:3000</strong>.</p>
    </section>
  `;
});
