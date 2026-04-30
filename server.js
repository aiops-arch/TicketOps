require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");
const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const requireSupabaseForProduction = process.env.REQUIRE_SUPABASE === "true";
const supabase = useSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

if (requireSupabaseForProduction && !useSupabase) {
  throw new Error("REQUIRE_SUPABASE=true but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
}

const ACTIVE_STATUSES = ["New", "Assigned", "Acknowledged", "In Progress", "Blocked", "Resolved", "Verification Pending", "Reopened"];
const VALID_TICKET_STATUSES = [...ACTIVE_STATUSES, "Closed", "Cancelled"];
const DETAIL_REQUIRED_STATUSES = {
  Blocked: "Blocked reason is required",
  Reopened: "Reopen/rejection reason is required",
  Resolved: "Resolution note is required"
};
const ASSIGNABLE_STATUSES = ["Present", "Busy", "Emergency Available"];
const ATTENDANCE_STATUSES = ["Present", "Absent", "On Leave", "Off Duty", "Emergency Available"];
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password || ""), salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST).toString("hex");
  return `pbkdf2:${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, storedHash, legacyPassword = "") {
  if (!storedHash) return legacyPassword && String(password || "") === String(legacyPassword);
  const [scheme, iterations, salt, hash] = String(storedHash).split(":");
  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(String(password || ""), salt, Number(iterations), PASSWORD_KEY_LENGTH, PASSWORD_DIGEST);
  const stored = Buffer.from(hash, "hex");
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

function migrateUserPasswords(users) {
  let changed = false;
  const migrated = (users || []).map((user) => {
    if (user.passwordHash) {
      const { password, ...safeUser } = user;
      if (password) changed = true;
      return safeUser;
    }
    if (!user.password) return user;
    const { password, ...safeUser } = user;
    changed = true;
    return { ...safeUser, passwordHash: hashPassword(password) };
  });
  return { users: migrated, changed };
}

const DEMO_USERS = [
  {
    id: "U-ADMIN-AIOPS",
    username: "aiops",
    password: "AIops",
    name: "AIops",
    post: "Admin Control Panel Operator",
    role: "admin",
    accessAllOutlets: true,
    allowedOutlets: [],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "reports"]
  },
  {
    id: "U-ADMIN-CHINTAN",
    username: "chintan.patel",
    password: "chintan123",
    name: "Chintan Patel",
    post: "Admin Control Panel Operator",
    role: "admin",
    accessAllOutlets: true,
    allowedOutlets: [],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "reports"]
  },
  {
    id: "U-ADMIN-MEET",
    username: "meet.patel",
    password: "meet123",
    name: "Meet Patel",
    post: "Admin Control Panel Operator",
    role: "admin",
    accessAllOutlets: true,
    allowedOutlets: [],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "reports"]
  },
  {
    id: "U-MGR-PRATIK",
    username: "pratik.patel",
    password: "pratik123",
    name: "Pratik Patel",
    post: "Outlet Manager",
    role: "manager",
    outlet: "aiko surat",
    accessAllOutlets: true,
    allowedOutlets: [],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "manager", "reports"]
  },
  {
    id: "U-MGR-HUSSAIN",
    username: "hussain.sheikh",
    password: "hussain123",
    name: "Hussain Sheikh",
    post: "Outlet Manager",
    role: "manager",
    outlet: "Capiche",
    accessAllOutlets: true,
    allowedOutlets: [],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "manager", "reports"]
  },
  {
    id: "U-TECH-VICKY",
    username: "vicky",
    password: "vicky123",
    name: "Vicky",
    post: "Technician",
    role: "technician",
    technicianId: "T1",
    accessAllOutlets: false,
    allowedOutlets: ["aiko surat", "Capiche"],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "technician", "reports"]
  },
  {
    id: "U-TECH-RAHUL",
    username: "rahul.patil",
    password: "rahul123",
    name: "Rahul Patil",
    post: "Technician",
    role: "technician",
    technicianId: "T2",
    accessAllOutlets: false,
    allowedOutlets: ["aiko surat"],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "technician", "reports"]
  },
  {
    id: "U-TECH-ABRAR",
    username: "abrar",
    password: "abrar123",
    name: "Abrar",
    post: "Technician",
    role: "technician",
    technicianId: "T3",
    accessAllOutlets: false,
    allowedOutlets: ["Capiche"],
    defaultView: "dashboard",
    allowedViews: ["dashboard", "technician", "reports"]
  }
];

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(express.static(__dirname));

const seed = {
  users: DEMO_USERS,
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
  assets: [
    {
      id: "A-1001",
      outlet: "aiko surat",
      category: "Refrigeration",
      name: "Walk-in Freezer",
      code: "AIKO-REF-01",
      status: "Active",
      notes: "Primary cold storage"
    },
    {
      id: "A-1002",
      outlet: "Capiche",
      category: "Plumbing",
      name: "Dishwash Drain Line",
      code: "CAP-PLUMB-01",
      status: "Active",
      notes: "Back-of-house wash area"
    }
  ],
  tasks: [],
  maintenanceRules: [],
  technicians: [
    { id: "T1", name: "Vicky", skill: "AC", status: "Present", workload: 0, quality: 92, serviceOutlets: ["aiko surat", "Capiche"] },
    { id: "T2", name: "Rahul Patil", skill: "Refrigeration", status: "Present", workload: 0, quality: 95, serviceOutlets: ["aiko surat"] },
    { id: "T3", name: "Abrar", skill: "Plumbing", status: "Break", workload: 0, quality: 89, serviceOutlets: ["Capiche"] }
  ],
  attendancePlans: [],
  tickets: [
    {
      id: "TK-1001",
      outlet: "aiko surat",
      category: "Refrigeration",
      impact: "Food safety risk",
      note: "Freezer temperature rising",
      priority: "P1",
      status: "New",
      assignedTo: "",
      latestDetail: "",
      createdBy: "U-MGR-PRATIK",
      createdAt: "2026-04-25T00:00:00.000Z",
      history: [{ at: "2026-04-25T00:00:00.000Z", action: "Ticket created by Pratik Patel" }]
    },
    {
      id: "TK-1002",
      outlet: "Capiche",
      category: "Plumbing",
      impact: "Normal repair",
      note: "Dishwash area drain slow",
      priority: "P3",
      status: "Assigned",
      assignedTo: "T3",
      latestDetail: "",
      createdBy: "U-MGR-HUSSAIN",
      createdAt: "2026-04-25T00:00:00.000Z",
      history: [
        { at: "2026-04-25T00:00:00.000Z", action: "Ticket created" },
        { at: "2026-04-25T00:00:00.000Z", action: "Assigned to Abrar" }
      ]
    }
  ]
};

const DAILY_TASK_TEMPLATES = [
  { phase: "Morning Opening", group: "Equipment Check", category: "Refrigeration", title: "Refrigerator temperature checked (2-5 C)" },
  { phase: "Morning Opening", group: "Equipment Check", category: "Refrigeration", title: "Freezer working (-18 C or below)" },
  { phase: "Morning Opening", group: "Equipment Check", category: "Kitchen Equipment", title: "Gas stove / burners functional" },
  { phase: "Morning Opening", group: "Equipment Check", category: "Kitchen Equipment", title: "Coffee machine powered and cleaned" },
  { phase: "Morning Opening", group: "Equipment Check", category: "Kitchen Equipment", title: "Ice machine running properly" },
  { phase: "Morning Opening", group: "Hygiene & Safety", category: "Kitchen Equipment", title: "Kitchen cleaned and sanitized" },
  { phase: "Morning Opening", group: "Hygiene & Safety", category: "Kitchen Equipment", title: "Handwash stations stocked" },
  { phase: "Morning Opening", group: "Hygiene & Safety", category: "Kitchen Equipment", title: "Pest check completed" },
  { phase: "Morning Opening", group: "Hygiene & Safety", category: "Kitchen Equipment", title: "Floor dry and non-slippery" },
  { phase: "Morning Opening", group: "Utilities Check", category: "Electrical", title: "Electricity supply stable" },
  { phase: "Morning Opening", group: "Utilities Check", category: "Plumbing", title: "Water supply working" },
  { phase: "Morning Opening", group: "Utilities Check", category: "Electrical", title: "Backup generator status checked" },
  { phase: "Mid-Day", group: "Equipment Monitoring", category: "Kitchen Equipment", title: "Cooking equipment temperature stable" },
  { phase: "Mid-Day", group: "Equipment Monitoring", category: "Refrigeration", title: "Refrigeration doors sealing properly" },
  { phase: "Mid-Day", group: "Equipment Monitoring", category: "Electrical", title: "POS system working" },
  { phase: "Mid-Day", group: "Safety Checks", category: "Kitchen Equipment", title: "Fire extinguisher accessible" },
  { phase: "Mid-Day", group: "Safety Checks", category: "Kitchen Equipment", title: "No gas smell or leaks" },
  { phase: "Mid-Day", group: "Safety Checks", category: "AC", title: "Exhaust system working" },
  { phase: "Closing", group: "Cleaning & Shutdown", category: "Kitchen Equipment", title: "Kitchen deep cleaned" },
  { phase: "Closing", group: "Cleaning & Shutdown", category: "Plumbing", title: "Grease traps cleaned" },
  { phase: "Closing", group: "Cleaning & Shutdown", category: "Kitchen Equipment", title: "Waste disposed properly" },
  { phase: "Closing", group: "Cleaning & Shutdown", category: "Kitchen Equipment", title: "Floors mopped and dried" },
  { phase: "Closing", group: "Equipment Shutdown", category: "Kitchen Equipment", title: "Ovens turned off" },
  { phase: "Closing", group: "Equipment Shutdown", category: "Kitchen Equipment", title: "Gas valves closed" },
  { phase: "Closing", group: "Equipment Shutdown", category: "Electrical", title: "Lights switched off" },
  { phase: "Closing", group: "Equipment Shutdown", category: "Electrical", title: "Non-essential appliances powered down" },
  { phase: "Closing", group: "Maintenance Logging", category: "Kitchen Equipment", title: "Any equipment issues logged" },
  { phase: "Closing", group: "Maintenance Logging", category: "Kitchen Equipment", title: "Tickets raised for faulty assets" },
  { phase: "Closing", group: "Maintenance Logging", category: "Kitchen Equipment", title: "Tasks marked completed in system" }
];

const WEEKLY_TASK_TEMPLATES = [
  { category: "Refrigeration", title: "Clean refrigerator coils" },
  { category: "AC", title: "Deep clean exhaust system" },
  { category: "Plumbing", title: "Inspect plumbing for leaks" },
  { category: "Kitchen Equipment", title: "Calibrate kitchen equipment" },
  { category: "Kitchen Equipment", title: "Check fire safety equipment expiry" },
  { category: "Kitchen Equipment", title: "Pest control treatment" }
];

function defaultMaintenanceRules() {
  return [
    ...DAILY_TASK_TEMPLATES.map((template, index) => ({
      id: `MR-D-${String(index + 1).padStart(3, "0")}`,
      category: template.category,
      title: template.title,
      phase: template.phase,
      group: template.group,
      frequency: "daily",
      active: true,
      createdAt: new Date("2026-04-27T00:00:00.000Z").toISOString()
    })),
    ...WEEKLY_TASK_TEMPLATES.map((template, index) => ({
      id: `MR-W-${String(index + 1).padStart(3, "0")}`,
      category: template.category,
      title: template.title,
      phase: "Weekly",
      group: "Weekly Maintenance",
      frequency: "weekly",
      active: true,
      createdAt: new Date("2026-04-27T00:00:00.000Z").toISOString()
    }))
  ];
}

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
}

function readJsonDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  let shouldPersist = false;
  if (!Array.isArray(db.users)) {
    db.users = DEMO_USERS;
    shouldPersist = true;
  }
  const migratedUsers = migrateUserPasswords(db.users);
  db.users = migratedUsers.users;
  if (migratedUsers.changed) shouldPersist = true;
  if (!Array.isArray(db.attendancePlans)) db.attendancePlans = [];
  if (!Array.isArray(db.categories)) db.categories = seed.categories;
  if (!Array.isArray(db.assets)) db.assets = seed.assets;
  if (!Array.isArray(db.tasks)) db.tasks = [];
  if (!Array.isArray(db.maintenanceRules)) {
    db.maintenanceRules = defaultMaintenanceRules();
    shouldPersist = true;
  }
  db.technicians = (db.technicians || []).map((tech) => {
    const seeded = seed.technicians.find((item) => item.id === tech.id) || {};
    return {
      ...tech,
      quality: Number(tech.quality || seeded.quality || 90),
      serviceOutlets: Array.isArray(tech.serviceOutlets) && tech.serviceOutlets.length
        ? tech.serviceOutlets
        : (seeded.serviceOutlets || db.outlets || [])
    };
  });
  if (generateTodayTasks(db) > 0) shouldPersist = true;
  if (rebalanceTodayChecklistTasks(db)) shouldPersist = true;
  if (shouldPersist) writeJsonDb(db);
  return db;
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

function ticketRequiresPhoto({ impact = "", category = "", note = "" } = {}) {
  const text = `${impact} ${category} ${note}`.toLowerCase();
  return /(food safety|service stopped|gas|electrical|spark|leak|water|flood|freezer|refrigerator|temperature|broken|fire)/.test(text);
}

function sanitizePhotoUrl(value) {
  const photoUrl = String(value || "").trim();
  if (!photoUrl) return "";
  if (!photoUrl.startsWith("data:image/")) return "";
  return photoUrl.length <= 3_000_000 ? photoUrl : "";
}

function sanitizePhotoUrls(value, limit = 5) {
  const source = Array.isArray(value) ? value : [value];
  return source
    .map(sanitizePhotoUrl)
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeScheduledAt(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function isTicketScheduleDue(ticket) {
  if (!ticket?.scheduledAt) return true;
  const scheduled = new Date(ticket.scheduledAt).getTime();
  return Number.isNaN(scheduled) || scheduled <= Date.now();
}

function taskRequiresEvidence(task) {
  const text = `${task.title || ""} ${task.notes || ""}`.toLowerCase();
  return /(temperature|freezer|refrigerator|gas|fire|extinguisher|leak|pest|safety)/.test(text);
}

function nextTicketId(tickets) {
  const max = tickets.reduce((highest, ticket) => {
    const number = Number(String(ticket.id).replace("TK-", ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 1000);
  return `TK-${max + 1}`;
}

function nextAssetId(assets) {
  const max = assets.reduce((highest, asset) => {
    const number = Number(String(asset.id).replace("A-", ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 1000);
  return `A-${max + 1}`;
}

function nextTechnicianId(technicians) {
  const max = technicians.reduce((highest, tech) => {
    const number = Number(String(tech.id).replace("T", ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `T${max + 1}`;
}

function nextMaintenanceRuleId(rules) {
  const max = (rules || []).reduce((highest, rule) => {
    const number = Number(String(rule.id || "").replace("MR-", "").replace(/^D-/, "").replace(/^W-/, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `MR-${max + 1}`;
}

function slugUsername(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.+/g, ".")
    .slice(0, 40) || "technician";
}

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeOutletList(value, db) {
  const requested = Array.isArray(value) ? value : [value];
  const seen = new Set();
  return requested
    .map((item) => String(item || "").trim())
    .filter((item) => item && (db.outlets || []).includes(item))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function allowedViewsForRole(role) {
  if (role === "admin") return ["dashboard", "manager", "admin", "masters", "scheduler", "reports"];
  if (role === "manager") return ["dashboard", "manager", "reports"];
  return ["dashboard", "technician", "reports"];
}

function makeUniqueUsername(users, baseUsername) {
  const usernames = new Set((users || []).map((user) => String(user.username || "").toLowerCase()));
  let username = baseUsername;
  let suffix = 2;
  while (usernames.has(username)) {
    username = `${baseUsername}.${suffix}`;
    suffix += 1;
  }
  return username;
}

function categoryIdFromName(name) {
  return `C-${String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28)}`;
}

function activeWorkload(db, technicianId) {
  return db.tickets.filter((ticket) =>
    ticket.assignedTo === technicianId && !["Closed", "Cancelled"].includes(ticket.status)
  ).length;
}

function dateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function activeAttendancePlan(db, technicianId, day = dateKey()) {
  return (db.attendancePlans || [])
    .filter((plan) => plan.technicianId === technicianId && plan.active !== false && plan.from <= day && plan.to >= day)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0] || null;
}

function upcomingAttendancePlans(db, technicianId, day = dateKey()) {
  return (db.attendancePlans || [])
    .filter((plan) => plan.technicianId === technicianId && plan.active !== false && plan.to >= day)
    .sort((a, b) => String(a.from).localeCompare(String(b.from)))
    .slice(0, 3);
}

function checklistTechnicians(db) {
  return [...(db.technicians || [])].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function balancedChecklistTechnician(technicians, loadMap) {
  if (!technicians.length) return null;
  return technicians.reduce((selected, technician) => {
    if (!selected) return technician;
    const selectedLoad = loadMap.get(selected.id) || 0;
    const technicianLoad = loadMap.get(technician.id) || 0;
    if (technicianLoad < selectedLoad) return technician;
    if (technicianLoad === selectedLoad && String(technician.name).localeCompare(String(selected.name)) < 0) return technician;
    return selected;
  }, null);
}

function isChecklistTask(task) {
  const title = String(task.title || "");
  return title.startsWith("Morning Opening:")
    || title.startsWith("Mid-Day:")
    || title.startsWith("Closing:")
    || title.startsWith("Weekly:")
    || title.startsWith("Daily check");
}

function rebalanceTodayChecklistTasks(db) {
  const today = dateKey();
  const technicians = checklistTechnicians(db);
  if (!technicians.length) return false;

  const loadMap = new Map(technicians.map((tech) => [tech.id, 0]));
  (db.tasks || [])
    .filter((task) => task.date === today && task.status === "Done" && isChecklistTask(task))
    .forEach((task) => {
      if (loadMap.has(task.assignedTo)) loadMap.set(task.assignedTo, (loadMap.get(task.assignedTo) || 0) + 1);
    });

  let changed = false;
  (db.tasks || [])
    .filter((task) => task.date === today && task.status !== "Done" && isChecklistTask(task))
    .sort((a, b) => String(a.outlet || "").localeCompare(String(b.outlet || "")) || String(a.title || "").localeCompare(String(b.title || "")))
    .forEach((task) => {
      const technician = balancedChecklistTechnician(technicians, loadMap);
      if (!technician) return;
      if (task.assignedTo !== technician.id) {
        task.assignedTo = technician.id;
        changed = true;
      }
      loadMap.set(technician.id, (loadMap.get(technician.id) || 0) + 1);
    });

  return changed;
}

function generateTodayTasks(db) {
  const today = dateKey();
  const isMonday = new Date(`${today}T00:00:00`).getDay() === 1;
  const rules = (db.maintenanceRules || defaultMaintenanceRules()).filter((rule) =>
    rule.active !== false && (rule.frequency === "daily" || (rule.frequency === "weekly" && isMonday))
  );
  const tasks = [];
  const technicians = checklistTechnicians(db);
  const loadMap = new Map(technicians.map((tech) => [
    tech.id,
    (db.tasks || []).filter((task) => task.date === today && task.assignedTo === tech.id && isChecklistTask(task)).length
  ]));
  const existingTaskKeys = new Set((db.tasks || []).map((task) => `${task.date}|${task.outlet}|${task.title}`));
  const existingTaskIds = new Set((db.tasks || []).map((task) => task.id));
  let sequence = (db.tasks || []).filter((task) => task.date === today).length + 1;

  function nextTaskId() {
    let id = `TASK-${today.replaceAll("-", "")}-${String(sequence).padStart(3, "0")}`;
    while (existingTaskIds.has(id)) {
      sequence += 1;
      id = `TASK-${today.replaceAll("-", "")}-${String(sequence).padStart(3, "0")}`;
    }
    existingTaskIds.add(id);
    sequence += 1;
    return id;
  }

  (db.outlets || []).forEach((outlet) => {
    const outletAssets = (db.assets || []).filter((asset) => asset.status === "Active" && asset.outlet === outlet);

    rules.forEach((rule) => {
      const asset = outletAssets.find((item) => item.category === rule.category) || outletAssets[0];
      const technician = balancedChecklistTechnician(technicians, loadMap);

      if (!asset || !technician) return;
      const title = `${rule.phase || "Checklist"}: ${rule.title}`;
      const taskKey = `${today}|${outlet}|${title}`;
      if (existingTaskKeys.has(taskKey)) return;
      existingTaskKeys.add(taskKey);

      tasks.push({
        id: nextTaskId(),
        title,
        assetId: asset.id,
        outlet,
        assignedTo: technician.id,
        status: "Pending",
        date: today,
        completedAt: "",
        notes: `${rule.group || "Maintenance"} / ${rule.frequency === "weekly" ? "Weekly" : "Daily"}`
      });
      loadMap.set(technician.id, (loadMap.get(technician.id) || 0) + 1);
    });
  });

  db.tasks.push(...tasks);
  return tasks.length;
}

function assetById(db, assetId) {
  return (db.assets || []).find((asset) => asset.id === assetId);
}

function technicianWithAttendance(db, tech) {
  const activePlan = activeAttendancePlan(db, tech.id);
  return {
    ...tech,
    quality: Number(tech.quality || 90),
    serviceOutlets: Array.isArray(tech.serviceOutlets) && tech.serviceOutlets.length ? tech.serviceOutlets : db.outlets,
    baseStatus: tech.status,
    status: activePlan ? activePlan.status : tech.status,
    activeAttendancePlan: activePlan,
    attendancePlans: upcomingAttendancePlans(db, tech.id)
  };
}

function isAssignable(db, tech, ticket) {
  const effective = technicianWithAttendance(db, tech);
  const servesOutlet = (effective.serviceOutlets || []).includes(ticket.outlet);
  return servesOutlet && (effective.status === "Present" || (ticket.priority === "P1" && effective.status === "Emergency Available"));
}

function releaseEarlyAssignments(db, technicianId, reason) {
  const released = [];
  db.tickets
    .filter((ticket) => ticket.assignedTo === technicianId && ["Assigned", "Acknowledged"].includes(ticket.status))
    .forEach((ticket) => {
      ticket.assignedTo = "";
      ticket.status = "New";
      ticket.history.push({
        at: new Date().toISOString(),
        action: reason
      });
      released.push(ticket);
    });
  return released;
}

function dispatchScore(db, tech, ticket) {
  const workload = activeWorkload(db, tech.id);
  const skillMatch = tech.skill === ticket.category;
  const outletMatch = (tech.serviceOutlets || []).includes(ticket.outlet);
  const emergencyFit = ticket.priority === "P1" && tech.status === "Emergency Available";
  const presentFit = tech.status === "Present";
  const qualityScore = Number(tech.quality || tech.rating || 90);

  return {
    score: (skillMatch ? 62 : 18) + (outletMatch ? 24 : -100) + (presentFit ? 18 : 0) + (emergencyFit ? 12 : 0) + (qualityScore / 10) - (workload * 14),
    workload,
    skillMatch,
    outletMatch,
    qualityScore
  };
}

function smartSuggestion(db, ticket) {
  const eligible = db.technicians
    .filter((tech) => isAssignable(db, tech, ticket))
    .map((tech) => {
      const effective = technicianWithAttendance(db, tech);
      const score = dispatchScore(db, effective, ticket);
      return {
        ...effective,
        workload: score.workload,
        dispatchScore: Math.round(score.score),
        dispatchReason: score.skillMatch
          ? `${effective.skill} match / serves ${ticket.outlet} / ${score.workload} active job${score.workload === 1 ? "" : "s"} / ${effective.status} / ${score.qualityScore}% quality`
          : `Best available backup / serves ${ticket.outlet} / ${score.workload} active job${score.workload === 1 ? "" : "s"} / ${effective.status} / ${score.qualityScore}% quality`
      };
    });

  return eligible.sort((a, b) => b.dispatchScore - a.dispatchScore || a.workload - b.workload || a.name.localeCompare(b.name))[0] || null;
}

function reports(db) {
  const openTickets = db.tickets.filter((ticket) => ticket.status !== "Closed");
  const technicians = db.technicians.map((tech) => technicianWithAttendance(db, tech));
  const assets = db.assets || [];
  const tasks = db.tasks || [];
  const today = dateKey();
  const todayTasks = tasks.filter((task) => task.date === today);
  const completedToday = todayTasks.filter((task) => task.status === "Done").length;
  const pendingToday = todayTasks.filter((task) => task.status !== "Done").length;
  const closedTickets = db.tickets.filter((ticket) => ticket.status === "Closed");
  const alerts = openTickets.flatMap((ticket) => {
    const ticketAlerts = [];
    if (ticket.priority === "P1") ticketAlerts.push({ type: "critical", ticketId: ticket.id, message: "Critical ticket open" });
    if (!ticket.assignedTo) ticketAlerts.push({ type: "unassigned", ticketId: ticket.id, message: "Ticket needs assignment" });
    if (ticket.status === "Blocked") ticketAlerts.push({ type: "blocked", ticketId: ticket.id, message: "Blocked ticket needs admin action" });
    if (ticket.status === "Reopened") ticketAlerts.push({ type: "reopened", ticketId: ticket.id, message: "Reopened ticket needs review" });
    if (ticket.status === "Resolved" || ticket.status === "Verification Pending") {
      ticketAlerts.push({ type: "verification", ticketId: ticket.id, message: "Manager verification pending" });
    }
    return ticketAlerts;
  });

  return {
    open: openTickets.length,
    critical: openTickets.filter((ticket) => ticket.priority === "P1").length,
    unassigned: openTickets.filter((ticket) => !ticket.assignedTo).length,
    blocked: openTickets.filter((ticket) => ticket.status === "Blocked").length,
    reopened: openTickets.filter((ticket) => ticket.status === "Reopened").length,
    closed: db.tickets.filter((ticket) => ticket.status === "Closed").length,
    assets: assets.length,
    activeAssets: assets.filter((asset) => asset.status === "Active").length,
    pendingTasks: pendingToday,
    completedTasks: completedToday,
    taskCompletionRate: todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 100,
    verificationPending: openTickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Verification Pending").length,
    avgClosureHours: closedTickets.length
      ? Math.round(closedTickets.reduce((sum, ticket) => {
        const start = new Date(ticket.createdAt || Date.now()).getTime();
        const closed = new Date((ticket.history || []).findLast?.((item) => /closed|approved/i.test(item.action || ""))?.at || ticket.updatedAt || Date.now()).getTime();
        return sum + Math.max(0, closed - start) / 36e5;
      }, 0) / closedTickets.length)
      : 0,
    presentTechnicians: technicians.filter((tech) => tech.status === "Present").length,
    technicianCount: db.technicians.length,
    unavailableTechnicians: technicians.filter((tech) => !ASSIGNABLE_STATUSES.includes(tech.status)).length,
    byOutlet: db.outlets.map((outlet) => ({
      outlet,
      count: db.tickets.filter((ticket) => ticket.outlet === outlet).length,
      open: openTickets.filter((ticket) => ticket.outlet === outlet).length,
      critical: openTickets.filter((ticket) => ticket.outlet === outlet && ticket.priority === "P1").length,
      blocked: openTickets.filter((ticket) => ticket.outlet === outlet && ticket.status === "Blocked").length,
      pendingTasks: todayTasks.filter((task) => task.outlet === outlet && task.status !== "Done").length,
      completedTasks: todayTasks.filter((task) => task.outlet === outlet && task.status === "Done").length
    })),
    technicianWorkload: technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      status: tech.status,
      serviceOutlets: tech.serviceOutlets,
      quality: tech.quality,
      activeAttendancePlan: tech.activeAttendancePlan,
      openTickets: activeWorkload(db, tech.id)
    })),
    alerts
  };
}

function notificationsForUser(db, user) {
  if (!user) return [];
  const openTickets = (db.tickets || []).filter((ticket) => !["Closed", "Cancelled"].includes(ticket.status));
  const userOutlets = outletAccessForUser(user, db);
  if (user.role === "technician") {
    return openTickets
    .filter((ticket) => {
      if (ticket.assignedTo !== user.technicianId || !["Assigned", "Reopened", "Blocked"].includes(ticket.status)) return false;
      if (!ticket.scheduledAt) return true;
      return new Date(ticket.scheduledAt).getTime() <= Date.now();
    })
      .map((ticket) => ({
        type: ticket.status === "Assigned" ? "assigned" : token(ticket.status),
        ticketId: ticket.id,
        message: ticket.status === "Assigned" ? "New ticket assigned to you" : `Ticket ${ticket.status.toLowerCase()} needs attention`
      }));
  }
  if (user.role === "manager") {
    return openTickets
      .filter((ticket) => userOutlets.includes(ticket.outlet) && ["Resolved", "Verification Pending", "Reopened", "Blocked"].includes(ticket.status))
      .map((ticket) => ({
        type: token(ticket.status),
        ticketId: ticket.id,
        message: ticket.status === "Resolved" || ticket.status === "Verification Pending" ? "Ticket is ready for manager closure" : "Ticket needs manager attention"
      }));
  }
  return openTickets
    .filter((ticket) => !ticket.assignedTo || ["Blocked", "Reopened"].includes(ticket.status))
    .map((ticket) => ({
      type: !ticket.assignedTo ? "unassigned" : token(ticket.status),
      ticketId: ticket.id,
      message: !ticket.assignedTo ? "Ticket is waiting for technician assignment" : "Ticket needs admin attention"
    }));
}

function outletAccessForUser(user, db) {
  const outlets = db.outlets || [];
  if (!user) return [];
  if (user.accessAllOutlets) return [...outlets];
  const allowed = Array.isArray(user.allowedOutlets) ? user.allowedOutlets.filter((outlet) => outlets.includes(outlet)) : [];
  if (allowed.length) return allowed;
  if (user.outlet && outlets.includes(user.outlet)) return [user.outlet];
  if (user.role === "admin") return [...outlets];
  return [];
}

function canUserAccessOutlet(user, db, outlet) {
  if (!user || !outlet) return false;
  if (user.role === "technician") return true;
  return outletAccessForUser(user, db).includes(outlet);
}

function withSuggestions(db, user = null) {
  const { users, ...publicDb } = db;
  return {
    ...publicDb,
    technicians: db.technicians.map((tech) => technicianWithAttendance(db, tech)),
    tasks: (db.tasks || []).map((task) => ({
      ...task,
      asset: assetById(db, task.assetId) || null
    })),
    maintenanceRules: db.maintenanceRules || [],
    tickets: db.tickets.map((ticket) => ({
      ...ticket,
      asset: assetById(db, ticket.assetId) || null,
      suggestedTechnician: smartSuggestion(db, ticket)
    })),
    reports: reports(db),
    notifications: notificationsForUser(db, user),
    storage: useSupabase ? "supabase" : "json"
  };
}

function technicianDashboard(db, technicianId) {
  const today = dateKey();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekKey = dateKey(weekStart);
  const tasks = (db.tasks || []).filter((task) => task.assignedTo === technicianId);
  const tickets = (db.tickets || []).filter((ticket) => ticket.assignedTo === technicianId);
  const todayTasks = tasks
    .filter((task) => task.date === today)
    .map((task) => ({
      id: task.id,
      title: task.title,
      asset_name: assetById(db, task.assetId)?.name || "Asset",
      status: task.status === "Done" ? "done" : "pending"
    }));
  const openTickets = tickets.filter((ticket) => !["Closed", "Cancelled"].includes(ticket.status));

  return {
    today: {
      completed_tasks: todayTasks.filter((task) => task.status === "done").length,
      pending_tasks: todayTasks.filter((task) => task.status === "pending").length,
      overdue_tasks: tasks.filter((task) => task.date < today && task.status !== "Done").length,
      open_tickets: openTickets.length
    },
    weekly: {
      tasks_completed: tasks.filter((task) => task.status === "Done" && task.date >= weekKey).length,
      tickets_resolved: tickets.filter((ticket) => ["Closed", "Resolved", "Verification Pending"].includes(ticket.status) && dateKey(ticket.createdAt) >= weekKey).length
    },
    tasks: todayTasks,
    tickets: openTickets.map((ticket) => ({
      id: ticket.id,
      description: ticket.note,
      status: token(ticket.status).replaceAll("-", "_")
    }))
  };
}

function todayTasksForTechnician(db, technicianId) {
  const today = dateKey();
  const phaseOrder = ["Morning Opening", "Mid-Day", "Closing", "Weekly", "Checklist"];
  const phaseRank = (title = "") => {
    const [phase] = String(title).split(":");
    return phaseOrder.indexOf(phase && phase !== title ? phase : "Checklist");
  };
  return (db.tasks || [])
    .filter((task) => task.assignedTo === technicianId && task.date === today)
    .sort((a, b) => phaseRank(a.title) - phaseRank(b.title) || String(a.title).localeCompare(String(b.title)))
    .map((task) => ({
      id: task.id,
      title: task.title,
      asset_name: assetById(db, task.assetId)?.name || "Asset",
      status: task.status === "Done" ? "done" : "pending"
    }));
}

function csvEscape(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

function technicianName(db, id) {
  return (db.technicians || []).find((tech) => tech.id === id)?.name || "";
}

function exportCsv(db, type) {
  if (type === "tasks") {
    const headers = ["date", "outlet", "technician", "task", "asset", "status", "evidence_required", "evidence_status", "evidence_comment", "completed_at"];
    const rows = (db.tasks || []).map((task) => ({
      date: task.date,
      outlet: task.outlet,
      technician: technicianName(db, task.assignedTo),
      task: task.title,
      asset: assetById(db, task.assetId)?.name || "",
      status: task.status,
      evidence_required: taskRequiresEvidence(task) ? "yes" : "no",
      evidence_status: task.evidencePhotoUrl || task.evidenceComment ? "provided" : "missing",
      evidence_comment: task.evidenceComment || "",
      completed_at: task.completedAt || ""
    }));
    return { filename: `ticketops-tasks-${dateKey()}.csv`, csv: toCsv(headers, rows) };
  }

  if (type === "tickets") {
    const headers = ["ticket_id", "outlet", "area", "asset", "category", "impact", "priority", "status", "assigned_technician", "created_by", "has_photo", "latest_detail", "created_at"];
    const rows = (db.tickets || []).map((ticket) => ({
      ticket_id: ticket.id,
      outlet: ticket.outlet,
      area: ticket.area || "",
      asset: assetById(db, ticket.assetId)?.name || "",
      category: ticket.category,
      impact: ticket.impact,
      priority: ticket.priority,
      status: ticket.status,
      assigned_technician: technicianName(db, ticket.assignedTo),
      created_by: ticket.createdBy || "",
      has_photo: ticket.photoUrl ? "yes" : "no",
      latest_detail: ticket.latestDetail || "",
      created_at: ticket.createdAt || ""
    }));
    return { filename: `ticketops-tickets-${dateKey()}.csv`, csv: toCsv(headers, rows) };
  }

  if (type === "technicians") {
    const today = dateKey();
    const headers = ["technician", "status", "skill", "service_outlets", "completed_tasks", "pending_tasks", "active_tickets", "blocked_tickets"];
    const rows = (db.technicians || []).map((tech) => {
      const tasks = (db.tasks || []).filter((task) => task.assignedTo === tech.id && task.date === today);
      const tickets = (db.tickets || []).filter((ticket) => ticket.assignedTo === tech.id && ticket.status !== "Closed");
      return {
        technician: tech.name,
        status: technicianWithAttendance(db, tech).status,
        skill: tech.skill,
        service_outlets: (tech.serviceOutlets || []).join(" | "),
        completed_tasks: tasks.filter((task) => task.status === "Done").length,
        pending_tasks: tasks.filter((task) => task.status !== "Done").length,
        active_tickets: tickets.length,
        blocked_tickets: tickets.filter((ticket) => ticket.status === "Blocked").length
      };
    });
    return { filename: `ticketops-technicians-${dateKey()}.csv`, csv: toCsv(headers, rows) };
  }

  if (type === "outlets") {
    const today = dateKey();
    const headers = ["outlet", "open_tickets", "critical_tickets", "blocked_tickets", "completed_tasks_today", "pending_tasks_today", "active_assets"];
    const rows = (db.outlets || []).map((outlet) => {
      const tickets = (db.tickets || []).filter((ticket) => ticket.outlet === outlet && ticket.status !== "Closed");
      const tasks = (db.tasks || []).filter((task) => task.outlet === outlet && task.date === today);
      return {
        outlet,
        open_tickets: tickets.length,
        critical_tickets: tickets.filter((ticket) => ticket.priority === "P1").length,
        blocked_tickets: tickets.filter((ticket) => ticket.status === "Blocked").length,
        completed_tasks_today: tasks.filter((task) => task.status === "Done").length,
        pending_tasks_today: tasks.filter((task) => task.status !== "Done").length,
        active_assets: (db.assets || []).filter((asset) => asset.outlet === outlet && asset.status === "Active").length
      };
    });
    return { filename: `ticketops-outlets-${dateKey()}.csv`, csv: toCsv(headers, rows) };
  }

  return null;
}

function mapTicket(row, history = []) {
  return {
    id: row.id,
    outlet: row.outlet,
    category: row.category,
    assetId: row.asset_id || "",
    impact: row.impact,
    area: row.area || "",
    note: row.note,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assigned_to || "",
    scheduledAt: row.scheduled_at || "",
    latestDetail: row.latest_detail || "",
    photoUrl: row.photo_url || "",
    photoUrls: row.photo_urls?.length ? row.photo_urls : (row.photo_url ? [row.photo_url] : []),
    resolutionPhotoUrls: row.resolution_photo_urls || [],
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    history
  };
}

function mapAsset(row) {
  return {
    id: row.id,
    outlet: row.outlet,
    category: row.category,
    name: row.name,
    code: row.code || "",
    status: row.status || "Active",
    notes: row.notes || "",
    createdAt: row.created_at
  };
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    assetId: row.asset_id,
    outlet: row.outlet,
    assignedTo: row.assigned_to,
    status: row.status,
    date: row.task_date,
    completedAt: row.completed_at || "",
    evidenceComment: row.evidence_comment || "",
    evidencePhotoUrl: row.evidence_photo_url || "",
    evidenceAt: row.evidence_at || "",
    notes: row.notes || ""
  };
}

function mapMaintenanceRule(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    phase: row.phase || "Checklist",
    group: row.rule_group || "Maintenance",
    frequency: row.frequency,
    active: row.active !== false,
    createdAt: row.created_at
  };
}

async function requireSupabase(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function loadSupabaseDb() {
  const [outletsResult, categoriesResult, assetsResult, tasksResult, techniciansResult, ticketsResult, historyResult, attendancePlansResult, maintenanceRulesResult] = await Promise.all([
    supabase.from("outlets").select("name,branch,address,latitude,longitude").order("name"),
    supabase.from("categories").select("id,name,description").order("name"),
    supabase.from("assets").select("id,outlet,category,name,code,status,notes,created_at").order("created_at", { ascending: false }),
    supabase.from("tasks").select("id,title,asset_id,outlet,assigned_to,status,task_date,completed_at,evidence_comment,evidence_photo_url,evidence_at,notes").order("task_date", { ascending: false }),
    supabase.from("technicians").select("id,name,skill,status,quality,service_outlets").order("id"),
    supabase.from("tickets").select("*").order("created_at", { ascending: false }),
    supabase.from("ticket_history").select("ticket_id,action,created_at").order("created_at", { ascending: true }),
    supabase.from("attendance_plans").select("id,technician_id,status,from_date,to_date,reason,created_by,active,created_at").order("from_date"),
    supabase.from("maintenance_rules").select("id,category,title,phase,rule_group,frequency,active,created_at").order("created_at", { ascending: false })
  ]);

  const outlets = await requireSupabase(outletsResult);
  const categories = await requireSupabase(categoriesResult);
  const assets = await requireSupabase(assetsResult);
  const tasks = await requireSupabase(tasksResult);
  const technicians = await requireSupabase(techniciansResult);
  const tickets = await requireSupabase(ticketsResult);
  const history = await requireSupabase(historyResult);
  const attendancePlans = await requireSupabase(attendancePlansResult);
  const maintenanceRules = await requireSupabase(maintenanceRulesResult);

  return {
    outlets: outlets.map((outlet) => outlet.name),
    outletLocations: Object.fromEntries(outlets.map((outlet) => [
      outlet.name,
      {
        address: outlet.address || "",
        branch: outlet.branch || "",
        latitude: outlet.latitude === null ? null : Number(outlet.latitude),
        longitude: outlet.longitude === null ? null : Number(outlet.longitude)
      }
    ])),
    categories,
    assets: assets.map(mapAsset),
    tasks: tasks.map(mapTask),
    maintenanceRules: maintenanceRules.map(mapMaintenanceRule),
    technicians: technicians.map((tech) => ({
      ...tech,
      serviceOutlets: tech.service_outlets || [],
      quality: tech.quality || 90
    })),
    attendancePlans: attendancePlans.map((plan) => ({
      id: plan.id,
      technicianId: plan.technician_id,
      status: plan.status,
      from: plan.from_date,
      to: plan.to_date,
      reason: plan.reason || "",
      createdBy: plan.created_by || "system",
      active: plan.active !== false,
      createdAt: plan.created_at
    })),
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

async function createTicket(payload, user) {
  const db = await loadDb();
  const selectedAsset = payload.assetId ? assetById(db, payload.assetId) : null;
  const cleanPhotoUrls = sanitizePhotoUrls(payload.photoUrls?.length ? payload.photoUrls : payload.photoUrl);
  const cleanPhotoUrl = cleanPhotoUrls[0] || "";
  const cleanNote = String(payload.note || "").trim();
  const cleanArea = String(payload.area || "").trim();
  const unknownAsset = Boolean(payload.unknownAsset);
  const requestedTechnician = payload.assignedTo ? db.technicians.find((tech) => tech.id === payload.assignedTo) : null;
  const scheduledAt = normalizeScheduledAt(payload.scheduledAt);
  const effectiveCategory = selectedAsset?.category || payload.category;
  const effectiveImpact = payload.impact;
  if (ticketRequiresPhoto({ impact: effectiveImpact, category: effectiveCategory, note: cleanNote }) && !cleanPhotoUrl) {
    return { status: 400, body: { error: "Photo is required for critical, food-safety, gas, electrical, leak, or temperature issues." } };
  }

  const ticket = {
    id: nextTicketId(db.tickets),
    outlet: selectedAsset?.outlet || payload.outlet,
    category: effectiveCategory,
    assetId: selectedAsset?.id || "",
    impact: effectiveImpact,
    area: cleanArea,
    note: cleanNote || `${effectiveCategory} issue`,
    priority: priorityForImpact(effectiveImpact),
    status: "New",
    assignedTo: "",
    scheduledAt: "",
    createdBy: user?.id || "",
    photoUrl: cleanPhotoUrl,
    photoUrls: cleanPhotoUrls,
    resolutionPhotoUrls: [],
    createdAt: new Date().toISOString(),
    history: []
  };
  if (unknownAsset) {
    ticket.latestDetail = `Manager marked asset as Other / unknown${cleanArea ? ` in ${cleanArea}` : ""}`;
  }
  const autoAssignedTechnician = requestedTechnician || smartSuggestion(db, ticket);
  if (autoAssignedTechnician) {
    ticket.status = "Assigned";
    ticket.assignedTo = autoAssignedTechnician.id;
    ticket.scheduledAt = scheduledAt;
    ticket.latestDetail = requestedTechnician
      ? `${ticket.latestDetail ? `${ticket.latestDetail}. ` : ""}Assigned to ${autoAssignedTechnician.name} by ${user?.name || user?.role || "user"}`
      : `${ticket.latestDetail ? `${ticket.latestDetail}. ` : ""}Auto assigned to ${autoAssignedTechnician.name}: ${autoAssignedTechnician.dispatchReason}`;
  }

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("tickets").insert({
        id: ticket.id,
        outlet: ticket.outlet,
        category: ticket.category,
        asset_id: ticket.assetId || null,
        impact: ticket.impact,
        area: ticket.area || null,
        note: ticket.note,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assignedTo || null,
        scheduled_at: ticket.scheduledAt || null,
        latest_detail: ticket.latestDetail || "",
        photo_url: ticket.photoUrl || null,
        photo_urls: ticket.photoUrls,
        resolution_photo_urls: ticket.resolutionPhotoUrls,
        created_by: ticket.createdBy || null
      })
    );
    await addSupabaseHistory(ticket.id, `Ticket created by ${user?.name || "manager"}`);
    if (autoAssignedTechnician) {
      await addSupabaseHistory(
        ticket.id,
        requestedTechnician
          ? `Assigned to ${autoAssignedTechnician.name} by ${user?.name || user?.role || "user"}`
          : `Auto assigned to ${autoAssignedTechnician.name}: ${autoAssignedTechnician.dispatchReason}`
      );
    }
    ticket.suggestedTechnician = autoAssignedTechnician;
    return ticket;
  }

  ticket.history.push({ at: new Date().toISOString(), action: `Ticket created by ${user?.name || "manager"}` });
  if (autoAssignedTechnician) {
    ticket.history.push({
      at: new Date().toISOString(),
      action: requestedTechnician
        ? `Assigned to ${autoAssignedTechnician.name} by ${user?.name || user?.role || "user"}`
        : `Auto assigned to ${autoAssignedTechnician.name}: ${autoAssignedTechnician.dispatchReason}`
    });
  }
  db.tickets.unshift(ticket);
  writeJsonDb(db);
  ticket.suggestedTechnician = autoAssignedTechnician;
  return ticket;
}

async function createAsset(payload, user) {
  const db = await loadDb();
  const outlet = String(payload.outlet || "").trim();
  const category = String(payload.category || "").trim();
  const name = String(payload.name || "").trim();
  const code = String(payload.code || "").trim();
  const status = String(payload.status || "Active").trim();
  const notes = String(payload.notes || "").trim();

  if (!db.outlets.includes(outlet)) return { status: 400, body: { error: "Outlet is invalid" } };
  if (!db.categories.some((item) => item.name === category)) return { status: 400, body: { error: "Category is invalid" } };
  if (!name) return { status: 400, body: { error: "Asset name is required" } };
  if (code && db.assets.some((asset) => String(asset.code).toLowerCase() === code.toLowerCase())) {
    return { status: 409, body: { error: "Asset code already exists" } };
  }

  const asset = {
    id: nextAssetId(db.assets),
    outlet,
    category,
    name,
    code,
    status,
    notes,
    createdBy: user?.id || "",
    createdAt: new Date().toISOString()
  };

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("assets").insert({
        id: asset.id,
        outlet: asset.outlet,
        category: asset.category,
        name: asset.name,
        code: asset.code || null,
        status: asset.status,
        notes: asset.notes,
        created_by: asset.createdBy || null
      })
    );
    return { status: 201, body: asset };
  }

  db.assets.unshift(asset);
  writeJsonDb(db);
  return { status: 201, body: asset };
}

async function updateAsset(assetId, payload, user) {
  const db = await loadDb();
  const existing = db.assets.find((asset) => asset.id === assetId);
  if (!existing) return { status: 404, body: { error: "Asset not found" } };
  const outlet = String(payload.outlet || existing.outlet).trim();
  const category = String(payload.category || existing.category).trim();
  const name = String(payload.name || existing.name).trim();
  const code = String(payload.code ?? existing.code ?? "").trim();
  const status = String(payload.status || existing.status || "Active").trim();
  const notes = String(payload.notes ?? existing.notes ?? "").trim();
  if (!db.outlets.includes(outlet)) return { status: 400, body: { error: "Outlet is invalid" } };
  if (!db.categories.some((item) => item.name === category)) return { status: 400, body: { error: "Category is invalid" } };
  if (!name) return { status: 400, body: { error: "Asset name is required" } };
  if (code && db.assets.some((asset) => asset.id !== assetId && String(asset.code).toLowerCase() === code.toLowerCase())) {
    return { status: 409, body: { error: "Asset code already exists" } };
  }
  const updated = { ...existing, outlet, category, name, code, status, notes, updatedBy: user?.id || "" };
  if (useSupabase) {
    await requireSupabase(await supabase.from("assets").update({
      outlet,
      category,
      name,
      code: code || null,
      status,
      notes,
      updated_at: new Date().toISOString()
    }).eq("id", assetId));
    return { status: 200, body: updated };
  }
  db.assets = db.assets.map((asset) => asset.id === assetId ? updated : asset);
  writeJsonDb(db);
  return { status: 200, body: updated };
}

async function createOutlet(payload) {
  const db = await loadDb();
  const name = String(payload.name || "").trim();
  const branch = String(payload.branch || "").trim();
  const address = String(payload.address || "").trim();
  const latitude = payload.latitude === "" || payload.latitude === null || payload.latitude === undefined ? null : Number(payload.latitude);
  const longitude = payload.longitude === "" || payload.longitude === null || payload.longitude === undefined ? null : Number(payload.longitude);
  if (!name) return { status: 400, body: { error: "Outlet name is required" } };
  if (db.outlets.some((outlet) => outlet.toLowerCase() === name.toLowerCase())) {
    return { status: 409, body: { error: "Outlet already exists" } };
  }
  if ((latitude !== null && !Number.isFinite(latitude)) || (longitude !== null && !Number.isFinite(longitude))) {
    return { status: 400, body: { error: "Latitude and longitude must be valid numbers" } };
  }

  if (useSupabase) {
    await requireSupabase(await supabase.from("outlets").insert({ name, branch: branch || null, address: address || null, latitude, longitude }));
    return { status: 201, body: { name, branch, address, latitude, longitude } };
  }

  db.outlets.push(name);
  db.outletLocations = {
    ...(db.outletLocations || {}),
    [name]: { branch, address, latitude, longitude }
  };
  writeJsonDb(db);
  return { status: 201, body: { name, branch, address, latitude, longitude } };
}

async function updateOutlet(oldName, payload) {
  const db = await loadDb();
  const existing = db.outlets.find((outlet) => outlet === oldName);
  if (!existing) return { status: 404, body: { error: "Outlet not found" } };
  const name = String(payload.name || oldName).trim();
  const address = String(payload.address || "").trim();
  if (!name) return { status: 400, body: { error: "Outlet name is required" } };
  if (db.outlets.some((outlet) => outlet !== oldName && outlet.toLowerCase() === name.toLowerCase())) {
    return { status: 409, body: { error: "Outlet already exists" } };
  }
  const currentLocation = db.outletLocations?.[oldName] || {};
  const latitude = parseNullableNumber(payload.latitude ?? currentLocation.latitude);
  const longitude = parseNullableNumber(payload.longitude ?? currentLocation.longitude);

  if (useSupabase) {
    if (name !== oldName) {
      const users = await requireSupabase(await supabase.from("app_users").select("id,outlet,allowed_outlets"));
      const technicians = await requireSupabase(await supabase.from("technicians").select("id,service_outlets"));
      await requireSupabase(await supabase.from("outlets").insert({ name, branch: null, address: address || null, latitude, longitude }));
      await requireSupabase(await supabase.from("assets").update({ outlet: name, updated_at: new Date().toISOString() }).eq("outlet", oldName));
      await requireSupabase(await supabase.from("tasks").update({ outlet: name, updated_at: new Date().toISOString() }).eq("outlet", oldName));
      await requireSupabase(await supabase.from("tickets").update({ outlet: name, updated_at: new Date().toISOString() }).eq("outlet", oldName));
      await Promise.all(technicians
        .filter((tech) => (tech.service_outlets || []).includes(oldName))
        .map(async (tech) => requireSupabase(await supabase
          .from("technicians")
          .update({ service_outlets: (tech.service_outlets || []).map((outlet) => outlet === oldName ? name : outlet), updated_at: new Date().toISOString() })
          .eq("id", tech.id))));
      await Promise.all(users
        .filter((user) => user.outlet === oldName || (user.allowed_outlets || []).includes(oldName))
        .map(async (user) => requireSupabase(await supabase
          .from("app_users")
          .update({
            outlet: user.outlet === oldName ? name : user.outlet,
            allowed_outlets: (user.allowed_outlets || []).map((outlet) => outlet === oldName ? name : outlet),
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id))));
      await requireSupabase(await supabase.from("outlets").delete().eq("name", oldName));
      return { status: 200, body: { name, branch: "", address, latitude, longitude } };
    }
    await requireSupabase(await supabase.from("outlets").update({ name, branch: null, address: address || null, latitude, longitude }).eq("name", oldName));
    return { status: 200, body: { name, branch: "", address, latitude, longitude } };
  }

  db.outlets = db.outlets.map((outlet) => outlet === oldName ? name : outlet);
  db.assets = (db.assets || []).map((asset) => asset.outlet === oldName ? { ...asset, outlet: name } : asset);
  db.tasks = (db.tasks || []).map((task) => task.outlet === oldName ? { ...task, outlet: name } : task);
  db.tickets = (db.tickets || []).map((ticket) => ticket.outlet === oldName ? { ...ticket, outlet: name } : ticket);
  db.technicians = (db.technicians || []).map((tech) => ({
    ...tech,
    serviceOutlets: (tech.serviceOutlets || []).map((outlet) => outlet === oldName ? name : outlet)
  }));
  db.users = (db.users || []).map((user) => ({
    ...user,
    outlet: user.outlet === oldName ? name : user.outlet,
    allowedOutlets: (user.allowedOutlets || []).map((outlet) => outlet === oldName ? name : outlet)
  }));
  const { [oldName]: _oldLocation, ...locations } = db.outletLocations || {};
  db.outletLocations = { ...locations, [name]: { branch: "", address, latitude, longitude } };
  writeJsonDb(db);
  return { status: 200, body: { name, branch: "", address, latitude, longitude } };
}

async function createCategory(payload) {
  const db = await loadDb();
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  if (!name) return { status: 400, body: { error: "Category name is required" } };
  if (db.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    return { status: 409, body: { error: "Category already exists" } };
  }

  const category = { id: categoryIdFromName(name), name, description };

  if (useSupabase) {
    await requireSupabase(await supabase.from("categories").insert(category));
    return { status: 201, body: category };
  }

  db.categories.push(category);
  writeJsonDb(db);
  return { status: 201, body: category };
}

async function updateCategory(categoryId, payload) {
  const db = await loadDb();
  const existing = (db.categories || []).find((category) => category.id === categoryId);
  if (!existing) return { status: 404, body: { error: "Category not found" } };
  const name = String(payload.name || "").trim();
  const description = String(payload.description ?? existing.description ?? "").trim();
  if (!name) return { status: 400, body: { error: "Category name is required" } };
  if (db.categories.some((category) => category.id !== categoryId && category.name.toLowerCase() === name.toLowerCase())) {
    return { status: 409, body: { error: "Category already exists" } };
  }

  const updated = { ...existing, name, description };
  if (useSupabase) {
    await requireSupabase(await supabase.from("categories").update({ name, description }).eq("id", categoryId));
    if (name !== existing.name) {
      await requireSupabase(await supabase.from("assets").update({ category: name, updated_at: new Date().toISOString() }).eq("category", existing.name));
      await requireSupabase(await supabase.from("tickets").update({ category: name, updated_at: new Date().toISOString() }).eq("category", existing.name));
      await requireSupabase(await supabase.from("technicians").update({ skill: name, updated_at: new Date().toISOString() }).eq("skill", existing.name));
      await requireSupabase(await supabase.from("maintenance_rules").update({ category: name, updated_at: new Date().toISOString() }).eq("category", existing.name));
    }
    return { status: 200, body: updated };
  }

  db.categories = db.categories.map((category) => category.id === categoryId ? updated : category);
  if (name !== existing.name) {
    db.assets = (db.assets || []).map((asset) => asset.category === existing.name ? { ...asset, category: name } : asset);
    db.tickets = (db.tickets || []).map((ticket) => ticket.category === existing.name ? { ...ticket, category: name } : ticket);
    db.technicians = (db.technicians || []).map((tech) => tech.skill === existing.name ? { ...tech, skill: name } : tech);
    db.maintenanceRules = (db.maintenanceRules || []).map((rule) => rule.category === existing.name ? { ...rule, category: name } : rule);
  }
  writeJsonDb(db);
  return { status: 200, body: updated };
}

async function deleteOutlet(name) {
  const db = await loadDb();
  if (!db.outlets.includes(name)) return { status: 404, body: { error: "Outlet not found" } };
  const inUse = [
    (db.assets || []).some((asset) => asset.outlet === name) && "assets",
    (db.tasks || []).some((task) => task.outlet === name) && "tasks",
    (db.tickets || []).some((ticket) => ticket.outlet === name) && "tickets",
    (db.technicians || []).some((tech) => (tech.serviceOutlets || []).includes(name)) && "technicians",
    (await allUsers()).some((user) => user.outlet === name || (user.allowedOutlets || []).includes(name)) && "users"
  ].filter(Boolean);
  if (inUse.length) return { status: 409, body: { error: `Outlet is used by ${inUse.join(", ")}. Remove those links first.` } };
  if (useSupabase) {
    await requireSupabase(await supabase.from("outlets").delete().eq("name", name));
    return { status: 200, body: { ok: true } };
  }
  db.outlets = db.outlets.filter((outlet) => outlet !== name);
  const { [name]: _removed, ...locations } = db.outletLocations || {};
  db.outletLocations = locations;
  writeJsonDb(db);
  return { status: 200, body: { ok: true } };
}

async function deleteCategory(categoryId) {
  const db = await loadDb();
  const category = (db.categories || []).find((item) => item.id === categoryId);
  if (!category) return { status: 404, body: { error: "Category not found" } };
  const inUse = [
    (db.assets || []).some((asset) => asset.category === category.name) && "assets",
    (db.tickets || []).some((ticket) => ticket.category === category.name) && "tickets",
    (db.technicians || []).some((tech) => tech.skill === category.name) && "technicians",
    (db.maintenanceRules || []).some((rule) => rule.category === category.name) && "scheduler rules"
  ].filter(Boolean);
  if (inUse.length) return { status: 409, body: { error: `Category is used by ${inUse.join(", ")}. Remove those links first.` } };
  if (useSupabase) {
    await requireSupabase(await supabase.from("categories").delete().eq("id", categoryId));
    return { status: 200, body: { ok: true } };
  }
  db.categories = db.categories.filter((item) => item.id !== categoryId);
  writeJsonDb(db);
  return { status: 200, body: { ok: true } };
}

async function deleteAsset(assetId) {
  const db = await loadDb();
  if (!db.assets.some((asset) => asset.id === assetId)) return { status: 404, body: { error: "Asset not found" } };
  const inUse = [
    (db.tasks || []).some((task) => task.assetId === assetId) && "tasks",
    (db.tickets || []).some((ticket) => ticket.assetId === assetId) && "tickets"
  ].filter(Boolean);
  if (inUse.length) return { status: 409, body: { error: `Asset is used by ${inUse.join(", ")}. Remove those links first.` } };
  if (useSupabase) {
    await requireSupabase(await supabase.from("assets").delete().eq("id", assetId));
    return { status: 200, body: { ok: true } };
  }
  db.assets = db.assets.filter((asset) => asset.id !== assetId);
  writeJsonDb(db);
  return { status: 200, body: { ok: true } };
}

async function createTechnician(payload) {
  const db = await loadDb();
  const name = String(payload.name || "").trim();
  const skill = String(payload.skill || "").trim();
  const outlet = String(payload.outlet || "").trim();
  const requestedOutlets = normalizeOutletList(payload.serviceOutlets?.length ? payload.serviceOutlets : payload.allowedOutlets?.length ? payload.allowedOutlets : outlet ? [outlet] : db.outlets, db);
  const address = String(payload.address || "").trim();
  const latitude = parseNullableNumber(payload.latitude);
  const longitude = parseNullableNumber(payload.longitude);
  if (!name) return { status: 400, body: { error: "Technician name is required" } };
  if (!db.categories.some((category) => category.name === skill)) return { status: 400, body: { error: "Skill category is invalid" } };
  if (!requestedOutlets.length) return { status: 400, body: { error: "At least one outlet is required" } };

  const technician = {
    id: nextTechnicianId(db.technicians),
    name,
    skill,
    status: "Present",
    workload: 0,
    quality: 90,
    serviceOutlets: requestedOutlets
  };
  const username = makeUniqueUsername(await allUsers(), slugUsername(name));
  const password = `${slugUsername(name).split(".")[0] || "tech"}123`;
  const loginUser = {
    id: `U-TECH-${technician.id}`,
    username,
    passwordHash: hashPassword(password),
    name: technician.name,
    post: "Technician",
    role: "technician",
    outlet: requestedOutlets[0] || "",
    technicianId: technician.id,
    accessAllOutlets: false,
    allowedOutlets: requestedOutlets,
    address,
    latitude,
    longitude,
    defaultView: "dashboard",
    allowedViews: ["dashboard", "technician", "reports"]
  };

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("technicians").insert({
        id: technician.id,
        name: technician.name,
        skill: technician.skill,
        status: technician.status,
        quality: technician.quality,
        service_outlets: technician.serviceOutlets
      })
    );
    await requireSupabase(
      await supabase.from("app_users").insert({
        id: loginUser.id,
        username: loginUser.username,
        display_name: loginUser.name,
        password_hash: loginUser.passwordHash,
        post: loginUser.post,
        role: loginUser.role,
        outlet: loginUser.outlet || null,
        technician_id: loginUser.technicianId,
        access_all_outlets: loginUser.accessAllOutlets,
        allowed_outlets: loginUser.allowedOutlets,
        address: loginUser.address || null,
        latitude: loginUser.latitude,
        longitude: loginUser.longitude,
        default_view: loginUser.defaultView,
        allowed_views: loginUser.allowedViews
      })
    );
    return { status: 201, body: { ...technician, login: publicUser(loginUser), temporaryPassword: password } };
  }

  db.technicians.push(technician);
  db.users = [...(db.users || DEMO_USERS), loginUser];
  writeJsonDb(db);
  return { status: 201, body: { ...technician, login: publicUser(loginUser), temporaryPassword: password } };
}

async function updateTechnicianMaster(technicianId, payload) {
  const db = await loadDb();
  const technician = db.technicians.find((tech) => tech.id === technicianId);
  if (!technician) return { status: 404, body: { error: "Technician not found" } };
  const name = String(payload.name || technician.name || "").trim();
  const skill = String(payload.skill || technician.skill || "").trim();
  const serviceOutlets = normalizeOutletList(payload.serviceOutlets?.length ? payload.serviceOutlets : payload.allowedOutlets?.length ? payload.allowedOutlets : technician.serviceOutlets || [], db);
  if (!name) return { status: 400, body: { error: "Technician name is required" } };
  if (!db.categories.some((category) => category.name === skill)) return { status: 400, body: { error: "Skill category is invalid" } };
  if (!serviceOutlets.length) return { status: 400, body: { error: "At least one outlet is required" } };

  const updated = { ...technician, name, skill, serviceOutlets };
  if (useSupabase) {
    await requireSupabase(await supabase.from("technicians").update({
      name,
      skill,
      service_outlets: serviceOutlets,
      updated_at: new Date().toISOString()
    }).eq("id", technicianId));
    await requireSupabase(await supabase.from("app_users").update({
      display_name: name,
      outlet: serviceOutlets[0] || null,
      access_all_outlets: false,
      allowed_outlets: serviceOutlets,
      updated_at: new Date().toISOString()
    }).eq("technician_id", technicianId));
    return { status: 200, body: updated };
  }

  db.technicians = db.technicians.map((tech) => tech.id === technicianId ? updated : tech);
  db.users = (db.users || []).map((user) => user.technicianId === technicianId ? {
    ...user,
    name,
    outlet: serviceOutlets[0] || "",
    accessAllOutlets: false,
    allowedOutlets: serviceOutlets
  } : user);
  writeJsonDb(db);
  return { status: 200, body: updated };
}

async function deleteTechnicianMaster(technicianId) {
  const db = await loadDb();
  if (!db.technicians.some((tech) => tech.id === technicianId)) return { status: 404, body: { error: "Technician not found" } };
  const inUse = [
    (db.tasks || []).some((task) => task.assignedTo === technicianId) && "tasks",
    (db.tickets || []).some((ticket) => ticket.assignedTo === technicianId) && "tickets"
  ].filter(Boolean);
  if (inUse.length) return { status: 409, body: { error: `Technician is used by ${inUse.join(", ")}. Reassign or close those records first.` } };
  if (useSupabase) {
    await requireSupabase(await supabase.from("app_users").delete().eq("technician_id", technicianId));
    await requireSupabase(await supabase.from("technicians").delete().eq("id", technicianId));
    return { status: 200, body: { ok: true } };
  }
  db.users = (db.users || []).filter((user) => user.technicianId !== technicianId);
  db.technicians = db.technicians.filter((tech) => tech.id !== technicianId);
  writeJsonDb(db);
  return { status: 200, body: { ok: true } };
}

async function deleteAdminUser(userId, actingUser) {
  if (actingUser?.id === userId) return { status: 400, body: { error: "You cannot delete your own active login" } };
  const users = await allUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return { status: 404, body: { error: "User not found" } };
  if (user.role === "admin" && users.filter((item) => item.role === "admin").length <= 1) {
    return { status: 409, body: { error: "At least one admin login is required" } };
  }
  if (useSupabase) {
    await requireSupabase(await supabase.from("app_users").delete().eq("id", userId));
    return { status: 200, body: { ok: true } };
  }
  const db = readJsonDb();
  db.users = (db.users || []).filter((item) => item.id !== userId);
  writeJsonDb(db);
  return { status: 200, body: { ok: true } };
}

function buildUserAccessPayload(payload, db, existingUser = null) {
  const role = String(payload.role || existingUser?.role || "manager").trim();
  const name = String(payload.name || payload.displayName || existingUser?.name || "").trim();
  const post = String(payload.post || existingUser?.post || (role === "technician" ? "Technician" : role === "admin" ? "Admin" : "Outlet Manager")).trim();
  const accessAllOutlets = Boolean(payload.accessAllOutlets);
  const allowedOutlets = accessAllOutlets ? [] : normalizeOutletList(payload.allowedOutlets || payload.serviceOutlets || [], db);
  const outlet = accessAllOutlets ? "" : allowedOutlets[0] || String(payload.outlet || existingUser?.outlet || "").trim();
  const address = String(payload.address || existingUser?.address || "").trim();
  const latitude = parseNullableNumber(payload.latitude ?? existingUser?.latitude);
  const longitude = parseNullableNumber(payload.longitude ?? existingUser?.longitude);
  if (!["admin", "manager", "technician"].includes(role)) return { error: "Role is invalid" };
  if (!name) return { error: "Name is required" };
  if (!accessAllOutlets && !allowedOutlets.length) return { error: "Select at least one outlet or give all outlet access" };
  return { role, name, post, accessAllOutlets, allowedOutlets, outlet, address, latitude, longitude };
}

async function createAdminUser(payload) {
  const db = await loadDb();
  const users = await allUsers();
  const username = String(payload.username || "").trim().toLowerCase();
  const password = String(payload.password || "").trim();
  const access = buildUserAccessPayload(payload, db);
  if (access.error) return { status: 400, body: { error: access.error } };
  if (!username) return { status: 400, body: { error: "Username is required" } };
  if (!password) return { status: 400, body: { error: "Password is required" } };
  if (users.some((user) => user.username === username)) return { status: 409, body: { error: "Username already exists" } };

  let technician = null;
  let technicianId = "";
  if (access.role === "technician") {
    const skill = String(payload.skill || "").trim();
    if (!db.categories.some((category) => category.name === skill)) return { status: 400, body: { error: "Skill category is invalid" } };
    technician = {
      id: nextTechnicianId(db.technicians),
      name: access.name,
      skill,
      status: String(payload.status || "Present").trim() || "Present",
      quality: 90,
      serviceOutlets: access.allowedOutlets.length ? access.allowedOutlets : [...db.outlets]
    };
    technicianId = technician.id;
  }

  const prefix = access.role === "admin" ? "U-ADMIN" : access.role === "manager" ? "U-MGR" : "U-TECH";
  const user = {
    id: `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    username,
    passwordHash: hashPassword(password),
    name: access.name,
    post: access.post,
    role: access.role,
    outlet: access.outlet,
    technicianId,
    accessAllOutlets: access.accessAllOutlets,
    allowedOutlets: access.allowedOutlets,
    address: access.address,
    latitude: access.latitude,
    longitude: access.longitude,
    defaultView: "dashboard",
    allowedViews: allowedViewsForRole(access.role)
  };

  if (useSupabase) {
    if (technician) {
      await requireSupabase(await supabase.from("technicians").insert({
        id: technician.id,
        name: technician.name,
        skill: technician.skill,
        status: technician.status,
        quality: technician.quality,
        service_outlets: technician.serviceOutlets
      }));
    }
    await requireSupabase(await supabase.from("app_users").insert({
      id: user.id,
      username: user.username,
      password_hash: user.passwordHash,
      display_name: user.name,
      post: user.post,
      role: user.role,
      outlet: user.outlet || null,
      technician_id: user.technicianId || null,
      access_all_outlets: user.accessAllOutlets,
      allowed_outlets: user.allowedOutlets,
      address: user.address || null,
      latitude: user.latitude,
      longitude: user.longitude,
      default_view: user.defaultView,
      allowed_views: user.allowedViews
    }));
    return { status: 201, body: { user: publicUser(user), technician } };
  }

  if (technician) db.technicians.push(technician);
  db.users = [...(db.users || DEMO_USERS), user];
  writeJsonDb(db);
  return { status: 201, body: { user: publicUser(user), technician } };
}

