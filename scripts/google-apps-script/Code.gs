const DB_SHEET_NAME = "ticketops_db";
const DB_KEY = "db";
const DEFAULT_PASSWORDS = {
  aiops: "AIops",
  "chintan.patel": "chintan123",
  "meet.patel": "meet123",
  "pratik.patel": "pratik123",
  "hussain.sheikh": "hussain123",
  vicky: "vicky123",
  "rahul.patil": "rahul123",
  abrar: "abrar123"
};

const DEFAULT_DB = {
  users: [
    { id: "U-ADMIN-AIOPS", username: "aiops", password: "AIops", name: "AIops", post: "Admin Control Panel Operator", role: "admin", accessAllOutlets: true, allowedOutlets: [], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "reports"] },
    { id: "U-MGR-PRATIK", username: "pratik.patel", password: "pratik123", name: "Pratik Patel", post: "Outlet Manager", role: "manager", outlet: "aiko surat", accessAllOutlets: true, allowedOutlets: [], defaultView: "manager", allowedViews: ["manager"] },
    { id: "U-TECH-VICKY", username: "vicky", password: "vicky123", name: "Vicky", post: "Technician", role: "technician", technicianId: "T1", accessAllOutlets: false, allowedOutlets: ["aiko surat", "Capiche"], defaultView: "technician", allowedViews: ["technician"] }
  ],
  outlets: ["aiko surat", "Capiche"],
  outletLocations: {
    "aiko surat": { address: "Surat", latitude: null, longitude: null },
    Capiche: { address: "Surat", latitude: null, longitude: null }
  },
  categories: [
    { id: "C-AC", name: "AC", description: "Air conditioning and ventilation" },
    { id: "C-REF", name: "Refrigeration", description: "Freezers, chillers, cold rooms" },
    { id: "C-ELEC", name: "Electrical", description: "Power, panels, lighting" },
    { id: "C-PLUMB", name: "Plumbing", description: "Water supply, drains, dishwash area" },
    { id: "C-KITCHEN", name: "Kitchen Equipment", description: "Ovens, fryers, burners, dishwashers" }
  ],
  assets: [],
  technicians: [
    { id: "T1", name: "Vicky", skill: ["AC", "Electrical"], status: "Present", quality: 92, serviceOutlets: ["aiko surat", "Capiche"] }
  ],
  tickets: [],
  tasks: [],
  assignmentTimeWindows: [],
  maintenanceRules: [],
  attendancePlans: [],
  ticketHistory: []
};

function doGet() {
  return jsonResponse({ ok: true, body: { ok: true, name: "TicketOps Google Sheets API", storage: "google-sheets" } });
}

function doPost(e) {
  try {
    const envelope = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    return jsonResponse(handleRequest(envelope));
  } catch (error) {
    return jsonResponse({ ok: false, status: 500, error: error && error.message ? error.message : "Server error" });
  }
}

function serverRequest(envelope) {
  return handleRequest(envelope || {});
}

function importTicketOpsJson(jsonText) {
  const db = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
  saveDb(normalizeDb(db));
  return { ok: true, rows: JSON.stringify(db).length };
}

function resetTicketOpsDemoData() {
  saveDb(normalizeDb(JSON.parse(JSON.stringify(DEFAULT_DB))));
  return { ok: true };
}

