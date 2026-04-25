require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");
const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = useSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(express.static(__dirname));

const seed = {
  outlets: ["Outlet 1", "Outlet 2", "Outlet 3", "Outlet 4"],
  technicians: [
    { id: "T1", name: "Technician 1", skill: "AC", status: "Present", workload: 0 },
    { id: "T2", name: "Technician 2", skill: "Refrigeration", status: "Present", workload: 0 },
    { id: "T3", name: "Technician 3", skill: "Electrical", status: "Break", workload: 0 },
    { id: "T4", name: "Technician 4", skill: "Plumbing", status: "Absent", workload: 0 }
  ],
  tickets: [
    {
      id: "TK-1001",
      outlet: "Outlet 1",
      category: "Refrigeration",
      impact: "Food safety risk",
      note: "Freezer temperature rising",
      priority: "P1",
      status: "New",
      assignedTo: "",
      createdAt: "2026-04-25T00:00:00.000Z",
      history: [{ at: "2026-04-25T00:00:00.000Z", action: "Ticket created by Outlet 1 manager" }]
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
      createdAt: "2026-04-25T00:00:00.000Z",
      history: [
        { at: "2026-04-25T00:00:00.000Z", action: "Ticket created" },
        { at: "2026-04-25T00:00:00.000Z", action: "Assigned to Technician 4" }
      ]
    }
  ]
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
}

function readJsonDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeJsonDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function priorityForImpact(impact) {
  if (impact === "Service stopped" || impact === "Food safety risk") return "P1";
  if (impact === "Customer visible") return "P2";
  if (impact === "Cosmetic") return "P4";
  return "P3";
}

function nextTicketId(tickets) {
  const max = tickets.reduce((highest, ticket) => {
    const number = Number(String(ticket.id).replace("TK-", ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 1000);
  return `TK-${max + 1}`;
}

function activeWorkload(db, technicianId) {
  return db.tickets.filter((ticket) =>
    ticket.assignedTo === technicianId && !["Closed", "Cancelled"].includes(ticket.status)
  ).length;
}

function smartSuggestion(db, ticket) {
  const eligible = db.technicians
    .filter((tech) => tech.status === "Present" || (ticket.priority === "P1" && tech.status === "Emergency Available"))
    .map((tech) => ({ ...tech, workload: activeWorkload(db, tech.id) }));

  const skillMatches = eligible.filter((tech) => tech.skill === ticket.category);
  const pool = skillMatches.length ? skillMatches : eligible;
  return pool.sort((a, b) => a.workload - b.workload)[0] || null;
}

function reports(db) {
  const openTickets = db.tickets.filter((ticket) => ticket.status !== "Closed");
  return {
    open: openTickets.length,
    critical: openTickets.filter((ticket) => ticket.priority === "P1").length,
    unassigned: openTickets.filter((ticket) => !ticket.assignedTo).length,
    blocked: openTickets.filter((ticket) => ticket.status === "Blocked").length,
    reopened: openTickets.filter((ticket) => ticket.status === "Reopened").length,
    closed: db.tickets.filter((ticket) => ticket.status === "Closed").length,
    presentTechnicians: db.technicians.filter((tech) => tech.status === "Present").length,
    technicianCount: db.technicians.length,
    byOutlet: db.outlets.map((outlet) => ({
      outlet,
      count: db.tickets.filter((ticket) => ticket.outlet === outlet).length
    })),
    technicianWorkload: db.technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      status: tech.status,
      openTickets: activeWorkload(db, tech.id)
    }))
  };
}

function withSuggestions(db) {
  return {
    ...db,
    tickets: db.tickets.map((ticket) => ({
      ...ticket,
      suggestedTechnician: smartSuggestion(db, ticket)
    })),
    reports: reports(db),
    storage: useSupabase ? "supabase" : "json"
  };
}

function mapTicket(row, history = []) {
  return {
    id: row.id,
    outlet: row.outlet,
    category: row.category,
    impact: row.impact,
    note: row.note,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assigned_to || "",
    createdAt: row.created_at,
    history
  };
}

async function requireSupabase(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function loadSupabaseDb() {
  const [outletsResult, techniciansResult, ticketsResult, historyResult] = await Promise.all([
    supabase.from("outlets").select("name").order("name"),
    supabase.from("technicians").select("id,name,skill,status").order("id"),
    supabase.from("tickets").select("*").order("created_at", { ascending: false }),
    supabase.from("ticket_history").select("ticket_id,action,created_at").order("created_at", { ascending: true })
  ]);

  const outlets = await requireSupabase(outletsResult);
  const technicians = await requireSupabase(techniciansResult);
  const tickets = await requireSupabase(ticketsResult);
  const history = await requireSupabase(historyResult);

  return {
    outlets: outlets.map((outlet) => outlet.name),
    technicians,
    tickets: tickets.map((ticket) =>
      mapTicket(
        ticket,
        history
          .filter((item) => item.ticket_id === ticket.id)
          .map((item) => ({ at: item.created_at, action: item.action }))
      )
    )
  };
}

async function addSupabaseHistory(ticketId, action) {
  await requireSupabase(await supabase.from("ticket_history").insert({ ticket_id: ticketId, action }));
}

async function loadDb() {
  if (useSupabase) return loadSupabaseDb();
  return readJsonDb();
}

async function createTicket(payload) {
  const db = await loadDb();
  const ticket = {
    id: nextTicketId(db.tickets),
    outlet: payload.outlet,
    category: payload.category,
    impact: payload.impact,
    note: payload.note || `${payload.category} issue`,
    priority: priorityForImpact(payload.impact),
    status: "New",
    assignedTo: "",
    createdAt: new Date().toISOString(),
    history: []
  };

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("tickets").insert({
        id: ticket.id,
        outlet: ticket.outlet,
        category: ticket.category,
        impact: ticket.impact,
        note: ticket.note,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: null
      })
    );
    await addSupabaseHistory(ticket.id, "Ticket created by manager");
    return ticket;
  }

  ticket.history.push({ at: new Date().toISOString(), action: "Ticket created by manager" });
  db.tickets.unshift(ticket);
  writeJsonDb(db);
  return ticket;
}