async function updateAdminUser(userId, payload) {
  const db = await loadDb();
  const users = await allUsers();
  const existing = users.find((user) => user.id === userId);
  if (!existing) return { status: 404, body: { error: "User not found" } };
  const access = buildUserAccessPayload(payload, db, existing);
  if (access.error) return { status: 400, body: { error: access.error } };
  const allowedViews = allowedViewsForRole(access.role);
  let technicianId = access.role === "technician" ? existing.technicianId || "" : "";

  if (access.role === "technician" && !technicianId) {
    const skill = String(payload.skill || "General").trim();
    const technician = {
      id: nextTechnicianId(db.technicians),
      name: access.name,
      skill,
      status: String(payload.status || "Present").trim() || "Present",
      quality: 90,
      serviceOutlets: access.allowedOutlets.length ? access.allowedOutlets : [...db.outlets]
    };
    technicianId = technician.id;
    if (useSupabase) {
      await requireSupabase(await supabase.from("technicians").insert({
        id: technician.id,
        name: technician.name,
        skill: technician.skill,
        status: technician.status,
        quality: technician.quality,
        service_outlets: technician.serviceOutlets
      }));
    } else {
      db.technicians.push(technician);
    }
  }

  if (technicianId) {
    const technicianUpdates = {
      name: access.name,
      service_outlets: access.accessAllOutlets ? [...db.outlets] : access.allowedOutlets,
      updated_at: new Date().toISOString()
    };
    if (payload.skill) technicianUpdates.skill = String(payload.skill).trim();
    if (payload.status) technicianUpdates.status = String(payload.status).trim();
    if (useSupabase) {
      await requireSupabase(await supabase.from("technicians").update(technicianUpdates).eq("id", technicianId));
    } else {
      db.technicians = db.technicians.map((tech) => tech.id === technicianId ? {
        ...tech,
        name: technicianUpdates.name,
        skill: technicianUpdates.skill || tech.skill,
        status: technicianUpdates.status || tech.status,
        serviceOutlets: technicianUpdates.service_outlets
      } : tech);
    }
  }

  if (useSupabase) {
    await requireSupabase(await supabase.from("app_users").update({
      display_name: access.name,
      post: access.post,
      role: access.role,
      outlet: access.outlet || null,
      technician_id: technicianId || null,
      access_all_outlets: access.accessAllOutlets,
      allowed_outlets: access.allowedOutlets,
      address: access.address || null,
      latitude: access.latitude,
      longitude: access.longitude,
      default_view: "dashboard",
      allowed_views: allowedViews,
      updated_at: new Date().toISOString()
    }).eq("id", userId));
    return { status: 200, body: { ok: true } };
  }

  db.users = (db.users || []).map((user) => user.id === userId ? {
    ...user,
    name: access.name,
    post: access.post,
    role: access.role,
    outlet: access.outlet,
    technicianId,
    accessAllOutlets: access.accessAllOutlets,
    allowedOutlets: access.allowedOutlets,
    address: access.address,
    latitude: access.latitude,
    longitude: access.longitude,
    defaultView: "dashboard",
    allowedViews
  } : user);
  writeJsonDb(db);
  return { status: 200, body: { ok: true } };
}