function handleRequest(envelope) {
  const method = String(envelope.method || "GET").toUpperCase();
  const path = normalizePath(envelope.path || "/api/health");
  const body = envelope.body || {};
  const headers = envelope.headers || {};
  const db = loadDb();
  const user = userFromHeaders(db, headers);

  if (method === "GET" && path === "/api/health") return ok({ ok: true, name: "TicketOps Google Sheets API", storage: "google-sheets", auth: "demo" });
  if (method === "GET" && path === "/api/stitch/status") return requireAdmin(user, () => ok({ configured: false, connected: false, endpoint: "", tools: [], error: "Stitch is not configured in the Google Sheets backend" }));
  if (method === "POST" && path === "/api/stitch/call") return requireAdmin(user, () => fail(503, "Stitch is not configured in the Google Sheets backend"));
  if (method === "POST" && path === "/api/auth/login") return login(db, body);
  if (method === "GET" && path === "/api/auth/demo-users") return ok({ users: (db.users || []).map(publicUser) });
  if (method === "POST" && path === "/api/auth/change-password") return changePassword(db, user, body);
  if (method === "POST" && /^\/api\/admin\/users\/[^/]+\/reset-password$/.test(path)) return resetPassword(db, user, segment(path, 3), body);
  if (method === "GET" && path === "/api/bootstrap") return requireLogin(user, () => ok(withReports(scopedDbForUser(db, user), user)));
  if (method === "GET" && path === "/api/categories") return requireAdmin(user, () => ok(db.categories || []));
  if (method === "GET" && path.startsWith("/api/reports/export/")) return requireAdmin(user, () => ok(exportCsv(db, segment(path, 3))));
  if (method === "GET" && path.startsWith("/api/backups/monthly/")) return requireAdmin(user, () => monthlyBackup(db, decodeURIComponent(segment(path, 3))));
  if (method === "POST" && path === "/api/backups/report") return requireAdmin(user, () => ok(backupReport(body)));
  if (method === "GET" && path === "/api/technician/dashboard") return requireRole(user, "technician", () => ok(technicianDashboard(db, user.technicianId)));
  if (method === "GET" && path === "/api/technician/tasks/today") return requireRole(user, "technician", () => ok(todayTasksForTechnician(db, user.technicianId)));
  if (method === "POST" && /^\/api\/technician\/tasks\/[^/]+\/status$/.test(path)) return requireRole(user, "technician", () => updateTaskStatus(db, segment(path, 3), body.status === "done" ? "Done" : "Not Done", body));
  if (method === "PATCH" && /^\/api\/tasks\/[^/]+\/status$/.test(path)) return requireLoggedIn(user, () => updateTaskStatus(db, segment(path, 2), body.status || "Done", body));
  if (method === "DELETE" && /^\/api\/tasks\/[^/]+$/.test(path)) return requireAdmin(user, () => deleteById(db, "tasks", segment(path, 2)));
  if (method === "POST" && path === "/api/tickets") return requireLoggedIn(user, () => createTicket(db, body, user));
  if (method === "PATCH" && /^\/api\/tickets\/[^/]+\/assign$/.test(path)) return requireAdmin(user, () => assignTicket(db, segment(path, 2), body));
  if (method === "PATCH" && /^\/api\/tickets\/[^/]+\/schedule$/.test(path)) return requireAdmin(user, () => updateTicket(db, segment(path, 2), { scheduledAt: body.scheduledAt || "" }));
  if (method === "POST" && /^\/api\/tickets\/[^/]+\/accept$/.test(path)) return requireRole(user, "technician", () => updateTicket(db, segment(path, 2), { status: "Acknowledged", latestDetail: "Accepted by technician" }));
  if (method === "POST" && /^\/api\/tickets\/[^/]+\/reject$/.test(path)) return requireRole(user, "technician", () => updateTicket(db, segment(path, 2), { status: "New", assignedTo: "", latestDetail: body.reason || "Rejected" }));
  if (method === "DELETE" && /^\/api\/tickets\/[^/]+\/assignment$/.test(path)) return requireAdmin(user, () => updateTicket(db, segment(path, 2), { status: "New", assignedTo: "", scheduledAt: "" }));
  if (method === "DELETE" && /^\/api\/tickets\/[^/]+$/.test(path)) return requireLoggedIn(user, () => deleteById(db, "tickets", segment(path, 2)));
  if (method === "PATCH" && /^\/api\/tickets\/[^/]+\/status$/.test(path)) return requireLoggedIn(user, () => updateTicket(db, segment(path, 2), { status: body.status, latestDetail: body.detail || body.status, evidencePhotoUrl: body.evidencePhotoUrl || "" }));
  if (method === "PATCH" && /^\/api\/technicians\/[^/]+\/status$/.test(path)) return requireAdmin(user, () => updateTechnician(db, segment(path, 2), { status: body.status }));
  if (method === "POST" && /^\/api\/technicians\/[^/]+\/attendance$/.test(path)) return requireLoggedIn(user, () => createAttendancePlan(db, segment(path, 2), body, user));
  if (method === "POST" && path === "/api/reset") return requireAdmin(user, () => { saveDb(DEFAULT_DB); return ok({ ok: true }); });

  const crud = crudRoute(path, method, body, user, db);
  if (crud) return crud;
  return fail(404, "Unknown API route: " + method + " " + path);
}

