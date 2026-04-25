const outlets = ["Outlet 1", "Outlet 2", "Outlet 3", "Outlet 4"];
const technicians = [
  { id: "T1", name: "Technician 1", skill: "AC", status: "Present" },
  { id: "T2", name: "Technician 2", skill: "Refrigeration", status: "Present" },
  { id: "T3", name: "Technician 3", skill: "Electrical", status: "Break" },
  { id: "T4", name: "Technician 4", skill: "Plumbing", status: "Absent" }
];

const initialTickets = [
  {
    id: "TK-1001",
    outlet: "Outlet 1",
    category: "Refrigeration",
    impact: "Food safety risk",
    note: "Freezer temperature rising",
    priority: "P1",
    status: "New",
    assignedTo: "",
    history: ["Ticket created by Outlet 1 manager"]
  },
  {
    id: "TK-1002",
    outlet: "Outlet 3",
    category: "Plumbing",
    impact: "Normal repair",
    note: "Dishwash area drain slow",
    priority: "P3",
    status: "Assigned",
    assignedTo: "T4",
    history: ["Ticket created", "Assigned to Technician 4"]
  }
];

const state = loadState();

function loadState() {
  const saved = localStorage.getItem("ticketops-state");
  if (saved) return JSON.parse(saved);
  return {
    tickets: initialTickets,
    technicians
  };
}

function saveState() {
  localStorage.setItem("ticketops-state", JSON.stringify(state));
}

function nextTicketId() {
  const max = state.tickets.reduce((highest, ticket) => {
    const number = Number(ticket.id.replace("TK-", ""));
    return Math.max(highest, number);
  }, 1000);
  return `TK-${max + 1}`;
}

function priorityForImpact(impact) {
  if (impact === "Service stopped" || impact === "Food safety risk") return "P1";
  if (impact === "Customer visible") return "P2";
  if (impact === "Cosmetic") return "P4";
  return "P3";
}

function technicianById(id) {
  return state.technicians.find((tech) => tech.id === id);
}

function smartSuggestion(ticket) {
  const available = state.technicians.filter((tech) => tech.status === "Present");
  const skillMatch = available.find((tech) => tech.skill === ticket.category);
  if (skillMatch) return skillMatch.id;
  return available[0]?.id || "";
}

function setTicketStatus(ticketId, status, detail = "") {
  const ticket = state.tickets.find((item) => item.id === ticketId);
  if (!ticket) return;
  ticket.status = status;
  ticket.history.push(`${status}${detail ? `: ${detail}` : ""}`);
  saveState();
  render();
}

function assignTicket(ticketId, technicianId, reason = "Assigned by admin") {
  const ticket = state.tickets.find((item) => item.id === ticketId);
  if (!ticket) return;
  ticket.assignedTo = technicianId;
  ticket.status = "Assigned";
  ticket.history.push(`${reason} to ${technicianById(technicianId)?.name || "Unknown"}`);
  saveState();
  render();
}

function createTicket(event) {
  event.preventDefault();
  const outlet = document.querySelector("#ticketOutlet").value;
  const category = document.querySelector("#ticketCategory").value;
  const impact = document.querySelector("#ticketImpact").value;
  const note = document.querySelector("#ticketNote").value || `${category} issue`;
  const ticket = {
    id: nextTicketId(),
    outlet,
    category,
    impact,
    note,
    priority: priorityForImpact(impact),
    status: "New",
    assignedTo: "",
    history: ["Ticket created by manager"]
  };
  state.tickets.unshift(ticket);
  document.querySelector("#ticketNote").value = "";
  saveState();
  render();
}

function renderSelects() {
  document.querySelector("#ticketOutlet").innerHTML = outlets.map((outlet) => `<option>${outlet}</option>`).join("");
  document.querySelector("#activeTechnician").innerHTML = state.technicians
    .map((tech) => `<option value="${tech.id}">${tech.name}</option>`)
    .join("");
}

function ticketCard(ticket, mode) {
  const assigned = technicianById(ticket.assignedTo);
  const suggestedId = smartSuggestion(ticket);
  const suggested = technicianById(suggestedId);
  const canVerify = ticket.status === "Resolved" || ticket.status === "Verification Pending";
  const canWork = ["Assigned", "Acknowledged", "In Progress", "Blocked"].includes(ticket.status);

  let actions = "";
  if (mode === "admin") {
    const options = state.technicians
      .map((tech) => `<option value="${tech.id}" ${tech.id === suggestedId ? "selected" : ""}>${tech.name} - ${tech.status}</option>`)
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
  document.querySelector("#criticalCount").textContent = state.tickets.filter((ticket) => ticket.priority === "P1" && ticket.status !== "Closed").length;
  document.querySelector("#newCount").textContent = state.tickets.filter((ticket) => ticket.status === "New").length;
  document.querySelector("#blockedCount").textContent = state.tickets.filter((ticket) => ticket.status === "Blocked").length;
  document.querySelector("#presentCount").textContent = state.technicians.filter((tech) => tech.status === "Present").length;

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
  const activeId = document.querySelector("#activeTechnician").value || state.technicians[0].id;
  const list = state.tickets.filter((ticket) => ticket.assignedTo === activeId && ticket.status !== "Closed");
  document.querySelector("#technicianTickets").innerHTML = list.length
    ? list.map((ticket) => ticketCard(ticket, "technician")).join("")
    : `<div class="empty">No active tickets for this technician.</div>`;
}

function renderReports() {
  const open = state.tickets.filter((ticket) => ticket.status !== "Closed").length;
  const reopened = state.tickets.filter((ticket) => ticket.status === "Reopened").length;
  const blocked = state.tickets.filter((ticket) => ticket.status === "Blocked").length;
  const present = state.technicians.filter((tech) => tech.status === "Present").length;
  const cards = [
    ["Open Tickets", open],
    ["Blocked Tickets", blocked],
    ["Reopened Tickets", reopened],
    ["Present Technicians", present],
    ["Critical Tickets", state.tickets.filter((ticket) => ticket.priority === "P1").length],
    ["Closed Tickets", state.tickets.filter((ticket) => ticket.status === "Closed").length],
    ["Unassigned Tickets", state.tickets.filter((ticket) => !ticket.assignedTo).length],
    ["Attendance Coverage", `${present}/${state.technicians.length}`]
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
document.querySelector("#resetData").addEventListener("click", () => {
  localStorage.removeItem("ticketops-state");
  window.location.reload();
});

document.addEventListener("click", (event) => {
  const statusTarget = event.target.dataset.status;
  if (statusTarget) {
    const [ticketId, status] = statusTarget.split(":");
    setTicketStatus(ticketId, status);
  }

  const assignId = event.target.dataset.assignButton;
  if (assignId) {
    const select = document.querySelector(`[data-assign="${assignId}"]`);
    assignTicket(assignId, select.value);
  }
});

document.addEventListener("change", (event) => {
  const techId = event.target.dataset.techStatus;
  if (!techId) return;
  const tech = technicianById(techId);
  tech.status = event.target.value;
  state.tickets
    .filter((ticket) => ticket.assignedTo === techId && ["Assigned", "Acknowledged"].includes(ticket.status) && !["Present", "Busy", "Emergency Available"].includes(tech.status))
    .forEach((ticket) => {
      ticket.status = "New";
      ticket.assignedTo = "";
      ticket.history.push(`Returned to queue because ${tech.name} became ${tech.status}`);
    });
  saveState();
  render();
});

renderSelects();
render();