async function createMaintenanceRule(payload) {
  const db = await loadDb();
  const category = String(payload.category || "").trim();
  const title = String(payload.title || "").trim();
  const phase = String(payload.phase || "Checklist").trim();
  const frequency = String(payload.frequency || "daily").trim().toLowerCase();
  if (!category || !title) return { status: 400, body: { error: "Category and task title are required" } };
  if (!db.categories.some((item) => item.name === category)) return { status: 400, body: { error: "Category is invalid" } };
  if (!["daily", "weekly"].includes(frequency)) return { status: 400, body: { error: "Frequency must be daily or weekly" } };

  const rule = {
    id: nextMaintenanceRuleId(db.maintenanceRules || []),
    category,
    title,
    phase: frequency === "weekly" ? "Weekly" : phase,
    group: String(payload.group || "Maintenance").trim() || "Maintenance",
    frequency,
    active: true,
    createdAt: new Date().toISOString()
  };

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("maintenance_rules").insert({
        id: rule.id,
        category: rule.category,
        title: rule.title,
        phase: rule.phase,
        rule_group: rule.group,
        frequency: rule.frequency,
        active: rule.active
      })
    );
    return { status: 201, body: rule };
  }

  db.maintenanceRules = [...(db.maintenanceRules || []), rule];
  writeJsonDb(db);
  return { status: 201, body: rule };
}