function crudRoute(path, method, body, user, db) {
  const routes = [
    { base: "/api/assets", key: "assets", id: "id", prefix: "A-" },
    { base: "/api/outlets", key: "outlets", id: null, prefix: "" },
    { base: "/api/categories", key: "categories", id: "id", prefix: "C-" },
    { base: "/api/technicians", key: "technicians", id: "id", prefix: "T" },
    { base: "/api/admin/users", key: "users", id: "id", prefix: "U-" },
    { base: "/api/assignment-windows", key: "assignmentTimeWindows", id: "id", prefix: "WIN-" },
    { base: "/api/maintenance-rules", key: "maintenanceRules", id: "id", prefix: "MR-" }
  ];
  for (const route of routes) {
    if (path === route.base && method === "POST") return requireAdmin(user, () => createRow(db, route, body));
    if (path.indexOf(route.base + "/") === 0 && method === "PATCH") return requireAdmin(user, () => patchRow(db, route, decodeURIComponent(path.slice(route.base.length + 1)), body));
    if (path.indexOf(route.base + "/") === 0 && method === "DELETE") return requireAdmin(user, () => deleteRow(db, route, decodeURIComponent(path.slice(route.base.length + 1))));
  }
  if (path === "/api/maintenance-rules" && method === "DELETE") return requireAdmin(user, () => { db.maintenanceRules = []; saveDb(db); return ok({ ok: true }); });
  return null;
}

function loadDb() {
  const sheet = dbSheet();
  const finder = sheet.createTextFinder(DB_KEY).matchEntireCell(true).findNext();
  if (!finder) {
    saveDb(DEFAULT_DB);
    return normalizeDb(JSON.parse(JSON.stringify(DEFAULT_DB)));
  }
  const row = finder.getRow();
  const text = String(sheet.getRange(row, 2).getValue() || "");
  if (!text) return normalizeDb(JSON.parse(JSON.stringify(DEFAULT_DB)));
  return normalizeDb(JSON.parse(text));
}

function saveDb(db) {
  const normalized = normalizeDb(db);
  const sheet = dbSheet();
  sheet.getRange(1, 1, 1, 3).setValues([["key", "json", "updated_at"]]);
  sheet.getRange(2, 1, 1, 3).setValues([[DB_KEY, JSON.stringify(normalized), new Date().toISOString()]]);
}

function dbSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DB_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(DB_SHEET_NAME);
  return sheet;
}

function normalizeDb(db) {
  const next = db || {};
  ["users", "outlets", "categories", "assets", "technicians", "tickets", "tasks", "assignmentTimeWindows", "maintenanceRules", "attendancePlans", "ticketHistory"].forEach((key) => {
    if (!Array.isArray(next[key])) next[key] = [];
  });
  if (!next.outletLocations || typeof next.outletLocations !== "object") next.outletLocations = {};
  return next;
}

function normalizePath(path) {
  const raw = String(path || "/");
  const withoutQuery = raw.split("?")[0];
  return withoutQuery.startsWith("/") ? withoutQuery : "/" + withoutQuery;
}

function segment(path, index) {
  return decodeURIComponent(String(path).split("/")[index + 1] || "");
}

function ok(body) {
  return { ok: true, status: 200, body };
}