async function assignTicket(ticketId, technicianId, overrideReason) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  const technician = db.technicians.find((tech) => tech.id === technicianId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!technician) return { status: 404, body: { error: "Technician not found" } };

  const needsOverride = !["Present", "Emergency Available", "Busy"].includes(technician.status);
  if (needsOverride && !overrideReason) {
    return { status: 409, body: { error: "Override reason required for unavailable technician" } };
  }

  const action = needsOverride
    ? `Admin override assigned to ${technician.name}: ${overrideReason}`
    : `Assigned to ${technician.name}`;

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tickets")
        .update({ assigned_to: technician.id, status: "Assigned", updated_at: new Date().toISOString() })
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.assignedTo = technician.id;
  ticket.status = "Assigned";
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function updateTicketStatus(ticketId, status, detail) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };

  const action = detail || `Status changed to ${status}`;
  if (useSupabase) {
    await requireSupabase(
      await supabase.from("tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.status = status;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function updateTechnicianStatus(technicianId, status) {
  const db = await loadDb();
  const technician = db.technicians.find((tech) => tech.id === technicianId);
  if (!technician) return { status: 404, body: { error: "Technician not found" } };

  const unavailable = !["Present", "Busy", "Emergency Available"].includes(status);
  if (useSupabase) {
    await requireSupabase(
      await supabase.from("technicians").update({ status, updated_at: new Date().toISOString() }).eq("id", technicianId)
    );
    await requireSupabase(
      await supabase.from("attendance_events").insert({
        technician_id: technicianId,
        status,
        marked_by: "admin"
      })
    );

    if (unavailable) {
      const affected = db.tickets.filter(
        (ticket) => ticket.assignedTo === technicianId && ["Assigned", "Acknowledged"].includes(ticket.status)
      );
      for (const ticket of affected) {
        await requireSupabase(
          await supabase
            .from("tickets")
            .update({ assigned_to: null, status: "New", updated_at: new Date().toISOString() })
            .eq("id", ticket.id)
        );
        await addSupabaseHistory(ticket.id, `Returned to queue because ${technician.name} became ${status}`);
      }
    }
    return { status: 200, body: { ok: true } };
  }

  technician.status = status;
  if (unavailable) {
    db.tickets
      .filter((ticket) => ticket.assignedTo === technician.id && ["Assigned", "Acknowledged"].includes(ticket.status))
      .forEach((ticket) => {
        ticket.assignedTo = "";
        ticket.status = "New";
        ticket.history.push({
          at: new Date().toISOString(),
          action: `Returned to queue because ${technician.name} became ${status}`
        });
      });
  }
  writeJsonDb(db);
  return { status: 200, body: { technician, reports: reports(db) } };
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "TicketOps API", storage: useSupabase ? "supabase" : "json" });
});

app.get(
  "/api/bootstrap",
  asyncRoute(async (req, res) => {
    res.json(withSuggestions(await loadDb()));
  })
);

app.post(
  "/api/tickets",
  asyncRoute(async (req, res) => {
    const { outlet, category, impact, note } = req.body;
    if (!outlet || !category || !impact) {
      return res.status(400).json({ error: "outlet, category and impact are required" });
    }
    const ticket = await createTicket({ outlet, category, impact, note });
    const db = await loadDb();
    res.status(201).json({ ...ticket, suggestedTechnician: smartSuggestion(db, ticket) });
  })
);

app.patch(
  "/api/tickets/:id/assign",
  asyncRoute(async (req, res) => {
    const result = await assignTicket(req.params.id, req.body.technicianId, req.body.overrideReason);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/tickets/:id/status",
  asyncRoute(async (req, res) => {
    if (!req.body.status) return res.status(400).json({ error: "status is required" });
    const result = await updateTicketStatus(req.params.id, req.body.status, req.body.detail);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/technicians/:id/status",
  asyncRoute(async (req, res) => {
    if (!req.body.status) return res.status(400).json({ error: "status is required" });
    const result = await updateTechnicianStatus(req.params.id, req.body.status);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/reset",
  asyncRoute(async (req, res) => {
    if (useSupabase) return res.status(409).json({ error: "Reset is disabled when Supabase is active" });
    writeJsonDb(seed);
    res.json({ ok: true });
  })
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Server error" });
});

app.listen(port, () => {
  console.log(`TicketOps API running at http://localhost:${port}`);
  console.log(`Storage: ${useSupabase ? "Supabase" : "local JSON fallback"}`);
});