async function updateMaintenanceRule(ruleId, payload) {
  const db = await loadDb();
  const rule = (db.maintenanceRules || []).find((item) => item.id === ruleId);
  if (!rule) return { status: 404, body: { error: "Maintenance rule not found" } };
  const active = Boolean(payload.active);

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("maintenance_rules").update({ active, updated_at: new Date().toISOString() }).eq("id", ruleId)
    );
    return { status: 200, body: { ...rule, active } };
  }

  rule.active = active;
  writeJsonDb(db);
  return { status: 200, body: rule };
}

async function updateTaskStatus(taskId, status, user, evidence = {}) {
  const db = await loadDb();
  const task = (db.tasks || []).find((item) => item.id === taskId);
  if (!task) return { status: 404, body: { error: "Task not found" } };
  if (user?.role === "technician" && task.assignedTo !== user.technicianId) {
    return { status: 403, body: { error: "Technicians can only update their own checklist" } };
  }
  if (status !== "Done") return { status: 400, body: { error: "Only marking a task done is allowed" } };
  if (task.status === "Done") return { status: 409, body: { error: "Task is already completed" } };
  const evidenceComment = String(evidence.comment || "").trim().slice(0, 500);
  const evidencePhotoUrl = sanitizePhotoUrl(evidence.photoUrl);
  if (!evidencePhotoUrl) {
    return { status: 400, body: { error: "Photo evidence is required to complete this task" } };
  }

  task.status = status;
  task.completedAt = status === "Done" ? new Date().toISOString() : "";
  task.evidenceComment = evidenceComment;
  task.evidencePhotoUrl = evidencePhotoUrl;
  task.evidenceAt = task.completedAt;

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tasks")
        .update({
          status: task.status,
          completed_at: task.completedAt || null,
          evidence_comment: task.evidenceComment || null,
          evidence_photo_url: task.evidencePhotoUrl || null,
          evidence_at: task.evidenceAt || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId)
    );
    return { status: 200, body: { ok: true } };
  }

  writeJsonDb(db);
  return { status: 200, body: task };
}