function fail(status, error) {
  return { ok: false, status, error, body: { error } };
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function userFromHeaders(db, headers) {
  const id = String(headers["X-TicketOps-User"] || headers["x-ticketops-user"] || "");
  return (db.users || []).find((user) => user.id === id) || null;
}

function publicUser(user) {
  const copy = Object.assign({}, user);
  delete copy.password;
  delete copy.passwordHash;
  delete copy.passwordPlain;
  copy.allowedViews = normalizeAllowedViews(copy);
  if (!copy.defaultView || copy.allowedViews.indexOf(copy.defaultView) === -1) copy.defaultView = defaultViewForRole(copy.role);
  return copy;
}

function normalizeAllowedViews(user) {
  if (Array.isArray(user.allowedViews) && user.allowedViews.length) return user.allowedViews;
  if (user.role === "admin") return ["dashboard", "manager", "admin", "masters", "scheduler", "history", "reports"];
  if (user.role === "manager") return ["manager"];
  if (user.role === "technician") return ["technician"];
  return ["dashboard"];
}

function defaultViewForRole(role) {
  if (role === "manager") return "manager";
  if (role === "technician") return "technician";
  return "dashboard";
}

function login(db, body) {
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = (db.users || []).find((item) => String(item.username || "").toLowerCase() === username);
  if (!user) return fail(401, "Invalid username or password");
  const accepted = password === String(user.password || "") || password === String(user.passwordPlain || "") || password === DEFAULT_PASSWORDS[username];
  if (!accepted) return fail(401, "Invalid username or password");
  return ok({ user: publicUser(user) });
}

function changePassword(db, user, body) {
  if (!user) return fail(401, "Login required");
  const next = String(body.newPassword || "");
  if (next.length < 8) return fail(400, "New password must be at least 8 characters");
  if (next !== String(body.confirmPassword || "")) return fail(400, "New password confirmation does not match");
  user.passwordPlain = next;
  saveDb(db);
  return ok({ ok: true });
}

function resetPassword(db, admin, userId, body) {
  if (!admin || admin.role !== "admin") return fail(403, "Only admin can reset passwords");
  const user = (db.users || []).find((item) => item.id === userId);
  if (!user) return fail(404, "User not found");
  const password = String(body.newPassword || ("Tmp-" + Utilities.getUuid().slice(0, 8)));
  if (password.length < 8) return fail(400, "Reset password must be at least 8 characters");
  user.passwordPlain = password;
  saveDb(db);
  return ok({ ok: true, username: user.username, temporaryPassword: password });
}

function requireLoggedIn(user, fn) {
  return user ? fn() : fail(401, "Login required");
}

function requireLogin(user, fn) {
  return requireLoggedIn(user, fn);
}

function requireAdmin(user, fn) {
  return user && user.role === "admin" ? fn() : fail(403, "Only admin can perform this action");
}

function requireRole(user, role, fn) {
  return user && user.role === role ? fn() : fail(403, role + " access only");
}

function scopedDbForUser(db, user) {
  const copy = JSON.parse(JSON.stringify(db));
  if (!user) return copy;
  if (user.role === "manager") {
    const outlets = outletAccessForUser(user, db);
    copy.assets = copy.assets.filter((asset) => outlets.indexOf(asset.outlet) !== -1);
    copy.tasks = copy.tasks.filter((task) => outlets.indexOf(task.outlet) !== -1);
    copy.tickets = copy.tickets.filter((ticket) => outlets.indexOf(ticket.outlet) !== -1);
  }
  if (user.role === "technician" && user.technicianId) {
    copy.technicians = copy.technicians.filter((tech) => tech.id === user.technicianId);
    copy.tasks = copy.tasks.filter((task) => task.assignedTo === user.technicianId);
    copy.tickets = copy.tickets.filter((ticket) => ticket.assignedTo === user.technicianId || ticket.createdBy === user.id);
  }
  return copy;
}

function outletAccessForUser(user, db) {
  if (user.accessAllOutlets) return db.outlets || [];
  if (Array.isArray(user.allowedOutlets) && user.allowedOutlets.length) return user.allowedOutlets;
  return user.outlet ? [user.outlet] : [];
}

function withReports(db, user) {
  const next = JSON.parse(JSON.stringify(db));
  next.users = (next.users || []).map(publicUser);
  next.reports = reports(next);
  next.storage = "google-sheets";
  next.stitch = { configured: false, endpoint: "" };
  return next;
}

function reports(db) {
  const tickets = db.tickets || [];
  const tasks = db.tasks || [];
  const closed = tickets.filter((ticket) => ticket.status === "Closed").length;
  const doneTasks = tasks.filter((task) => task.status === "Done").length;
  return {
    open: tickets.filter((ticket) => ["Closed", "Cancelled"].indexOf(ticket.status) === -1).length,
    closed,
    total: tickets.length,
    taskCompletionRate: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
    technicianCount: (db.technicians || []).length,
    byOutlet: (db.outlets || []).map((outlet) => ({
      outlet,
      count: tickets.filter((ticket) => ticket.outlet === outlet).length,
      open: tickets.filter((ticket) => ticket.outlet === outlet && ["Closed", "Cancelled"].indexOf(ticket.status) === -1).length,
      closed: tickets.filter((ticket) => ticket.outlet === outlet && ticket.status === "Closed").length
    }))
  };
}

function nextId(items, prefix) {
  return prefix + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function createRow(db, route, body) {
  if (route.key === "outlets") {
    const name = String(body.name || "").trim();
    if (!name) return fail(400, "Outlet name is required");
    if (db.outlets.indexOf(name) === -1) db.outlets.push(name);
    db.outletLocations[name] = { branch: body.branch || "", address: body.address || "", latitude: body.latitude || null, longitude: body.longitude || null };
    saveDb(db);
    return ok({ name, reports: reports(db) });
  }
  const row = Object.assign({}, body);
  row.id = row.id || nextId(db[route.key], route.prefix);
  if (route.key === "users" && !row.passwordPlain && row.password) row.passwordPlain = row.password;
  db[route.key].push(row);
  saveDb(db);
  return ok(Object.assign({}, row, { reports: reports(db) }));
}

function patchRow(db, route, id, body) {
  if (route.key === "outlets") {
    const oldName = id;
    const name = String(body.name || oldName).trim();
    db.outlets = db.outlets.map((item) => item === oldName ? name : item);
    db.assets.forEach((item) => { if (item.outlet === oldName) item.outlet = name; });
    db.tickets.forEach((item) => { if (item.outlet === oldName) item.outlet = name; });
    db.tasks.forEach((item) => { if (item.outlet === oldName) item.outlet = name; });
    delete db.outletLocations[oldName];
    db.outletLocations[name] = { branch: body.branch || "", address: body.address || "", latitude: body.latitude || null, longitude: body.longitude || null };
    saveDb(db);
    return ok({ name, reports: reports(db) });
  }
  const item = db[route.key].find((row) => row[route.id] === id);
  if (!item) return fail(404, "Record not found");
  Object.keys(body || {}).forEach((key) => { item[key] = body[key]; });
  saveDb(db);
  return ok(Object.assign({}, item, { reports: reports(db) }));
}

function deleteRow(db, route, id) {
  if (route.key === "outlets") {
    db.outlets = db.outlets.filter((item) => item !== id);
    delete db.outletLocations[id];
  } else {
    db[route.key] = db[route.key].filter((row) => row[route.id] !== id);
  }
  saveDb(db);
  return ok({ ok: true, reports: reports(db) });
}

function deleteById(db, key, id) {
  db[key] = (db[key] || []).filter((item) => item.id !== id);
  saveDb(db);
  return ok({ ok: true, reports: reports(db) });
}

function createTicket(db, body, user) {
  if (!body.outlet || !body.category || !body.impact) return fail(400, "outlet, category and impact are required");
  const ticket = {
    id: nextId(db.tickets, "TK-"),
    outlet: body.outlet,
    category: body.category,
    assetId: body.assetId || "",
    impact: body.impact,
    area: body.area || "",
    note: body.note || "",
    priority: priorityForImpact(body.impact),
    status: body.assignedTo ? "Assigned" : "New",
    assignedTo: body.assignedTo || "",
    scheduledAt: body.scheduledAt || "",
    photoUrl: body.photoUrl || "",
    photoUrls: body.photoUrls || [],
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    latestDetail: body.note || "Created"
  };
  db.tickets.unshift(ticket);
  saveDb(db);
  return { ok: true, status: 201, body: ticket };
}

function priorityForImpact(impact) {
  if (impact === "Service stopped" || impact === "Food safety risk") return "P1";
  if (impact === "Customer visible") return "P2";
  if (impact === "Cosmetic") return "P4";
  return "P3";
}

function updateTicket(db, id, fields) {
  const ticket = db.tickets.find((item) => item.id === id);
  if (!ticket) return fail(404, "Ticket not found");
  Object.keys(fields || {}).forEach((key) => { ticket[key] = fields[key]; });
  ticket.updatedAt = new Date().toISOString();
  saveDb(db);
  return ok({ ticket, reports: reports(db) });
}

function assignTicket(db, id, body) {
  const techId = body.technicianId || body.assignedTo || "";
  return updateTicket(db, id, { assignedTo: techId, scheduledAt: body.scheduledAt || "", status: techId ? "Assigned" : "New", latestDetail: "Assigned" });
}

function updateTechnician(db, id, fields) {
  const tech = db.technicians.find((item) => item.id === id);
  if (!tech) return fail(404, "Technician not found");
  Object.keys(fields || {}).forEach((key) => { tech[key] = fields[key]; });
  saveDb(db);
  return ok({ technician: tech, reports: reports(db) });
}

function updateTaskStatus(db, id, status, body) {
  const task = db.tasks.find((item) => item.id === id);
  if (!task) return fail(404, "Task not found");
  task.status = status;
  task.evidenceComment = body.comment || task.evidenceComment || "";
  task.photoUrl = body.photoUrl || task.photoUrl || "";
  task.completedAt = status === "Done" ? new Date().toISOString() : "";
  saveDb(db);
  return ok({ task, reports: reports(db) });
}

function createAttendancePlan(db, technicianId, body, user) {
  const status = body.status || "Present";
  const tech = db.technicians.find((item) => item.id === technicianId);
  if (!tech) return fail(404, "Technician not found");
  tech.status = status;
  const plan = {
    id: nextId(db.attendancePlans, "ATT-"),
    technicianId,
    status,
    startsAt: body.startsAt || new Date().toISOString(),
    endsAt: body.endsAt || "",
    reason: body.reason || "",
    createdBy: user.name || user.username || "",
    createdAt: new Date().toISOString()
  };
  db.attendancePlans.push(plan);
  saveDb(db);
  return { ok: true, status: 201, body: { plan, reports: reports(db) } };
}

function technicianDashboard(db, technicianId) {
  return {
    technician: (db.technicians || []).find((tech) => tech.id === technicianId) || null,
    tasks: (db.tasks || []).filter((task) => task.assignedTo === technicianId),
    tickets: (db.tickets || []).filter((ticket) => ticket.assignedTo === technicianId)
  };
}

function todayTasksForTechnician(db, technicianId) {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  return (db.tasks || []).filter((task) => task.assignedTo === technicianId && (!task.date || task.date === today));
}

function exportCsv(db, type) {
  const rows = type === "tasks" ? db.tasks : type === "technicians" ? db.technicians : type === "outlets" ? (db.outlets || []).map((name) => ({ name })) : db.tickets;
  const keys = Object.keys(rows[0] || { empty: "" });
  const csv = [keys.join(",")].concat(rows.map((row) => keys.map((key) => csvCell(row[key])).join(","))).join("\n");
  return { filename: "ticketops-" + type + ".csv", csv };
}

function csvCell(value) {
  const text = Array.isArray(value) || typeof value === "object" ? JSON.stringify(value || "") : String(value == null ? "" : value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function monthlyBackup(db, month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return fail(400, "Use month format YYYY-MM");
  return ok({
    type: "ticketops-monthly-backup",
    month,
    createdAt: new Date().toISOString(),
    storage: "google-sheets",
    outlets: db.outlets,
    outletLocations: db.outletLocations,
    categories: db.categories,
    assets: db.assets,
    technicians: db.technicians,
    maintenanceRules: db.maintenanceRules,
    assignmentTimeWindows: db.assignmentTimeWindows,
    tickets: (db.tickets || []).filter((ticket) => String(ticket.createdAt || ticket.updatedAt || "").slice(0, 7) === month),
    tasks: (db.tasks || []).filter((task) => String(task.date || task.createdAt || "").slice(0, 7) === month)
  });
}

function backupReport(backup) {
  const tickets = backup.tickets || [];
  const tasks = backup.tasks || [];
  return {
    month: backup.month,
    totals: {
      tickets: tickets.length,
      openTickets: tickets.filter((ticket) => ["Closed", "Cancelled"].indexOf(ticket.status) === -1).length,
      closedTickets: tickets.filter((ticket) => ticket.status === "Closed").length,
      tasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === "Done").length,
      taskCompletionRate: tasks.length ? Math.round((tasks.filter((task) => task.status === "Done").length / tasks.length) * 100) : 0
    },
    byOutlet: (backup.outlets || []).map((outlet) => ({
      outlet,
      tickets: tickets.filter((ticket) => ticket.outlet === outlet).length,
      closed: tickets.filter((ticket) => ticket.outlet === outlet && ticket.status === "Closed").length,
      tasks: tasks.filter((task) => task.outlet === outlet).length,
      doneTasks: tasks.filter((task) => task.outlet === outlet && task.status === "Done").length
    }))
  };
}