async function assignTicket(ticketId, technicianId, overrideReason, user, scheduledAtValue) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  const technician = db.technicians.find((tech) => tech.id === technicianId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!technician) return { status: 404, body: { error: "Technician not found" } };
  if (!user || !["admin", "manager"].includes(user.role)) {
    return { status: 403, body: { error: "Only admin or manager can assign technicians" } };
  }
  if (["admin", "manager"].includes(user.role) && !canUserAccessOutlet(user, db, ticket.outlet)) {
    return { status: 403, body: { error: "You can only assign tickets from your outlet access" } };
  }

  const effectiveTechnician = technicianWithAttendance(db, technician);
  const servesOutlet = (effectiveTechnician.serviceOutlets || []).includes(ticket.outlet);
  const skillMatch = effectiveTechnician.skill === ticket.category;
  if (!servesOutlet) {
    return { status: 403, body: { error: "Technician is not registered for this outlet" } };
  }
  const needsOverride = !ASSIGNABLE_STATUSES.includes(effectiveTechnician.status);
  if (user.role === "manager" && needsOverride) {
    return { status: 403, body: { error: "Manager can only assign available technicians who serve this outlet" } };
  }
  if (needsOverride && !overrideReason) {
    return { status: 409, body: { error: "Override reason required for unavailable technician" } };
  }

  if (user.role !== "admin" && scheduledAtValue !== undefined && scheduledAtValue !== null && String(scheduledAtValue || "").trim()) {
    return { status: 403, body: { error: "Only admin can set or change assignment time" } };
  }
  const scheduledAt = user.role === "admin" ? normalizeScheduledAt(scheduledAtValue) : ticket.scheduledAt || "";
  const scheduledCopy = scheduledAt ? ` for ${new Date(scheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : "";
  const action = needsOverride
    ? `Admin override assigned to ${technician.name}${scheduledCopy}: ${overrideReason}`
    : `${user.role === "manager" ? "Manager" : "Admin"} assigned to ${technician.name}${skillMatch ? "" : " as backup skill"}${scheduledCopy}`;

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tickets")
        .update({ assigned_to: technician.id, status: "Assigned", scheduled_at: scheduledAt || null, updated_at: new Date().toISOString() })
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.assignedTo = technician.id;
  ticket.status = "Assigned";
  ticket.scheduledAt = scheduledAt;
  ticket.latestDetail = action;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function updateTicketSchedule(ticketId, scheduledAtValue, user) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!user || user.role !== "admin") {
    return { status: 403, body: { error: "Only admin can set or change assignment time" } };
  }
  const scheduledAt = normalizeScheduledAt(scheduledAtValue);
  const action = scheduledAt
    ? `Assignment time set by ${user.name} for ${new Date(scheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
    : `Assignment time cleared by ${user.name}`;

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tickets")
        .update({ scheduled_at: scheduledAt || null, latest_detail: action, updated_at: new Date().toISOString() })
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.scheduledAt = scheduledAt;
  ticket.latestDetail = action;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function acceptTicket(ticketId, user) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!user || user.role !== "technician" || ticket.assignedTo !== user.technicianId) {
    return { status: 403, body: { error: "Technicians can only accept their assigned jobs" } };
  }
  if (ticket.status !== "Assigned") {
    return { status: 409, body: { error: "Only newly assigned jobs can be accepted" } };
  }
  if (!isTicketScheduleDue(ticket)) {
    return { status: 409, body: { error: "This job is scheduled for later. It can only be accepted at the assigned time." } };
  }
  const action = `${user.name} accepted the job`;

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tickets")
        .update({ status: "Acknowledged", latest_detail: action, updated_at: new Date().toISOString() })
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.status = "Acknowledged";
  ticket.latestDetail = action;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function rejectTicket(ticketId, reason, user) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!user || user.role !== "technician" || ticket.assignedTo !== user.technicianId) {
    return { status: 403, body: { error: "Technicians can only reject their assigned jobs" } };
  }
  if (!["Assigned", "Acknowledged"].includes(ticket.status)) {
    return { status: 409, body: { error: "Only assigned or accepted jobs can be rejected before work starts" } };
  }
  if (!isTicketScheduleDue(ticket)) {
    return { status: 409, body: { error: "This job is scheduled for later. It can only be rejected at the assigned time." } };
  }
  const cleanReason = String(reason || "").trim().slice(0, 500);
  if (!cleanReason) return { status: 400, body: { error: "Rejection reason is required" } };
  const action = `${user.name} rejected the job: ${cleanReason}`;

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tickets")
        .update({
          assigned_to: null,
          status: "New",
          latest_detail: action,
          updated_at: new Date().toISOString()
        })
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.assignedTo = "";
  ticket.status = "New";
  ticket.latestDetail = action;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

function canDeleteAssignment(ticket, user) {
  if (!user) return false;
  return user.role === "admin" || ticket.createdBy === user.id;
}

function canUpdateTicketStatus(ticket, status, user) {
  if (!user) return { ok: false, error: "Authentication required" };
  if (user.role === "admin") return { ok: true };

  if (user.role === "manager") {
    if (ticket.outlet !== user.outlet) {
      return { ok: false, error: "Managers can only update tickets from their outlet" };
    }
    if (!["Closed", "Reopened"].includes(status)) {
      return { ok: false, error: "Managers can only approve or reopen resolved tickets" };
    }
    if (!["Resolved", "Verification Pending"].includes(ticket.status)) {
      return { ok: false, error: "Ticket must be resolved before manager verification" };
    }
    return { ok: true };
  }

  if (user.role === "technician") {
    if (ticket.assignedTo !== user.technicianId) {
      return { ok: false, error: "Technicians can only update assigned tickets" };
    }
    if (!isTicketScheduleDue(ticket)) {
      return { ok: false, error: "This job is scheduled for later. It can only be worked at the assigned time." };
    }
    if (!["Acknowledged", "In Progress", "Blocked", "Resolved"].includes(status)) {
      return { ok: false, error: "Technicians can only progress active work" };
    }
    if (!["Assigned", "Acknowledged", "In Progress", "Blocked", "Reopened"].includes(ticket.status)) {
      return { ok: false, error: "Ticket is not active for technician updates" };
    }
    return { ok: true };
  }

  return { ok: false, error: "Ticket status update is not allowed for this role" };
}

async function deleteAssignment(ticketId, user) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!ticket.assignedTo) return { status: 409, body: { error: "Ticket is not assigned" } };
  if (!canDeleteAssignment(ticket, user)) {
    return { status: 403, body: { error: "Only the ticket issuer or admin can delete this assignment" } };
  }

  const action = `Assignment deleted by ${user.name}`;
  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("tickets")
        .update({
          assigned_to: null,
          status: "New",
          latest_detail: action,
          updated_at: new Date().toISOString()
        })
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.assignedTo = "";
  ticket.status = "New";
  ticket.latestDetail = action;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function updateTicketStatus(ticketId, status, detail, user, evidence = {}) {
  const db = await loadDb();
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) return { status: 404, body: { error: "Ticket not found" } };
  if (!VALID_TICKET_STATUSES.includes(status)) return { status: 400, body: { error: "Invalid ticket status" } };
  const permission = canUpdateTicketStatus(ticket, status, user);
  if (!permission.ok) return { status: 403, body: { error: permission.error } };
  if (DETAIL_REQUIRED_STATUSES[status] && !String(detail || "").trim()) {
    return { status: 400, body: { error: DETAIL_REQUIRED_STATUSES[status] } };
  }
  const resolutionPhotoUrls = sanitizePhotoUrls(evidence.evidencePhotoUrls?.length ? evidence.evidencePhotoUrls : evidence.evidencePhotoUrl);
  if (user.role === "technician" && status === "Resolved" && !resolutionPhotoUrls.length) {
    return { status: 400, body: { error: "Completion photo is required before resolving the ticket" } };
  }

  const action = detail || `Status changed to ${status}`;
  if (useSupabase) {
    const updatePayload = { status, latest_detail: action, updated_at: new Date().toISOString() };
    if (status === "Resolved" && resolutionPhotoUrls.length) updatePayload.resolution_photo_urls = resolutionPhotoUrls;
    await requireSupabase(
      await supabase
        .from("tickets")
        .update(updatePayload)
        .eq("id", ticketId)
    );
    await addSupabaseHistory(ticketId, action);
    return { status: 200, body: { ok: true } };
  }

  ticket.status = status;
  ticket.latestDetail = action;
  if (status === "Resolved" && resolutionPhotoUrls.length) ticket.resolutionPhotoUrls = resolutionPhotoUrls;
  ticket.history.push({ at: new Date().toISOString(), action });
  writeJsonDb(db);
  return { status: 200, body: ticket };
}

async function updateTechnicianStatus(technicianId, status) {
  const db = await loadDb();
  const technician = db.technicians.find((tech) => tech.id === technicianId);
  if (!technician) return { status: 404, body: { error: "Technician not found" } };

  const unavailable = !ASSIGNABLE_STATUSES.includes(status);
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
      const affected = db.tickets.filter((ticket) =>
        ticket.assignedTo === technicianId && ["Assigned", "Acknowledged"].includes(ticket.status)
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
    releaseEarlyAssignments(db, technician.id, `Returned to queue because ${technician.name} became ${status}`);
  }
  writeJsonDb(db);
  return { status: 200, body: { technician, reports: reports(db) } };
}

async function createAttendancePlan(technicianId, payload, markedBy) {
  const db = await loadDb();
  const technician = db.technicians.find((tech) => tech.id === technicianId);
  if (!technician) return { status: 404, body: { error: "Technician not found" } };

  const status = payload.status || "Absent";
  const today = dateKey();
  const from = dateKey(payload.from || today);
  const to = dateKey(payload.to || from);
  const reason = String(payload.reason || "").trim();

  if (!ATTENDANCE_STATUSES.includes(status)) return { status: 400, body: { error: "Invalid attendance status" } };
  if (!from || !to || to < from) return { status: 400, body: { error: "Valid from/to dates are required" } };

  const plan = {
    id: `AP-${Date.now()}`,
    technicianId,
    status,
    from,
    to,
    reason,
    createdBy: markedBy || "technician",
    active: true,
    createdAt: new Date().toISOString()
  };

  const startsNow = from <= today && to >= today;

  if (useSupabase) {
    await requireSupabase(
      await supabase.from("attendance_plans").insert({
        technician_id: technicianId,
        status,
        from_date: from,
        to_date: to,
        reason,
        created_by: plan.createdBy,
        active: true
      })
    );
    await requireSupabase(
      await supabase.from("attendance_events").insert({
        technician_id: technicianId,
        status,
        marked_by: plan.createdBy,
        reason: reason || `Scheduled ${status} from ${from} to ${to}`
      })
    );

    if (startsNow && !ASSIGNABLE_STATUSES.includes(status)) {
      const affected = db.tickets.filter((ticket) =>
        ticket.assignedTo === technicianId && ["Assigned", "Acknowledged"].includes(ticket.status)
      );
      for (const ticket of affected) {
        await requireSupabase(
          await supabase
            .from("tickets")
            .update({ assigned_to: null, status: "New", updated_at: new Date().toISOString() })
            .eq("id", ticket.id)
        );
        await addSupabaseHistory(ticket.id, `Returned to queue because ${technician.name} scheduled ${status}`);
      }
    }
    return { status: 201, body: { ok: true, plan } };
  }

  db.attendancePlans.push(plan);
  if (startsNow && !ASSIGNABLE_STATUSES.includes(status)) {
    releaseEarlyAssignments(db, technicianId, `Returned to queue because ${technician.name} scheduled ${status}`);
  }
  writeJsonDb(db);
  return { status: 201, body: { plan, reports: reports(db) } };
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "TicketOps API", storage: useSupabase ? "supabase" : "json", auth: "demo" });
});

function publicUser(user) {
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

async function updateStoredPassword(userId, newPassword) {
  const passwordHash = hashPassword(newPassword);

  if (useSupabase) {
    await requireSupabase(
      await supabase
        .from("app_users")
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)
    );
    return passwordHash;
  }

  const db = readJsonDb();
  db.users = (db.users || []).map((user) =>
    user.id === userId
      ? {
          ...user,
          passwordHash,
          updatedAt: new Date().toISOString()
        }
      : user
  );
  writeJsonDb(db);
  return passwordHash;
}

function generateTemporaryPassword() {
  return `Tmp-${crypto.randomBytes(4).toString("hex")}`;
}

function mapSupabaseUser(row) {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    name: row.display_name,
    post: row.post,
    role: row.role,
    outlet: row.outlet || "",
    technicianId: row.technician_id || "",
    accessAllOutlets: row.access_all_outlets === true,
    allowedOutlets: row.allowed_outlets || [],
    address: row.address || "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    defaultView: row.default_view,
    allowedViews: row.allowed_views || []
  };
}

function allUsersFromJson() {
  ensureDb();
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const sourceUsers = Array.isArray(db.users) ? db.users : DEMO_USERS;
    return migrateUserPasswords(sourceUsers).users;
  } catch {
    return migrateUserPasswords(DEMO_USERS).users;
  }
}

async function allUsers() {
  if (useSupabase) {
    const result = await supabase
      .from("app_users")
      .select("id,username,display_name,password_hash,post,role,outlet,technician_id,access_all_outlets,allowed_outlets,address,latitude,longitude,default_view,allowed_views")
      .order("username");
    return (await requireSupabase(result)).map(mapSupabaseUser);
  }
  return allUsersFromJson();
}

async function userFromRequest(req) {
  const userId = req.get("X-TicketOps-User");
  return (await allUsers()).find((user) => user.id === userId) || null;
}

function scopedDbForUser(db, user) {
  if (!user) return db;

  if (user.role === "manager") {
    const outlets = outletAccessForUser(user, db);
    return {
      ...db,
      assets: (db.assets || []).filter((asset) => outlets.includes(asset.outlet)),
      tasks: (db.tasks || []).filter((task) => outlets.includes(task.outlet)),
      tickets: db.tickets.filter((ticket) => outlets.includes(ticket.outlet))
    };
  }

  if (user.role === "technician" && user.technicianId) {
    return {
      ...db,
      technicians: db.technicians.filter((tech) => tech.id === user.technicianId),
      assets: db.assets || [],
      tasks: (db.tasks || []).filter((task) => task.assignedTo === user.technicianId),
      tickets: db.tickets.filter((ticket) => ticket.assignedTo === user.technicianId && isTicketScheduleDue(ticket))
    };
  }

  return db;
}

app.get(
  "/api/auth/demo-users",
  asyncRoute(async (req, res) => {
    res.json({
      users: (await allUsers()).map(publicUser)
    });
  })
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = (await allUsers()).find((item) =>
      item.username === username && verifyPassword(password, item.passwordHash, item.password)
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({ user: publicUser(user) });
  })
);

app.post(
  "/api/auth/change-password",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: "Login required" });

    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password confirmation does not match" });
    }

    if (!verifyPassword(currentPassword, user.passwordHash, user.password || "")) {
      return res.status(403).json({ error: "Current password is incorrect" });
    }

    await updateStoredPassword(user.id, newPassword);
    res.json({ ok: true });
  })
);

app.post(
  "/api/admin/users/:id/reset-password",
  asyncRoute(async (req, res) => {
    const admin = await userFromRequest(req);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Only admin can reset passwords" });
    }

    const userId = String(req.params.id || "").trim();
    const targetUser = (await allUsers()).find((item) => item.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const requestedPassword = String(req.body.newPassword || "").trim();
    const temporaryPassword = requestedPassword || generateTemporaryPassword();
    if (temporaryPassword.length < 8) {
      return res.status(400).json({ error: "Reset password must be at least 8 characters" });
    }

    await updateStoredPassword(userId, temporaryPassword);
    res.json({
      ok: true,
      username: targetUser.username,
      temporaryPassword
    });
  })
);

app.get(
  "/api/bootstrap",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: "Login required" });
    res.json(withSuggestions(scopedDbForUser(await loadDb(), user), user));
  })
);

app.get(
  "/api/reports/export/:type",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can export reports" });
    }
    const exportFile = exportCsv(await loadDb(), req.params.type);
    if (!exportFile) return res.status(404).json({ error: "Unknown report export" });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${exportFile.filename}"`);
    res.send(exportFile.csv);
  })
);

app.get(
  "/api/technician/dashboard",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "technician") {
      return res.status(403).json({ error: "Technician dashboard is only available for technicians" });
    }
    res.json(technicianDashboard(await loadDb(), user.technicianId));
  })
);

app.get(
  "/api/technician/tasks/today",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "technician") {
      return res.status(403).json({ error: "Technician access only" });
    }
    res.json(todayTasksForTechnician(await loadDb(), user.technicianId));
  })
);

app.post(
  "/api/technician/tasks/:id/status",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "technician") {
      return res.status(403).json({ error: "Technician access only" });
    }
    if (String(req.body.status || "").toLowerCase() !== "done") {
      return res.status(400).json({ error: "Only status done is allowed" });
    }
    const result = await updateTaskStatus(req.params.id, "Done", user, {
      comment: req.body.comment,
      photoUrl: req.body.photoUrl
    });
    if (result.status === 200) {
      return res.json({ id: req.params.id, status: "done" });
    }
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/tasks/:id/status",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || !["admin", "technician"].includes(user.role)) {
      return res.status(403).json({ error: "Task update is not allowed for this role" });
    }
    const result = await updateTaskStatus(req.params.id, req.body.status || "Done", user, {
      comment: req.body.comment,
      photoUrl: req.body.photoUrl
    });
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/assets",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create assets" });
    }
    const result = await createAsset(req.body, user);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/assets/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update assets" });
    }
    const result = await updateAsset(req.params.id, req.body, user);
    res.status(result.status).json(result.body);
  })
);

app.delete(
  "/api/assets/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete assets" });
    }
    const result = await deleteAsset(req.params.id);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/outlets",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create outlets" });
    }
    const result = await createOutlet(req.body);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/outlets/:name",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update outlets" });
    }
    const result = await updateOutlet(decodeURIComponent(req.params.name), req.body);
    res.status(result.status).json(result.body);
  })
);

app.delete(
  "/api/outlets/:name",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete outlets" });
    }
    const result = await deleteOutlet(decodeURIComponent(req.params.name));
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/categories",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create categories" });
    }
    const result = await createCategory(req.body);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/categories/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update categories" });
    }
    const result = await updateCategory(req.params.id, req.body);
    res.status(result.status).json(result.body);
  })
);

app.delete(
  "/api/categories/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete categories" });
    }
    const result = await deleteCategory(req.params.id);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/technicians",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create technicians" });
    }
    const result = await createTechnician(req.body);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/technicians/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update technicians" });
    }
    const result = await updateTechnicianMaster(req.params.id, req.body);
    res.status(result.status).json(result.body);
  })
);

app.delete(
  "/api/technicians/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete technicians" });
    }
    const result = await deleteTechnicianMaster(req.params.id);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/admin/users",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create users" });
    }
    const result = await createAdminUser(req.body);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/admin/users/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update users" });
    }
    const result = await updateAdminUser(req.params.id, req.body);
    res.status(result.status).json(result.body);
  })
);

app.delete(
  "/api/admin/users/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete users" });
    }
    const result = await deleteAdminUser(req.params.id, user);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/maintenance-rules",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create maintenance rules" });
    }
    const result = await createMaintenanceRule(req.body);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/maintenance-rules/:id",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update maintenance rules" });
    }
    const result = await updateMaintenanceRule(req.params.id, req.body);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/tickets",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || !["admin", "manager", "technician"].includes(user.role)) {
      return res.status(403).json({ error: "Only authenticated operations users can issue tickets" });
    }
    const { outlet, category, impact, note, photoUrl, photoUrls, area, unknownAsset, assignedTo, scheduledAt } = req.body;
    if (String(scheduledAt || "").trim() && user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can set or change assignment time" });
    }
    const assetId = req.body.assetId === "__other" ? "" : req.body.assetId;
    if (!outlet || !category || !impact) {
      return res.status(400).json({ error: "outlet, category and impact are required" });
    }
    const db = await loadDb();
    const selectedAsset = assetId ? assetById(db, assetId) : null;
    if (assetId && !selectedAsset) {
      return res.status(404).json({ error: "Selected asset was not found" });
    }
    const effectiveOutlet = selectedAsset?.outlet || outlet;
    if (["admin", "manager"].includes(user.role) && !canUserAccessOutlet(user, db, effectiveOutlet)) {
      return res.status(403).json({ error: "You do not have access to this outlet" });
    }
    if (assignedTo) {
      const technician = db.technicians.find((tech) => tech.id === assignedTo);
      if (!technician) return res.status(404).json({ error: "Assigned technician was not found" });
      const effectiveTechnician = technicianWithAttendance(db, technician);
      const servesOutlet = (effectiveTechnician.serviceOutlets || []).includes(effectiveOutlet);
      if (user.role === "manager" && (!servesOutlet || !ASSIGNABLE_STATUSES.includes(effectiveTechnician.status))) {
        return res.status(403).json({ error: "Managers can only assign available technicians who serve this outlet" });
      }
      if (!servesOutlet) {
        return res.status(403).json({ error: "Technician is not registered for this outlet" });
      }
    }
    const ticket = await createTicket({ outlet, category, assetId, impact, note, photoUrl, photoUrls, area, unknownAsset, assignedTo, scheduledAt }, user);
    if (ticket.status && ticket.body) return res.status(ticket.status).json(ticket.body);
    res.status(201).json(ticket);
  })
);

app.patch(
  "/api/tickets/:id/assign",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || !["admin", "manager"].includes(user.role)) {
      return res.status(403).json({ error: "Only admin or manager can assign technicians" });
    }
    const result = await assignTicket(req.params.id, req.body.technicianId, req.body.overrideReason, user, req.body.scheduledAt);
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/tickets/:id/schedule",
  asyncRoute(async (req, res) => {
    const result = await updateTicketSchedule(req.params.id, req.body.scheduledAt, await userFromRequest(req));
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/tickets/:id/accept",
  asyncRoute(async (req, res) => {
    const result = await acceptTicket(req.params.id, await userFromRequest(req));
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/tickets/:id/reject",
  asyncRoute(async (req, res) => {
    const result = await rejectTicket(req.params.id, req.body.reason, await userFromRequest(req));
    res.status(result.status).json(result.body);
  })
);

app.delete(
  "/api/tickets/:id/assignment",
  asyncRoute(async (req, res) => {
    const result = await deleteAssignment(req.params.id, await userFromRequest(req));
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/tickets/:id/status",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: "Login required" });
    if (!req.body.status) return res.status(400).json({ error: "status is required" });
    const result = await updateTicketStatus(req.params.id, req.body.status, req.body.detail, user, {
      evidencePhotoUrl: req.body.evidencePhotoUrl,
      evidencePhotoUrls: req.body.evidencePhotoUrls
    });
    res.status(result.status).json(result.body);
  })
);

app.patch(
  "/api/technicians/:id/status",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update technician status" });
    }
    if (!req.body.status) return res.status(400).json({ error: "status is required" });
    const result = await updateTechnicianStatus(req.params.id, req.body.status);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/technicians/:id/attendance",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (user?.role === "technician" && user.technicianId !== req.params.id) {
      return res.status(403).json({ error: "Technicians can only update their own attendance" });
    }
    if (!user || !["admin", "technician"].includes(user.role)) {
      return res.status(403).json({ error: "Attendance update is not allowed for this role" });
    }

    const result = await createAttendancePlan(req.params.id, req.body, user.name);
    res.status(result.status).json(result.body);
  })
);

app.post(
  "/api/reset",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can reset demo data" });
    }
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
