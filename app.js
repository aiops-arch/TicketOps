const NATIVE_DEFAULT_API = location.protocol === "capacitor:" ? "http://10.0.2.2:3000" : "";
const LOCAL_QUERY = new URLSearchParams(location.search);
const VIEW_ROUTE_FILES = {
  dashboard: "dashboard.html",
  manager: "manager.html",
  admin: "admin.html",
  scheduler: "scheduler.html",
  masters: "masters.html",
  technician: "technician.html",
  history: "history.html",
  reports: "reports.html"
};
const ROUTE_FILE_VIEWS = Object.fromEntries(Object.entries(VIEW_ROUTE_FILES).map(([view, file]) => [file, view]));

function requestedRouteView() {
  const queryView = LOCAL_QUERY.get("view");
  if (queryView && VIEW_ROUTE_FILES[queryView]) return queryView;
  const file = location.pathname.split("/").pop() || "index.html";
  return ROUTE_FILE_VIEWS[file] || "";
}
const ALLOW_LOCAL_DATA_MODE = ["localhost", "127.0.0.1", "::1"].includes(location.hostname) || location.protocol === "file:";
const LOCAL_DATA_MODE = ALLOW_LOCAL_DATA_MODE ? (LOCAL_QUERY.get("data") || "") : "";
const QUERY_API_BASE = LOCAL_QUERY.get("apiBase") || "";
const CONFIG_API_BASE = QUERY_API_BASE || window.TICKETOPS_CONFIG?.apiBase || window.TICKETOPS_API_BASE || "";
const STORED_API_BASE = localStorage.getItem("ticketops-api-base") || "";
const STALE_API_BASE_PATTERN = /(ticketops-api\.onrender\.com|supabase\.co|ksfbnsdqbaccuebrrhvu)/i;
if (STALE_API_BASE_PATTERN.test(CONFIG_API_BASE) || STALE_API_BASE_PATTERN.test(STORED_API_BASE)) {
  localStorage.removeItem("ticketops-api-base");
  localStorage.removeItem("ticketops-bootstrap-cache-v1");
}
const SAFE_CONFIG_API_BASE = STALE_API_BASE_PATTERN.test(CONFIG_API_BASE) ? "" : CONFIG_API_BASE;
const SAFE_STORED_API_BASE = STALE_API_BASE_PATTERN.test(STORED_API_BASE) ? "" : STORED_API_BASE;
const API_BASE = ["browser", "empty"].includes(LOCAL_DATA_MODE) ? "" : (SAFE_CONFIG_API_BASE || SAFE_STORED_API_BASE || NATIVE_DEFAULT_API);
const USE_APPS_SCRIPT_API = /script\.google\.com\/macros\/s\/.+\/exec/i.test(API_BASE);
const USE_BROWSER_FALLBACK_API = !API_BASE;
const AUTH_STORAGE_KEY = "ticketops-auth-user-v2";
const THEME_STORAGE_KEY = "ticketops-theme";
const DASHBOARD_MODE_STORAGE_KEY = "ticketops-dashboard-mode";
const LAST_ACTIVITY_STORAGE_KEY = "ticketops-last-activity";
const BOOTSTRAP_CACHE_KEY = "ticketops-bootstrap-cache-v4";
const BROWSER_DB_STORAGE_KEY = "ticketops-browser-db-v3";
const BOOTSTRAP_CACHE_TTL_MS = 10 * 60 * 1000;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_TICKET_PHOTOS = 5;
const GOOGLE_SHEETS_MAX_TICKET_PHOTOS = 2;
const MAX_IMAGE_EDGE = 1600;
const GOOGLE_SHEETS_IMAGE_EDGE = 420;
const IMAGE_QUALITY = 0.72;
const GOOGLE_SHEETS_IMAGE_QUALITY = 0.42;
const ASSIGNMENT_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_STEPS = {
  New: { label: "Queued", percent: 12 },
  Assigned: { label: "Assigned", percent: 28 },
  Acknowledged: { label: "Acknowledged", percent: 44 },
  "In Progress": { label: "In progress", percent: 62 },
  Blocked: { label: "Blocked", percent: 52 },
  Resolved: { label: "Resolved", percent: 78 },
  "Verification Pending": { label: "Verification", percent: 88 },
  Reopened: { label: "Reopened", percent: 36 },
  Closed: { label: "Closed", percent: 100 },
  Cancelled: { label: "Cancelled", percent: 100 }
};

const PRIORITY_LABELS = {
  P1: "P1 Critical",
  P2: "P2 High",
  P3: "P3 Standard",
  P4: "P4 Low"
};

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

const ROLE_DEFAULT_VIEWS = {
  admin: ["dashboard", "manager", "admin", "masters", "scheduler", "history", "reports"],
  manager: ["manager"],
  technician: ["technician"],
  auditor: ["dashboard", "reports"]
};

const UTILITY_VIEWS = [];
const ROLE_VIEW_ALLOWLIST = {
  admin: ["dashboard", "manager", "admin", "masters", "scheduler", "history", "reports"],
  manager: ["manager"],
  technician: ["technician"],
  auditor: ["dashboard", "reports"]
};

const VIEW_COPY = {
  dashboard: { icon: "▦", label: "Overview" },
  manager: { icon: "◉", label: "Manager Desk" },
  admin: { icon: "⚙", label: "Admin Control" },
  masters: { icon: "▣", label: "Masters" },
  scheduler: { icon: "◷", label: "Scheduler" },
  technician: { icon: "⚒", label: "Technician Work" },
  history: { icon: "H", label: "Closed History" },
  reports: { icon: "▤", label: "Reports" }
};

let state = {
  outlets: [],
  outletLocations: {},
  categories: [],
  assets: [],
  technicians: [],
  tickets: [],
  tasks: [],
  maintenanceRules: [],
  assignmentTimeWindows: [],
  attendancePlans: [],
  reports: {}
};

const BROWSER_FALLBACK_PASSWORDS = {
  aiops: "AIops",
  "chintan.patel": "chintan123",
  "meet.patel": "meet123",
  "pratik.patel": "pratik123",
  "hussain.sheikh": "hussain123",
  demo: "demo123",
  manish: "manish123",
  "rahil.shah": "rahil123",
  "umang.naidu": "umang123",
  "viren.barapatre": "viren123",
  vicky: "vicky123",
  "rahul.patil": "rahul123",
  abrar: "abrar123",
  uday: "uday123",
  hiten: "hiten123"
};

const MIGRATED_SCHEDULER_RULES = [
  { id: "MR-10", outlet: "Aiko PAL", category: "Plumbing", title: "Water Lavel, Leakage , Toilet Flush,All TAP", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T16:31:28.903657+00:00" },
  { id: "MR-11", outlet: "Aiko PAL", category: "RO PLANT", title: "FILTER, TDS Lavel(75 to 85)", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:13:23.126687+00:00" },
  { id: "MR-12", outlet: "Capiche Piplod", category: "AC", title: "Temperature and Filter", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: false, createdAt: "2026-05-09T17:22:22.814226+00:00" },
  { id: "MR-13", outlet: "Capiche Piplod", category: "AIR CORTAIN", title: "Check Sensor", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:22:50.567095+00:00" },
  { id: "MR-14", outlet: "Capiche Piplod", category: "Electrical", title: "Lights and power plugs", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:23:57.419492+00:00" },
  { id: "MR-15", outlet: "Capiche Piplod", category: "ICE MAKER", title: "Check Size and Thickness", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:24:45.927256+00:00" },
  { id: "MR-16", outlet: "Capiche Piplod", category: "IT", title: "WIFI , KOT - POS", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:25:11.003804+00:00" },
  { id: "MR-17", outlet: "Capiche Piplod", category: "Kitchen Equipment", title: "Induction, Ovan,Etc", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:25:50.855732+00:00" },
  { id: "MR-18", outlet: "Capiche Piplod", category: "Plumbing", title: "Water Lavel, Leakage , Toilet Flush,All TAP", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:26:24.922933+00:00" },
  { id: "MR-19", outlet: "Capiche Piplod", category: "Refrigeration", title: "Temperature", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:27:36.962725+00:00" },
  { id: "MR-20", outlet: "Capiche Piplod", category: "RO PLANT", title: "FILTER, TDS Lavel(75 to 85)", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T2", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T17:28:54.128231+00:00" },
  { id: "MR-5", outlet: "Aiko PAL", category: "AC", title: "Temperature and Filter", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-07T08:52:51.898527+00:00" },
  { id: "MR-6", outlet: "Aiko PAL", category: "AIR CORTAIN", title: "Check Sensor", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T16:27:26.122798+00:00" },
  { id: "MR-7", outlet: "Aiko PAL", category: "Electrical", title: "Check All Lights And Power Plugs", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T16:28:35.42351+00:00" },
  { id: "MR-8", outlet: "Aiko PAL", category: "IT", title: "WIFI , KOT - POS", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T16:29:22.220617+00:00" },
  { id: "MR-9", outlet: "Aiko PAL", category: "Kitchen Equipment", title: "Induction, Ovan,Etc", phase: "Checklist", startTime: "10:00", endTime: "11:30", group: "Maintenance", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-09T16:30:20.513207+00:00" },
  { id: "MR-D-002", outlet: "Aiko PAL", category: "Refrigeration", title: "Freezer working , Temperature", phase: "Morning Opening", startTime: "10:00", endTime: "11:30", group: "Equipment Check", frequency: "daily", assignedTechnicianId: "T3", allowOutsideWindow: false, active: true, createdAt: "2026-05-01T08:53:53.499433+00:00" }
].map((rule) => ({ recurrenceDayOfWeek: null, recurrenceDayOfMonth: null, recurrenceMonths: [], reminderDays: 0, ...rule }));

const MIGRATED_SCHEDULER_TASK_DATES = ["2026-05-16", "2026-05-15", "2026-05-14"];
const MIGRATED_SCHEDULER_TASK_ITEMS = [
  { seq: "016", title: "Checklist: Check Sensor", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-13" },
  { seq: "015", title: "Checklist: Lights and power plugs", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-14" },
  { seq: "014", title: "Checklist: Check Size and Thickness", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-15" },
  { seq: "013", title: "Checklist: WIFI , KOT - POS", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-16" },
  { seq: "012", title: "Checklist: Induction, Ovan,Etc", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-17" },
  { seq: "011", title: "Checklist: Water Lavel, Leakage , Toilet Flush,All TAP", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-18" },
  { seq: "010", title: "Checklist: Temperature", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-19" },
  { seq: "009", title: "Checklist: FILTER, TDS Lavel(75 to 85)", assetId: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", assignedTo: "T2", ruleId: "MR-20" },
  { seq: "008", title: "Morning Opening: Freezer working , Temperature", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-D-002" },
  { seq: "007", title: "Checklist: Temperature and Filter", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-5" },
  { seq: "006", title: "Checklist: Check Sensor", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-6" },
  { seq: "005", title: "Checklist: Check All Lights And Power Plugs", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-7" },
  { seq: "004", title: "Checklist: WIFI , KOT - POS", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-8" },
  { seq: "003", title: "Checklist: Induction, Ovan,Etc", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-9" },
  { seq: "002", title: "Checklist: Water Lavel, Leakage , Toilet Flush,All TAP", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-10" },
  { seq: "001", title: "Checklist: FILTER, TDS Lavel(75 to 85)", assetId: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", assignedTo: "T3", ruleId: "MR-11" }
];
const MIGRATED_SCHEDULER_TASKS = MIGRATED_SCHEDULER_TASK_DATES.flatMap((date) =>
  MIGRATED_SCHEDULER_TASK_ITEMS.map((task) => ({
    id: `TASK-${date.replaceAll("-", "")}-${task.seq}`,
    title: task.title,
    assetId: task.assetId,
    outlet: task.outlet,
    assignedTo: task.assignedTo,
    ruleId: task.ruleId,
    status: "Pending",
    date,
    completedAt: "",
    evidenceComment: "",
    evidencePhotoUrl: "",
    evidenceAt: "",
    notes: task.ruleId === "MR-D-002" ? "Equipment Check / Daily" : "Maintenance / Daily"
  }))
);

const BROWSER_FALLBACK_DB = {
  users: [
    { id: "U-ADMIN-AIOPS", username: "aiops", name: "AIops", post: "Admin Control Panel Operator", role: "admin", accessAllOutlets: true, allowedOutlets: [], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "history", "reports"] },
    { id: "U-ADMIN-CHINTAN", username: "chintan.patel", name: "Chintan Patel", post: "Admin Control Panel Operator", role: "admin", accessAllOutlets: true, allowedOutlets: [], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "history", "reports"] },
    { id: "U-ADMIN-MEET", username: "meet.patel", name: "Meet Patel", post: "Admin Control Panel Operator", role: "admin", accessAllOutlets: true, allowedOutlets: [], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "admin", "masters", "scheduler", "history", "reports"] },
    { id: "U-MGR-BA24B337", username: "demo", name: "DEMO", post: "Outlet Manager", role: "manager", accessAllOutlets: true, allowedOutlets: [], defaultView: "manager", allowedViews: ["manager"] },
    { id: "U-MGR-HUSSAIN", username: "hussain.sheikh", name: "Hussain Sheikh", post: "Outlet Manager", role: "manager", outlet: "Capiche Piplod", accessAllOutlets: true, allowedOutlets: [], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "reports"] },
    { id: "U-MGR-A492A2AF", username: "manish", name: "Manish", post: "Head Chef", role: "manager", outlet: "Capiche Piplod", accessAllOutlets: false, allowedOutlets: ["Capiche Piplod"], defaultView: "manager", allowedViews: ["manager"] },
    { id: "U-MGR-PRATIK", username: "pratik.patel", name: "Pratik Patel", post: "Outlet Manager", role: "manager", outlet: "Aiko PAL", accessAllOutlets: true, allowedOutlets: [], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "reports"] },
    { id: "U-MGR-BFB2795A", username: "rahil.shah", name: "Rahil Shah", post: "Outlet Manager", role: "manager", outlet: "Capiche Piplod", accessAllOutlets: false, allowedOutlets: ["Capiche Piplod"], defaultView: "manager", allowedViews: ["manager"] },
    { id: "U-MGR-E538FE14", username: "umang.naidu", name: "Umang Naidu", post: "Outlet Manager", role: "manager", outlet: "Capiche Vesu", accessAllOutlets: false, allowedOutlets: ["Capiche Vesu"], defaultView: "manager", allowedViews: ["manager"] },
    { id: "U-MGR-99DB0C23", username: "viren.barapatre", name: "Viren Barapatre", post: "Manager", role: "manager", outlet: "Aiko PAL", accessAllOutlets: false, allowedOutlets: ["Aiko PAL"], defaultView: "dashboard", allowedViews: ["dashboard", "manager", "reports"] },
    { id: "U-TECH-VICKY", username: "vicky", name: "Vicky", post: "Technician", role: "technician", outlet: "Prep KItchen AMD", technicianId: "T1", accessAllOutlets: false, allowedOutlets: ["Prep KItchen AMD"], defaultView: "dashboard", allowedViews: ["dashboard", "technician", "reports"] },
    { id: "U-TECH-RAHUL", username: "rahul.patil", name: "Rahul Patil", post: "Technician", role: "technician", outlet: "Capiche Piplod", technicianId: "T2", accessAllOutlets: false, allowedOutlets: ["Capiche Piplod", "Capiche Vesu"], defaultView: "technician", allowedViews: ["technician"] },
    { id: "U-TECH-A278005E", username: "abrar", name: "Abrar", post: "Technician", role: "technician", outlet: "Aiko Ambli", technicianId: "T3", accessAllOutlets: false, allowedOutlets: ["Aiko Ambli", "Aiko PAL", "Capiche Piplod", "Capiche Vesu", "Prep Kitchen KG"], defaultView: "technician", allowedViews: ["technician"] },
    { id: "U-TECH-T4", username: "uday", name: "Uday", post: "Technician", role: "technician", outlet: "Aiko Ambli", technicianId: "T4", accessAllOutlets: false, allowedOutlets: ["Aiko Ambli", "Capiche Ambli"], defaultView: "technician", allowedViews: ["technician"] },
    { id: "U-TECH-T5", username: "hiten", name: "Hiten", post: "Technician", role: "technician", outlet: "Capiche-Uni", technicianId: "T5", accessAllOutlets: false, allowedOutlets: ["Capiche-Uni"], defaultView: "technician", allowedViews: ["technician"] }
  ],
  outlets: ["Aiko Ambli", "Aiko PAL", "Capiche Ambli", "Capiche Piplod", "Capiche Vesu", "Capiche-Uni", "Prep KItchen AMD", "Prep Kitchen KG"],
  outletLocations: {
    "Aiko Ambli": { address: "Ahmedabad", latitude: null, longitude: null },
    "Aiko PAL": { address: "Surat", latitude: null, longitude: null },
    "Capiche Ambli": { address: "Ahmedabad", latitude: null, longitude: null },
    "Capiche Piplod": { address: "Surat", latitude: null, longitude: null },
    "Capiche Vesu": { address: "Surat", latitude: null, longitude: null },
    "Capiche-Uni": { address: "Ahmedabad", latitude: null, longitude: null },
    "Prep KItchen AMD": { address: "Ahmedabad", latitude: null, longitude: null },
    "Prep Kitchen KG": { address: "GHB", latitude: null, longitude: null }
  },
  categories: [
    { id: "C-AC", name: "AC", description: "Air conditioning and ventilation" },
    { id: "C-AIR-CORTAIN", name: "AIR CORTAIN", description: "" },
    { id: "C-RO", name: "CIVIL", description: "" },
    { id: "C-ELEC", name: "Electrical", description: "Power, Panels, lighting, Plug, Meter Readings" },
    { id: "C-ICE-MAKER", name: "ICE MAKER", description: "" },
    { id: "C-IT", name: "IT", description: "WIFI , CAMERA" },
    { id: "C-KITCHEN", name: "Kitchen Equipment", description: "Ovens, fryers, burners, dishwashers" },
    { id: "C-KOT-POS", name: "KOT-POS", description: "WIFI Connection , Print" },
    { id: "C-PLUMB", name: "Plumbing", description: "Water supply, drains, dishwash area" },
    { id: "C-REF", name: "Refrigeration", description: "Freezers, chillers, cold rooms" },
    { id: "C-RO-PLANT", name: "RO PLANT", description: "" }
  ],
  assets: [
    { id: "ASSET-OTHER-0ecb12d37a", outlet: "Prep KItchen AMD", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-56139c3138", outlet: "Capiche Vesu", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-8a723047e4", outlet: "Capiche Ambli", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-c77a47f576", outlet: "Aiko Ambli", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-cf382a821b", outlet: "Aiko PAL", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-d7f0a7903d", outlet: "Capiche Piplod", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-e903f588b4", outlet: "Prep Kitchen KG", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." },
    { id: "ASSET-OTHER-f243e30c91", outlet: "Capiche-Uni", category: "Other", name: "Other asset", code: "", status: "Active", notes: "Visible general asset used for scheduled work when no specific asset is selected." }
  ],
  technicians: [
    { id: "T1", name: "Vicky", skill: "AC", status: "Present", workload: 0, quality: 92, serviceOutlets: ["Prep KItchen AMD"] },
    { id: "T2", name: "Rahul Patil", skill: "Refrigeration", status: "Present", workload: 0, quality: 95, serviceOutlets: ["Capiche Piplod", "Capiche Vesu"] },
    { id: "T3", name: "Abrar", skill: "Electrical", status: "Present", workload: 0, quality: 90, serviceOutlets: ["Aiko Ambli", "Aiko PAL", "Capiche Piplod", "Capiche Vesu", "Prep Kitchen KG"] },
    { id: "T4", name: "Uday", skill: "AC", status: "Present", workload: 0, quality: 90, serviceOutlets: ["Aiko Ambli", "Capiche Ambli"] },
    { id: "T5", name: "Hiten", skill: "AC", status: "Present", workload: 0, quality: 90, serviceOutlets: ["Capiche-Uni"] }
  ],
  tickets: [
    { id: "TK-1010", outlet: "Capiche Vesu", category: "CIVIL", impact: "Customer visible", area: "washroom", note: "wall is break.", priority: "P2", status: "Acknowledged", assignedTo: "T2", latestDetail: "Rahul Patil accepted the job", createdBy: "U-MGR-E538FE14", createdAt: "2026-05-12T08:39:02.772702+00:00", updatedAt: "2026-05-12T09:16:02.252+00:00", photoUrls: [] },
    { id: "TK-1009", outlet: "Aiko Ambli", category: "IT", impact: "Normal repair", area: "chair repairing", note: "chair repairing pls", priority: "P3", status: "New", assignedTo: "", latestDetail: "", createdBy: "U-ADMIN-CHINTAN", createdAt: "2026-05-10T10:12:14.381392+00:00", updatedAt: "2026-05-11T12:20:28.71+00:00", photoUrls: [] },
    { id: "TK-1008", outlet: "Aiko Ambli", category: "Electrical", impact: "Customer visible", area: "flore", note: "aroma spray nhi thatu", priority: "P2", status: "New", assignedTo: "", latestDetail: "", createdBy: "U-ADMIN-CHINTAN", createdAt: "2026-05-10T08:22:24.759888+00:00", updatedAt: "2026-05-11T12:20:29.223+00:00", photoUrls: [] },
    { id: "TK-1007", outlet: "Aiko PAL", category: "Electrical", impact: "Customer visible", area: "flore", note: "vara ghadi sound ma khar-khar aavaj aave", priority: "P2", status: "Closed", assignedTo: "", latestDetail: "Admin verified completion and closed the ticket", createdBy: "U-ADMIN-CHINTAN", createdAt: "2026-05-10T08:18:54.854258+00:00", updatedAt: "2026-05-13T06:13:24.011+00:00", photoUrls: [] },
    { id: "TK-1006", outlet: "Aiko Ambli", category: "Electrical", impact: "Customer visible", area: "flore", note: "washroom use nhi kari shakiya", priority: "P2", status: "Closed", assignedTo: "", latestDetail: "Admin verified completion and closed the ticket", createdBy: "U-ADMIN-CHINTAN", createdAt: "2026-05-10T08:17:00.731339+00:00", updatedAt: "2026-05-13T06:00:15.283+00:00", photoUrls: [] },
    { id: "TK-1005", outlet: "Aiko Ambli", category: "Kitchen Equipment", impact: "Service stopped", area: "Kitchen", note: "Induction Not Working", priority: "P1", status: "Closed", assignedTo: "T3", latestDetail: "Admin closed ticket", createdBy: "U-MGR-BA24B337", createdAt: "2026-05-09T16:56:29.419112+00:00", updatedAt: "2026-05-11T06:03:45.387+00:00", photoUrls: [] },
    { id: "TK-1004", outlet: "Aiko Ambli", category: "Kitchen Equipment", impact: "Normal repair", area: "kitchen equepment", note: "not working properly", priority: "P3", status: "Closed", assignedTo: "T3", latestDetail: "Manager approved resolution", createdBy: "U-ADMIN-CHINTAN", createdAt: "2026-05-08T10:31:58.250535+00:00", updatedAt: "2026-05-09T16:24:50.931+00:00", photoUrls: [] },
    { id: "TK-1003", outlet: "Aiko Ambli", category: "AC", impact: "Service stopped", area: "ac barabar work nhi kartu", note: "not cooling proper", priority: "P1", status: "Closed", assignedTo: "T3", latestDetail: "Manager approved resolution", createdBy: "U-ADMIN-CHINTAN", createdAt: "2026-05-08T10:26:58.333853+00:00", updatedAt: "2026-05-09T16:24:45.128+00:00", photoUrls: [] },
    { id: "TK-1002", outlet: "Capiche Piplod", category: "AC", impact: "Service stopped", area: "Demo", note: "DEMO", priority: "P1", status: "Closed", assignedTo: "T3", latestDetail: "Manager approved resolution", createdBy: "U-MGR-A492A2AF", createdAt: "2026-05-02T06:41:34.410576+00:00", updatedAt: "2026-05-02T06:51:37.1+00:00", photoUrls: [] },
    { id: "TK-1001", outlet: "Aiko PAL", category: "AIR CORTAIN", impact: "Service stopped", area: "DOOR", note: "NO Power", priority: "P1", status: "Closed", assignedTo: "T2", latestDetail: "Manager approved resolution", createdBy: "U-MGR-99DB0C23", createdAt: "2026-05-01T11:44:19.073908+00:00", updatedAt: "2026-05-02T04:22:14.786+00:00", photoUrls: [] }
  ],
  tasks: MIGRATED_SCHEDULER_TASKS,
  maintenanceRules: MIGRATED_SCHEDULER_RULES,
  assignmentTimeWindows: [
    { id: "AW-1", name: "Evening Time", days: [0, 1, 2, 3, 4, 5, 6], startTime: "12:00", endTime: "18:00", active: true, createdAt: "2026-05-01T08:49:18.902447+00:00" }
  ],
  attendancePlans: []
};

let stateIndex = {
  assetsById: new Map(),
  techniciansById: new Map(),
  maintenanceRulesById: new Map(),
  ticketsByAssetId: new Map(),
  tasksByAssetId: new Map(),
  ticketsByTechnicianId: new Map(),
  tasksByTechnicianId: new Map(),
  todayPendingTasksByTechnicianId: new Map()
};

function pushIndex(map, key, value) {
  if (!key) return;
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

function bind(selector, eventName, handler, options) {
  const element = document.querySelector(selector);
  if (!element) return null;
  element.addEventListener(eventName, handler, options);
  return element;
}

function normalizeBootstrapState(rawState = {}) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const reports = source.reports && typeof source.reports === "object" ? source.reports : {};
  return {
    ...source,
    outlets: Array.isArray(source.outlets) ? source.outlets : [],
    outletLocations: source.outletLocations && typeof source.outletLocations === "object" ? source.outletLocations : {},
    categories: Array.isArray(source.categories) ? source.categories : [],
    assets: Array.isArray(source.assets) ? source.assets : [],
    technicians: Array.isArray(source.technicians) ? source.technicians : [],
    tickets: Array.isArray(source.tickets) ? source.tickets : [],
    tasks: Array.isArray(source.tasks) ? source.tasks : [],
    maintenanceRules: Array.isArray(source.maintenanceRules) ? source.maintenanceRules : [],
    assignmentTimeWindows: Array.isArray(source.assignmentTimeWindows) ? source.assignmentTimeWindows : [],
    attendancePlans: Array.isArray(source.attendancePlans) ? source.attendancePlans : [],
    reports: {
      ...reports,
      alerts: Array.isArray(reports.alerts) ? reports.alerts : [],
      technicianWorkload: Array.isArray(reports.technicianWorkload) ? reports.technicianWorkload : [],
      outletSummary: Array.isArray(reports.outletSummary) ? reports.outletSummary : []
    },
    stitch: source.stitch && typeof source.stitch === "object" ? source.stitch : {}
  };
}

function rebuildStateIndex() {
  const today = todayInputValue();
  stateIndex = {
    assetsById: new Map((state.assets || []).map((asset) => [asset.id, asset])),
    techniciansById: new Map((state.technicians || []).map((tech) => [tech.id, tech])),
    maintenanceRulesById: new Map((state.maintenanceRules || []).map((rule) => [rule.id, rule])),
    ticketsByAssetId: new Map(),
    tasksByAssetId: new Map(),
    ticketsByTechnicianId: new Map(),
    tasksByTechnicianId: new Map(),
    todayPendingTasksByTechnicianId: new Map()
  };

  for (const ticket of state.tickets || []) {
    pushIndex(stateIndex.ticketsByAssetId, ticket.assetId, ticket);
    pushIndex(stateIndex.ticketsByTechnicianId, ticket.assignedTo, ticket);
  }

  for (const task of state.tasks || []) {
    pushIndex(stateIndex.tasksByAssetId, task.assetId, task);
    pushIndex(stateIndex.tasksByTechnicianId, task.assignedTo, task);
    if (task.date === today && task.status === "Pending") {
      stateIndex.todayPendingTasksByTechnicianId.set(
        task.assignedTo,
        (stateIndex.todayPendingTasksByTechnicianId.get(task.assignedTo) || 0) + 1
      );
    }
  }
}

/* ─── Toast / Modal notification system ─── */

function showToast(message, type = "info", duration = 3800) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || "•"}</span><span class="toast-body">${escapeHtml(String(message))}</span><button class="toast-dismiss" aria-label="Dismiss">×</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("is-visible")));
  const dismiss = () => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 350);
  };
  const timer = setTimeout(dismiss, duration);
  toast.querySelector(".toast-dismiss").addEventListener("click", () => { clearTimeout(timer); dismiss(); });
}

function showConfirm(message, confirmText = "Delete", confirmClass = "primary-button modal-danger") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modalOverlay");
    const msgEl = document.getElementById("modalMessage");
    const inputWrap = overlay.querySelector(".modal-input-wrap");
    const confirmBtn = document.getElementById("modalConfirm");
    const cancelBtn = document.getElementById("modalCancel");
    msgEl.textContent = message;
    inputWrap.classList.add("is-hidden");
    confirmBtn.textContent = confirmText;
    confirmBtn.className = confirmClass;
    overlay.classList.remove("is-hidden");
    const close = (result) => {
      overlay.classList.add("is-hidden");
      resolve(result);
    };
    const onConfirm = () => { cleanup(); close(true); };
    const onCancel = () => { cleanup(); close(false); };
    const onKey = (e) => { if (e.key === "Escape") { cleanup(); close(false); } };
    const cleanup = () => {
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKey);
    };
    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKey);
  });
}

function showPromptModal(label, defaultValue = "") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modalOverlay");
    const msgEl = document.getElementById("modalMessage");
    const inputWrap = overlay.querySelector(".modal-input-wrap");
    const input = document.getElementById("modalInput");
    const confirmBtn = document.getElementById("modalConfirm");
    const cancelBtn = document.getElementById("modalCancel");
    msgEl.textContent = label;
    input.value = defaultValue;
    inputWrap.classList.remove("is-hidden");
    confirmBtn.textContent = "OK";
    confirmBtn.className = "primary-button";
    overlay.classList.remove("is-hidden");
    setTimeout(() => { input.focus(); input.select(); }, 50);
    const close = (result) => {
      overlay.classList.add("is-hidden");
      inputWrap.classList.add("is-hidden");
      resolve(result);
    };
    const onConfirm = () => { cleanup(); close(input.value); };
    const onCancel = () => { cleanup(); close(null); };
    const onKey = (e) => {
      if (e.key === "Enter") { cleanup(); close(input.value); }
      if (e.key === "Escape") { cleanup(); close(null); }
    };
    const cleanup = () => {
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      input.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onKey);
    };
    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    input.addEventListener("keydown", onKey);
  });
}

/* ─── In-app photo lightbox ───
   window.open + document.write fails silently in installed PWAs, Capacitor WebViews,
   and popup-blocked browsers, so photos are shown in an in-app overlay instead.
   Styles are injected here so the lightbox works with any styles.css version. */

let photoLightboxPhotos = [];
let photoLightboxIndex = 0;

function ensurePhotoLightbox() {
  if (document.getElementById("photoLightbox")) return;
  const style = document.createElement("style");
  style.id = "photoLightboxStyles";
  style.textContent = `
    #photoLightbox { position: fixed; inset: 0; z-index: 12000; display: grid; grid-template-rows: auto 1fr auto; gap: 10px; padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); background: rgba(8, 15, 18, 0.93); backdrop-filter: blur(6px); }
    #photoLightbox[hidden] { display: none; }
    #photoLightbox .photo-lightbox-chrome { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #f2fbff; }
    #photoLightbox .photo-lightbox-title { font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #photoLightbox .photo-lightbox-close { width: 44px; height: 44px; border: 0; border-radius: 999px; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 18px; font-weight: 700; cursor: pointer; }
    #photoLightbox .photo-lightbox-stage { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; min-height: 0; }
    #photoLightbox .photo-lightbox-stage img { grid-column: 2; max-width: 100%; max-height: 100%; min-height: 0; margin: 0 auto; object-fit: contain; border-radius: 10px; }
    #photoLightbox .photo-lightbox-nav { width: 44px; height: 64px; border: 0; border-radius: 10px; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 26px; cursor: pointer; }
    #photoLightbox .photo-lightbox-nav:first-of-type { grid-column: 1; }
    #photoLightbox .photo-lightbox-nav:last-of-type { grid-column: 3; }
    #photoLightbox .photo-lightbox-nav[disabled] { opacity: 0.25; cursor: default; }
    #photoLightbox .photo-lightbox-count { text-align: center; color: rgba(242, 251, 255, 0.85); font-size: 13px; font-weight: 700; min-height: 18px; }
    body.photo-lightbox-open { overflow: hidden; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "photoLightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Photo viewer");
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="photo-lightbox-chrome">
      <span class="photo-lightbox-title"></span>
      <button type="button" class="photo-lightbox-close" aria-label="Close photo viewer">✕</button>
    </div>
    <div class="photo-lightbox-stage">
      <button type="button" class="photo-lightbox-nav" data-lightbox-step="-1" aria-label="Previous photo">‹</button>
      <img alt="Attached photo">
      <button type="button" class="photo-lightbox-nav" data-lightbox-step="1" aria-label="Next photo">›</button>
    </div>
    <div class="photo-lightbox-count" aria-live="polite"></div>
  `;
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".photo-lightbox-close")) {
      closePhotoLightbox();
      return;
    }
    const stepButton = event.target.closest("[data-lightbox-step]");
    if (stepButton && !stepButton.disabled) stepPhotoLightbox(Number(stepButton.dataset.lightboxStep));
  });
  document.addEventListener("keydown", (event) => {
    if (overlay.hidden) return;
    if (event.key === "Escape") closePhotoLightbox();
    if (event.key === "ArrowLeft") stepPhotoLightbox(-1);
    if (event.key === "ArrowRight") stepPhotoLightbox(1);
  });
  document.body.appendChild(overlay);
}

function renderPhotoLightbox() {
  const overlay = document.getElementById("photoLightbox");
  if (!overlay) return;
  const image = overlay.querySelector(".photo-lightbox-stage img");
  const count = overlay.querySelector(".photo-lightbox-count");
  const [prev, next] = overlay.querySelectorAll("[data-lightbox-step]");
  image.src = photoLightboxPhotos[photoLightboxIndex] || "";
  count.textContent = photoLightboxPhotos.length > 1 ? `Photo ${photoLightboxIndex + 1} of ${photoLightboxPhotos.length}` : "";
  prev.disabled = photoLightboxIndex <= 0;
  next.disabled = photoLightboxIndex >= photoLightboxPhotos.length - 1;
  prev.hidden = next.hidden = photoLightboxPhotos.length <= 1;
}

function stepPhotoLightbox(step) {
  const nextIndex = photoLightboxIndex + step;
  if (nextIndex < 0 || nextIndex >= photoLightboxPhotos.length) return;
  photoLightboxIndex = nextIndex;
  renderPhotoLightbox();
}

function openPhotoLightbox(title, photos) {
  const list = (photos || []).filter(Boolean);
  if (!list.length) {
    showToast("No photo attached to this item.", "info");
    return;
  }
  ensurePhotoLightbox();
  photoLightboxPhotos = list;
  photoLightboxIndex = 0;
  const overlay = document.getElementById("photoLightbox");
  overlay.querySelector(".photo-lightbox-title").textContent = title;
  overlay.hidden = false;
  document.body.classList.add("photo-lightbox-open");
  renderPhotoLightbox();
  overlay.querySelector(".photo-lightbox-close").focus();
}

function closePhotoLightbox() {
  const overlay = document.getElementById("photoLightbox");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("photo-lightbox-open");
}

let currentUser = readStoredUser();
let directoryUsers = [];
let editingUserAccessId = "";
let editingCategoryId = "";
let editingTechnicianId = "";
let editingOutletName = "";
let editingAssetId = "";
let activeMasterTab = "outlets";
const masterSearchTerms = {};
let adminQueueSearch = "";
let historySearch = "";
let editingAssignmentWindowId = "";
let editingMaintenanceRuleId = "";
let editingMaintenanceAssignments = [];
let ticketPhotoPreviewUrls = [];
let mobileNavOpen = false;
let desktopNavOpen = false;
let sidebarHoverTimer = 0;
let currentTheme = readStoredTheme();
let currentDashboardMode = readStoredDashboardMode();
let inactivityTimer = null;

const ASSET_BULK_COLUMNS = [
  "Location",
  "Item Name",
  "Category",
  "Sub Category",
  "Make",
  "Model",
  "Serial No.",
  "Power",
  "phase",
  "Diamantion",
  "Volume",
  "AMC",
  "Warrenty",
  "Purchase Date",
  "Purchase Price",
  "Vendor",
  "Remarks"
];

applyTheme(currentTheme);
applyDashboardMode(currentDashboardMode);

function isSingleRoleWorkspace(role = currentUser?.role) {
  return role === "manager" || role === "technician";
}

function roleHomeView(role = currentUser?.role) {
  if (role === "manager") return "manager";
  if (role === "technician") return "technician";
  return "dashboard";
}

function normalizeSessionUser(user) {
  if (!user) return null;
  const roleViews = ROLE_DEFAULT_VIEWS[user.role] || [];
  const roleAllowlist = ROLE_VIEW_ALLOWLIST[user.role] || roleViews;
  const mergedViews = [...(Array.isArray(user.allowedViews) ? user.allowedViews : []), ...roleViews]
    .filter((view, index, list) => roleAllowlist.includes(view) && list.indexOf(view) === index);

  return {
    ...user,
    allowedViews: mergedViews.length ? mergedViews : roleViews
  };
}

function readStoredUser() {
  try {
    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) || 0);
    if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
      sessionStorage.removeItem("ticketops-last-view");
      return null;
    }
    const user = normalizeSessionUser(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || null);
    if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

function saveUser(user) {
  currentUser = normalizeSessionUser(user);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
  markUserActivity();
}

function clearUser() {
  currentUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  sessionStorage.removeItem("ticketops-last-view");
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = null;
}

function markUserActivity() {
  if (!currentUser) return;
  localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()));
  scheduleInactivityLogout();
}

function scheduleInactivityLogout() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (!currentUser) return;

  const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) || Date.now());
  const remaining = Math.max(0, INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity));
  inactivityTimer = setTimeout(logoutForInactivity, remaining);
}

function logoutForInactivity() {
  if (!currentUser) return;
  clearUser();
  showLogin();
  showToast("Session closed after 15 minutes of inactivity.", "warning", 5000);
}

function readStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = currentTheme;
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.style.colorScheme = currentTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", currentTheme === "dark" ? "#0d1024" : "#f4f7ff");
  const button = document.querySelector("#themeToggle");
  if (button) {
    button.textContent = currentTheme === "dark" ? "Light" : "Dark";
    button.setAttribute("aria-pressed", currentTheme === "dark" ? "true" : "false");
    button.title = currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  }
}

function toggleTheme() {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

function readStoredDashboardMode() {
  const stored = localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
  return stored === "detail" ? "detail" : "summary";
}

function applyDashboardMode(mode) {
  currentDashboardMode = mode === "detail" ? "detail" : "summary";
  document.body.dataset.dashboardMode = currentDashboardMode;
  localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, currentDashboardMode);
  document.querySelectorAll("[data-dashboard-mode]").forEach((button) => {
    const active = button.dataset.dashboardMode === currentDashboardMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function toggleDashboardMode(mode) {
  applyDashboardMode(mode || (currentDashboardMode === "summary" ? "detail" : "summary"));
}

function isPortraitMobileNav() {
  return window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches;
}

function isLandscapeMobileNav() {
  return window.matchMedia("(max-width: 767px) and (orientation: landscape)").matches;
}

function isMobileNav() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function updateMobileNav() {
  const open = isMobileNav() && mobileNavOpen;
  const desktopOpen = !isMobileNav() && desktopNavOpen;
  document.body.classList.toggle("mobile-nav-open", open);
  document.body.classList.toggle("desktop-nav-open", desktopOpen);
  if (isMobileNav() || !currentUser) {
    document.body.classList.remove("sidebar-hover-open");
  }
  if (desktopOpen) {
    document.querySelector(".topbar")?.scrollTo?.({ top: 0, left: 0 });
  }
  const toggle = document.querySelector("#sidebarToggle");
  if (toggle) {
    const expanded = open || desktopOpen;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.setAttribute("aria-label", expanded ? "Close menu" : "Open menu");
    toggle.textContent = expanded ? "\u00d7" : "\u2630";
  }
}

function openMobileNav() {
  mobileNavOpen = true;
  updateMobileNav();
}

function closeMobileNav() {
  mobileNavOpen = false;
  updateMobileNav();
}

function toggleMobileNav() {
  mobileNavOpen = !mobileNavOpen;
  updateMobileNav();
}

function closeDesktopNav() {
  desktopNavOpen = false;
  updateMobileNav();
}

function toggleDesktopNav() {
  desktopNavOpen = !desktopNavOpen;
  updateMobileNav();
}

function setSidebarHoverOpen(open) {
  window.clearTimeout(sidebarHoverTimer);
  if (!currentUser || isMobileNav() || desktopNavOpen) {
    document.body.classList.remove("sidebar-hover-open");
    return;
  }
  const apply = () => {
    document.body.classList.toggle("sidebar-hover-open", open);
    if (open) document.querySelector(".topbar")?.scrollTo?.({ top: 0, left: 0 });
  };
  sidebarHoverTimer = window.setTimeout(apply, open ? 45 : 90);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]
  ));
}

async function compressImageFile(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) throw new Error("Attach an image file only.");

  const maxEdge = USE_APPS_SCRIPT_API ? GOOGLE_SHEETS_IMAGE_EDGE : MAX_IMAGE_EDGE;
  const imageQuality = USE_APPS_SCRIPT_API ? GOOGLE_SHEETS_IMAGE_QUALITY : IMAGE_QUALITY;
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img), { once: true });
      img.addEventListener("error", () => reject(new Error("Photo could not be read.")), { once: true });
      img.src = sourceUrl;
    });
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", imageQuality);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function maxTicketPhotosForStorage() {
  return USE_APPS_SCRIPT_API ? GOOGLE_SHEETS_MAX_TICKET_PHOTOS : MAX_TICKET_PHOTOS;
}

async function readTicketPhotos() {
  const input = document.querySelector("#ticketPhoto");
  const files = [...(input?.files || [])];
  if (!files.length) return [];
  const maxPhotos = maxTicketPhotosForStorage();
  if (files.length > maxPhotos) {
    throw new Error(`Attach up to ${maxPhotos} images only.`);
  }
  return Promise.all(files.map(compressImageFile));
}

function readTicketPhoto() {
  return readTicketPhotos().then((photos) => photos[0] || "");
}

async function readPhotosFromInput(input) {
  const files = [...(input?.files || [])];
  const maxPhotos = maxTicketPhotosForStorage();
  if (files.length > maxPhotos) throw new Error(`Attach up to ${maxPhotos} images only.`);
  return Promise.all(files.map(compressImageFile));
}

function updateTicketPhotoHint() {
  const input = document.querySelector("#ticketPhoto");
  const hint = document.querySelector("#ticketCreateResult");
  if (!input || !hint) return;
  const files = [...(input.files || [])];
  renderTicketPhotoPreview(files);
  if (!files.length) {
    hint.textContent = "";
    hint.classList.remove("form-error");
    return;
  }
  const maxPhotos = maxTicketPhotosForStorage();
  const overLimit = files.length > maxPhotos;
  hint.textContent = overLimit
    ? `Only ${maxPhotos} photo(s) can be attached. Please remove ${files.length - maxPhotos}.`
    : `${files.length} photo(s) selected. Photos will be compressed before upload.`;
  hint.classList.toggle("form-error", overLimit);
}

function renderTicketPhotoPreview(files = []) {
  const input = document.querySelector("#ticketPhoto");
  if (!input) return;

  let preview = document.querySelector("#ticketPhotoPreview");
  if (!preview) {
    preview = document.createElement("div");
    preview.id = "ticketPhotoPreview";
    preview.className = "ticket-photo-preview";
    input.closest(".photo-upload")?.insertAdjacentElement("afterend", preview);
  }

  ticketPhotoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  ticketPhotoPreviewUrls = [];

  const maxPhotos = maxTicketPhotosForStorage();
  if (!files.length) {
    preview.innerHTML = `
      <div class="photo-preview-empty">
        <strong>No photos selected</strong>
        <span>Attach up to ${escapeHtml(maxPhotos)} image${maxPhotos === 1 ? "" : "s"} before creating high-risk tickets.</span>
      </div>
    `;
    return;
  }

  const overLimit = files.length > maxPhotos;
  preview.innerHTML = `
    <div class="photo-preview-head ${overLimit ? "is-over-limit" : ""}">
      <strong>${escapeHtml(files.length)} selected</strong>
      <span>${overLimit ? `Remove ${escapeHtml(files.length - maxPhotos)} to continue` : `Limit ${escapeHtml(maxPhotos)} image${maxPhotos === 1 ? "" : "s"}`}</span>
    </div>
    <div class="photo-preview-grid">
      ${files.slice(0, maxPhotos).map((file) => {
        const url = URL.createObjectURL(file);
        ticketPhotoPreviewUrls.push(url);
        return `
          <figure>
            <img src="${escapeHtml(url)}" alt="${escapeHtml(file.name || "Selected issue photo")}">
            <figcaption>${escapeHtml(file.name || "Issue photo")}</figcaption>
          </figure>
        `;
      }).join("")}
    </div>
  `;
}

function readImageFile(file) {
  return compressImageFile(file);
}

function token(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function formatDateTime(value) {
  if (!value) return "Not logged";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not logged";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function isTicketReleased(ticket) {
  if (!ticket?.scheduledAt) return true;
  const scheduled = new Date(ticket.scheduledAt).getTime();
  return Number.isNaN(scheduled) || scheduled <= Date.now();
}

function formatAge(value) {
  if (!value) return "Fresh";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fresh";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m open`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h open`;

  const days = Math.floor(hours / 24);
  return `${days}d open`;
}

function parseClosePrice(value) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
}

function formatClosePrice(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "No price";
  return `Rs. ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysInputValue(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateRange(from, to) {
  if (!from && !to) return "No dates";
  if (from === to) return from;
  return `${from} to ${to}`;
}

function serviceAreaLabel(tech) {
  return (tech?.serviceOutlets || []).length ? tech.serviceOutlets.join(", ") : "All outlets";
}

function taskPhase(title = "") {
  const [phase] = String(title).split(":");
  return phase && phase !== title ? phase : "Checklist";
}

function taskPhaseRank(title = "") {
  const phase = taskPhase(title);
  return ["Morning Opening", "Mid-Day", "Closing", "Weekly", "Checklist"].indexOf(phase);
}

function taskRequiresEvidence(task) {
  const text = `${task?.title || ""} ${task?.notes || ""}`.toLowerCase();
  return /(temperature|freezer|refrigerator|gas|fire|extinguisher|leak|pest|safety)/.test(text);
}

function frequencyLabel(value = "") {
  const labels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    "half-yearly": "Half Yearly",
    yearly: "Yearly"
  };
  return labels[String(value || "").toLowerCase()] || "Scheduled";
}

function scheduleLabel(rule = {}) {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const frequency = String(rule.frequency || "daily").toLowerCase();
  if (frequency === "weekly") return `Weekly ${weekdays[rule.recurrenceDayOfWeek ?? 1] || "Mon"}`;
  if (frequency === "monthly") return `Monthly day ${rule.recurrenceDayOfMonth || 1}`;
  if (["quarterly", "half-yearly", "yearly"].includes(frequency)) {
    const monthText = (rule.recurrenceMonths || []).map((month) => months[month]).filter(Boolean).join(", ");
    return `${frequencyLabel(frequency)} ${monthText || "scheduled"} day ${rule.recurrenceDayOfMonth || 1}`;
  }
  return frequencyLabel(frequency);
}

function selectedNumericValues(selector) {
  return [...(document.querySelector(selector)?.selectedOptions || [])].map((option) => Number(option.value));
}

function taskFrequencyLabel(task) {
  const rule = maintenanceRuleForTask(task);
  if (rule?.frequency) return frequencyLabel(rule.frequency);
  const text = String(task?.notes || "");
  const match = text.match(/\b(Daily|Weekly|Monthly|Quarterly|Half Yearly|Yearly)\b/i);
  return match ? frequencyLabel(match[1].toLowerCase().replace(/\s+/g, "-")) : "Scheduled";
}

function ticketCategoryLabel(ticket = {}) {
  const asset = assetById(ticket.assetId);
  return ticket.category || asset?.category || "Uncategorized";
}

function taskCategoryLabel(task = {}) {
  const rule = maintenanceRuleForTask(task);
  const asset = assetById(task.assetId);
  return task.category || rule?.category || asset?.category || "Uncategorized";
}

function taskAssignedByLabel(task = {}) {
  const rule = maintenanceRuleForTask(task);
  if (task.createdBy) return userById(task.createdBy)?.name || task.createdBy;
  if (rule?.createdBy) return userById(rule.createdBy)?.name || rule.createdBy;
  return rule ? "Scheduler rule" : "System";
}

function isMaintenanceRuleDueOn(rule, day) {
  const date = new Date(`${day}T00:00:00`);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  const month = date.getMonth();
  const frequency = String(rule?.frequency || "daily").toLowerCase();
  const dayTarget = Math.min(Number(rule?.recurrenceDayOfMonth || 1), new Date(date.getFullYear(), month + 1, 0).getDate());
  const weekTarget = Number(rule?.recurrenceDayOfWeek ?? 1);
  const monthTargets = Array.isArray(rule?.recurrenceMonths) && rule.recurrenceMonths.length
    ? rule.recurrenceMonths
    : ({ quarterly: [0, 3, 6, 9], "half-yearly": [0, 6], yearly: [0] }[frequency] || []);
  return frequency === "daily" ||
    (frequency === "weekly" && dayOfWeek === weekTarget) ||
    (frequency === "monthly" && dayOfMonth === dayTarget) ||
    (["quarterly", "half-yearly", "yearly"].includes(frequency) && monthTargets.includes(month) && dayOfMonth === dayTarget);
}

function scheduledTasksForScope(scope = "admin") {
  const today = todayInputValue();
  let tasks = (state.tasks || []).filter((task) => task.date === today);
  if (scope === "manager") {
    const outlets = outletAccessForUser(currentUser);
    tasks = tasks.filter((task) => outlets.includes(task.outlet));
  }
  if (scope === "technician" && currentUser?.technicianId) {
    tasks = tasks.filter((task) => task.assignedTo === currentUser.technicianId);
  }
  return tasks.sort((a, b) => String(a.outlet || "").localeCompare(String(b.outlet || ""))
    || String(technicianById(a.assignedTo)?.name || "").localeCompare(String(technicianById(b.assignedTo)?.name || ""))
    || (a.status === "Done") - (b.status === "Done")
    || String(a.title || "").localeCompare(String(b.title || "")));
}

function scheduledTaskRows(tasks, { allowActions = false } = {}) {
  return tasks.length ? tasks.map((task) => {
    const phase = taskPhase(task.title);
    const title = String(task.title || "").replace(`${phase}: `, "");
    const rule = maintenanceRuleForTask(task);
    const windowText = rule?.allowOutsideWindow ? "All day" : rule ? `${rule.startTime || "?"} - ${rule.endTime || "?"}` : "Scheduled";
    const technician = technicianById(task.assignedTo);
    const category = taskCategoryLabel(task);
    const assignedBy = taskAssignedByLabel(task);
    const needsEvidence = taskRequiresEvidence(task);
    const evidencePhoto = task.evidencePhotoUrl || task.photoUrl || "";
    return `
      <article class="task-row status-${token(task.status)} ${needsEvidence && task.status !== "Done" ? "requires-evidence" : ""}">
        <div class="task-main">
          <div class="task-title-row">
            <strong>${escapeHtml(title)}</strong>
            <span class="task-window">${escapeHtml(windowText)}</span>
          </div>
          <span class="task-meta">${escapeHtml(task.outlet)} / Category: ${escapeHtml(category)} / Tech: ${escapeHtml(technician?.name || "Unassigned")} / Assigned by: ${escapeHtml(assignedBy)} / ${escapeHtml(taskFrequencyLabel(task))}</span>
          <div class="task-tags">
            <span>${escapeHtml(task.status)}</span>
            <span>${escapeHtml(phase)}</span>
            ${needsEvidence ? `<span>Photo evidence</span>` : ""}
            ${task.evidenceComment ? `<span>${escapeHtml(task.evidenceComment)}</span>` : ""}
          </div>
        </div>
        <div class="task-actions">
          ${evidencePhoto ? `<button type="button" class="small-button" data-task-photo="${escapeHtml(task.id)}">Evidence</button>` : ""}
          ${allowActions && task.status !== "Done" ? `<button type="button" class="small-button success task-done-button" data-task-done="${escapeHtml(task.id)}">Done</button>` : ""}
          ${allowActions && task.status !== "Done" ? `<button type="button" class="small-button warning" data-task-not-done="${escapeHtml(task.id)}">Not Done</button>` : ""}
        </div>
      </article>
    `;
  }).join("") : `<div class="empty">No scheduled jobs for today.</div>`;
}

function chooseEvidencePhoto() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.top = "0";
  document.body.appendChild(input);
  return new Promise((resolve, reject) => {
    const cleanup = () => input.remove();
    input.addEventListener("change", async () => {
      try {
        const file = input.files?.[0];
        resolve(file ? await readImageFile(file) : "");
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    }, { once: true });
    input.addEventListener("cancel", () => {
      cleanup();
      resolve("");
    }, { once: true });
    input.click();
  });
}

function ticketStep(status) {
  return STATUS_STEPS[status] || { label: status || "Unknown", percent: 16 };
}

function ticketAdminBucket(ticket) {
  if (ticket.status === "Blocked") return "Blocked";
  if (["Resolved", "Verification Pending"].includes(ticket.status)) return "Ready for Verification";
  if (!ticket.assignedTo) return ticket.priority === "P1" ? "Critical Unassigned" : "Unassigned";
  if (ticket.priority === "P1") return "Critical Assigned";
  return "Assigned";
}

function ticketNextAction(ticket, assigned, suggested) {
  if (ticket.scheduledAt && !isTicketReleased(ticket)) {
    return `${assigned?.name || "Technician"} receives this at ${formatDateTime(ticket.scheduledAt)}`;
  }
  if (ticket.status === "Blocked") return "Admin: unblock part, vendor, or decision";
  if (["Resolved", "Verification Pending"].includes(ticket.status)) return "Manager: verify and close";
  if (!ticket.assignedTo) {
    return suggested ? `Manager/Admin: assign ${suggested.name}` : "Manager/Admin: assign technician";
  }
  if (ticket.status === "Assigned") return `${assigned?.name || "Technician"}: acknowledge job`;
  if (ticket.status === "Acknowledged") return `${assigned?.name || "Technician"}: start work`;
  if (ticket.status === "In Progress") return `${assigned?.name || "Technician"}: resolve or block`;
  if (ticket.status === "Reopened") return `${assigned?.name || "Technician"}: fix rejected work`;
  return "Monitor progress";
}

function ticketWorkflowSteps(ticket) {
  const steps = [
    { label: "Setup", done: true },
    { label: "Ticket", done: Boolean(ticket.id) },
    { label: "Dispatch", done: Boolean(ticket.assignedTo), active: !ticket.assignedTo },
    { label: "Time", done: !ticket.scheduledAt || isTicketReleased(ticket), active: Boolean(ticket.assignedTo && ticket.scheduledAt && !isTicketReleased(ticket)) },
    { label: "Work", done: ["Resolved", "Verification Pending", "Closed"].includes(ticket.status), active: ["Assigned", "Acknowledged", "In Progress", "Blocked", "Reopened"].includes(ticket.status) && (!ticket.scheduledAt || isTicketReleased(ticket)) },
    { label: "Review", done: ticket.status === "Closed", active: ["Resolved", "Verification Pending"].includes(ticket.status) },
    { label: "Close", done: ticket.status === "Closed" }
  ];
  return steps.map((step) => ({
    ...step,
    className: step.done ? "is-done" : step.active ? "is-active" : ""
  }));
}

function technicianOpenWorkload(technicianId) {
  return (stateIndex.ticketsByTechnicianId.get(technicianId) || [])
    .filter((ticket) => !["Closed", "Cancelled"].includes(ticket.status))
    .length;
}

function technicianPendingTasks(technicianId) {
  return stateIndex.todayPendingTasksByTechnicianId.get(technicianId) || 0;
}

function technicianSkillLabel() {
  return "All skills";
}

function maintenanceRuleTechnicianLabel(rule) {
  if (!rule?.assignedTechnicianId) return "Balanced";
  return technicianById(rule.assignedTechnicianId)?.name || "Assigned technician";
}

function technicianCoversOutlet(tech, outlet) {
  const outlets = Array.isArray(tech?.serviceOutlets) ? tech.serviceOutlets : [];
  return !outlets.length || !outlet || outlets.includes(outlet);
}

function maintenanceRuleForTask(task) {
  if (!task?.ruleId) return null;
  return stateIndex.maintenanceRulesById.get(task.ruleId) || null;
}

function technicianAssignmentSummary(tech, ticket) {
  // Empty serviceOutlets means "All outlets" — same semantics as technicianCoversOutlet and serviceAreaLabel.
  const servesOutlet = technicianCoversOutlet(tech, ticket.outlet);
  const skillMatch = true;
  const assignable = ["Present", "Busy", "Emergency Available"].includes(tech?.status);
  const openJobs = technicianOpenWorkload(tech?.id);
  const pendingTasks = technicianPendingTasks(tech?.id);
  const risk = [
    !assignable ? `${tech?.status || "Unavailable"}` : "",
    !servesOutlet ? "not registered for outlet" : ""
  ].filter(Boolean);

  return {
    assignable,
    servesOutlet,
    skillMatch,
    openJobs,
    pendingTasks,
    risk,
    label: `${tech?.name || "Technician"} - ${tech?.status || "Unknown"} / ${technicianSkillLabel(tech)} / ${openJobs} jobs / ${pendingTasks} tasks`,
    reason: `${technicianSkillLabel(tech)} / ${servesOutlet ? `serves ${ticket.outlet}` : `not registered for ${ticket.outlet}`} / ${openJobs} active / ${pendingTasks} pending`
  };
}

function adminTicketSort(a, b) {
  const bucketRank = {
    "Critical Unassigned": 1,
    "Blocked": 2,
    "Ready for Verification": 3,
    "Unassigned": 4,
    "Critical Assigned": 5,
    "Assigned": 6
  };
  const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 };
  return (bucketRank[ticketAdminBucket(a)] || 9) - (bucketRank[ticketAdminBucket(b)] || 9)
    || (priorityRank[a.priority] || 9) - (priorityRank[b.priority] || 9)
    || String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
}

function assetById(id) {
  return stateIndex.assetsById.get(id);
}

function tasksForAsset(assetId) {
  return stateIndex.tasksByAssetId.get(assetId) || [];
}

function ticketsForAsset(assetId) {
  return stateIndex.ticketsByAssetId.get(assetId) || [];
}

function assetCurrentTechnicians(assetId) {
  const ids = new Set([
    ...tasksForAsset(assetId).filter((task) => task.status !== "Done").map((task) => task.assignedTo),
    ...ticketsForAsset(assetId).filter((ticket) => ticket.status !== "Closed").map((ticket) => ticket.assignedTo)
  ].filter(Boolean));
  return [...ids].map(technicianById).filter(Boolean);
}

function allowedViews() {
  const baseViews = currentUser?.allowedViews?.length
    ? [...currentUser.allowedViews]
    : [...(ROLE_DEFAULT_VIEWS[currentUser?.role] || [])];
  for (const view of ROLE_DEFAULT_VIEWS[currentUser?.role] || []) {
    if (!baseViews.includes(view)) baseViews.push(view);
  }
  const roleAllowlist = ROLE_VIEW_ALLOWLIST[currentUser?.role] || baseViews;
  const views = baseViews.filter((view) => roleAllowlist.includes(view));

  if (!views.length) {
    views.push(roleHomeView());
  }

  if (!isSingleRoleWorkspace() && !views.includes("dashboard")) {
    views.unshift("dashboard");
  }

  return views;
}

function canUseView(view) {
  return allowedViews().includes(view);
}

function canOpenView(view) {
  return canUseView(view);
}

function ticketsForCurrentUser(tickets) {
  if (!currentUser) return [];
  if (currentUser.role === "manager") {
    const outlets = outletAccessForUser(currentUser);
    return tickets.filter((ticket) => outlets.includes(ticket.outlet));
  }
  if (currentUser.role === "technician" && currentUser.technicianId) {
    return tickets.filter((ticket) => ticket.assignedTo === currentUser.technicianId);
  }
  return tickets;
}

function outletAccessForUser(user = currentUser) {
  if (!user) return [];
  if (user.accessAllOutlets) return [...(state.outlets || [])];
  const allowed = Array.isArray(user.allowedOutlets) ? user.allowedOutlets.filter((outlet) => (state.outlets || []).includes(outlet)) : [];
  if (allowed.length) return allowed;
  if (user.outlet && (state.outlets || []).includes(user.outlet)) return [user.outlet];
  return user.role === "admin" ? [...(state.outlets || [])] : [];
}

function selectedOptionValues(select) {
  return [...(select?.selectedOptions || [])].map((option) => option.value).filter(Boolean);
}

function skillValuesFromText(value) {
  return String(value || "")
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function selectedSkillValues(select) {
  const selected = selectedOptionValues(select);
  return selected.length ? selected : skillValuesFromText(select?.value);
}

function setSelectedValues(select, values = []) {
  const wanted = new Set(values.filter(Boolean));
  [...(select?.options || [])].forEach((option) => {
    option.selected = wanted.has(option.value);
  });
}

function userAccessRole() {
  return document.querySelector("#accessRole")?.value || "manager";
}

function updateUserAccessVisibility() {
  const role = userAccessRole();
  const allOutlets = document.querySelector("#accessAllOutlets");
  const skillField = document.querySelector(".user-skill-field");
  const allOutletField = document.querySelector(".user-all-outlets-field");
  const outletField = document.querySelector(".user-outlet-field");
  const isAdmin = role === "admin";
  const isTechnician = role === "technician";

  if (allOutlets && isAdmin) allOutlets.checked = true;
  if (allOutlets) allOutlets.disabled = isAdmin;
  skillField?.classList.toggle("is-collapsed", !isTechnician);
  allOutletField?.classList.toggle("is-admin-locked", isAdmin);
  outletField?.classList.toggle("is-collapsed", Boolean(allOutlets?.checked));
}

function renderSelectionPanel(select, panel, { multiple = false, emptyText = "No options yet" } = {}) {
  if (!select || !panel) return;
  const selectedValues = new Set(selectedOptionValues(select));
  if (!multiple && select.value) selectedValues.add(select.value);
  const options = [...select.options].filter((option) => option.value);
  const controls = multiple && options.length ? `
    <div class="selection-panel-tools">
      <button type="button" class="selection-tool" data-select-panel-action="${escapeHtml(select.id)}" data-select-action="all">Select all</button>
      <button type="button" class="selection-tool" data-select-panel-action="${escapeHtml(select.id)}" data-select-action="none">Deselect all</button>
    </div>
  ` : "";
  const choices = options.length
    ? options.map((option) => {
      const selected = selectedValues.has(option.value);
      return `
        <button type="button" class="selection-pill ${selected ? "is-selected" : ""}" data-select-panel-option="${escapeHtml(select.id)}" data-option-value="${escapeHtml(option.value)}" aria-pressed="${selected}">
          <span>${escapeHtml(option.textContent || option.value)}</span>
        </button>
      `;
    }).join("")
    : `<span class="selection-empty">${escapeHtml(emptyText)}</span>`;
  panel.innerHTML = `${controls}<div class="selection-panel-options">${choices}</div>`;
}

function renderMasterSelectionPanels() {
  updateUserAccessVisibility();
  renderSelectionPanel(document.querySelector("#technicianSkill"), document.querySelector("#technicianSkillPanel"), { multiple: true, emptyText: "Add categories first" });
  renderSelectionPanel(document.querySelector("#accessSkill"), document.querySelector("#accessSkillPanel"), { multiple: true, emptyText: "Add categories first" });
  renderSelectionPanel(document.querySelector("#technicianOutlet"), document.querySelector("#technicianOutletPanel"), { multiple: true, emptyText: "Add outlets first" });
  renderSelectionPanel(document.querySelector("#accessOutlets"), document.querySelector("#accessOutletPanel"), { multiple: true, emptyText: "Add outlets first" });
}

function userOutletLabel(user) {
  if (user.accessAllOutlets) return "All outlets";
  const outlets = Array.isArray(user.allowedOutlets) && user.allowedOutlets.length ? user.allowedOutlets : user.outlet ? [user.outlet] : [];
  return outlets.length ? outlets.join(", ") : "No outlet access";
}

async function api(path, options = {}) {
  if (USE_BROWSER_FALLBACK_API) {
    const result = await browserFallbackApi(path, options);
    if (String(options.method || "GET").toUpperCase() !== "GET") {
      localStorage.removeItem(bootstrapCacheKey());
    }
    return result;
  }

  if (USE_APPS_SCRIPT_API) {
    const result = await appsScriptApi(path, options);
    if (String(options.method || "GET").toUpperCase() !== "GET") {
      localStorage.removeItem(bootstrapCacheKey());
    }
    return result;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  if (String(options.method || "GET").toUpperCase() !== "GET") {
    localStorage.removeItem(bootstrapCacheKey());
  }
  return response.json();
}

function browserReadDb() {
  if (LOCAL_DATA_MODE === "empty") return makeEmptyBrowserDb();
  try {
    const stored = JSON.parse(localStorage.getItem(BROWSER_DB_STORAGE_KEY) || "null");
    if (stored && typeof stored === "object") return browserNormalizeDb(stored);
  } catch {
    // Fall through to seed.
  }
  const seeded = browserNormalizeDb(JSON.parse(JSON.stringify(BROWSER_FALLBACK_DB)));
  localStorage.setItem(BROWSER_DB_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function browserWriteDb(db) {
  if (LOCAL_DATA_MODE === "empty") return;
  localStorage.setItem(BROWSER_DB_STORAGE_KEY, JSON.stringify(browserNormalizeDb(db)));
}

function makeEmptyBrowserDb() {
  const db = JSON.parse(JSON.stringify(BROWSER_FALLBACK_DB));
  db.outlets = [];
  db.outletLocations = {};
  db.categories = [];
  db.assets = [];
  db.technicians = [];
  db.tickets = [];
  db.tasks = [];
  db.assignmentTimeWindows = [];
  db.maintenanceRules = [];
  db.attendancePlans = [];
  db.activity = [];
  db.reports = browserReports(db);
  return browserNormalizeDb(db);
}

function browserNormalizeDb(db) {
  const next = db || {};
  ["users", "outlets", "categories", "assets", "technicians", "tickets", "tasks", "assignmentTimeWindows", "maintenanceRules", "attendancePlans"].forEach((key) => {
    if (!Array.isArray(next[key])) next[key] = [];
  });
  if (!next.outletLocations || typeof next.outletLocations !== "object") next.outletLocations = {};
  return next;
}

function browserPublicUser(user) {
  const { password, passwordPlain, passwordHash, ...safeUser } = user || {};
  return normalizeSessionUser(safeUser);
}

function browserRequestUser(db, options = {}) {
  const userId = options.headers?.["X-TicketOps-User"] || options.headers?.["x-ticketops-user"] || currentUser?.id || "";
  return (db.users || []).find((user) => user.id === userId) || null;
}

function browserRequireUser(user) {
  if (!user) throw new Error("Login required");
}

function browserRequireAdmin(user) {
  browserRequireUser(user);
  if (user.role !== "admin") throw new Error("Only admin can perform this action");
}

function browserScopedDb(db, user) {
  const scoped = JSON.parse(JSON.stringify(db));
  if (!user) return scoped;
  if (user.role === "manager") {
    const outlets = user.accessAllOutlets ? scoped.outlets : user.allowedOutlets?.length ? user.allowedOutlets : user.outlet ? [user.outlet] : [];
    scoped.assets = scoped.assets.filter((asset) => outlets.includes(asset.outlet));
    scoped.tasks = scoped.tasks.filter((task) => outlets.includes(task.outlet));
    scoped.tickets = scoped.tickets.filter((ticket) => outlets.includes(ticket.outlet));
  }
  if (user.role === "technician" && user.technicianId) {
    scoped.technicians = scoped.technicians.filter((tech) => tech.id === user.technicianId);
    scoped.tasks = scoped.tasks.filter((task) => task.assignedTo === user.technicianId);
    scoped.tickets = scoped.tickets.filter((ticket) => ticket.assignedTo === user.technicianId || ticket.createdBy === user.id);
  }
  scoped.users = scoped.users.map(browserPublicUser);
  scoped.reports = browserReports(scoped);
  scoped.storage = "browser";
  scoped.stitch = { configured: false, endpoint: "" };
  return scoped;
}

function browserReports(db) {
  const tickets = db.tickets || [];
  const tasks = db.tasks || [];
  const doneTasks = tasks.filter((task) => task.status === "Done").length;
  const closedTickets = tickets.filter((ticket) => ticket.status === "Closed");
  const closePriceTotal = closedTickets.reduce((sum, ticket) => sum + Number(ticket.closePrice || 0), 0);
  return {
    total: tickets.length,
    open: tickets.filter((ticket) => !["Closed", "Cancelled"].includes(ticket.status)).length,
    closed: closedTickets.length,
    closePriceTotal,
    closePriceCount: closedTickets.filter((ticket) => Number(ticket.closePrice || 0) > 0).length,
    taskCompletionRate: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
    technicianCount: (db.technicians || []).length,
    byOutlet: (db.outlets || []).map((outlet) => ({
      outlet,
      count: tickets.filter((ticket) => ticket.outlet === outlet).length,
      open: tickets.filter((ticket) => ticket.outlet === outlet && !["Closed", "Cancelled"].includes(ticket.status)).length,
      closed: tickets.filter((ticket) => ticket.outlet === outlet && ticket.status === "Closed").length,
      closePriceTotal: tickets.filter((ticket) => ticket.outlet === outlet && ticket.status === "Closed").reduce((sum, ticket) => sum + Number(ticket.closePrice || 0), 0)
    }))
  };
}

function browserNextId(items, prefix) {
  return `${prefix}${String((items || []).length + 1001)}-${Date.now().toString(36).toUpperCase()}`;
}

function browserCsvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function browserToCsv(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => browserCsvEscape(row[header])).join(","))
  ].join("\n");
}

function browserDateKey() {
  return todayInputValue();
}

function browserExportCsv(db, type) {
  if (type === "tasks") {
    const headers = ["id", "date", "outlet", "title", "assignedTo", "status", "completedAt", "notes"];
    const rows = (db.tasks || []).map((task) => ({
      id: task.id,
      date: task.date || task.taskDate || "",
      outlet: task.outlet || "",
      title: task.title || "",
      assignedTo: technicianById(task.assignedTo)?.name || task.assignedTo || "",
      status: task.status || "",
      completedAt: task.completedAt || "",
      notes: task.notes || ""
    }));
    return { filename: `ticketops-tasks-${browserDateKey()}.csv`, csv: browserToCsv(headers, rows) };
  }

  if (type === "tickets") {
    const headers = ["id", "outlet", "category", "priority", "status", "assignedTo", "createdAt", "updatedAt", "latestDetail"];
    const rows = (db.tickets || []).map((ticket) => ({
      id: ticket.id,
      outlet: ticket.outlet || "",
      category: ticket.category || "",
      priority: ticket.priority || "",
      status: ticket.status || "",
      assignedTo: technicianById(ticket.assignedTo)?.name || ticket.assignedTo || "",
      createdAt: ticket.createdAt || "",
      updatedAt: ticket.updatedAt || "",
      latestDetail: ticket.latestDetail || ticket.note || ""
    }));
    return { filename: `ticketops-tickets-${browserDateKey()}.csv`, csv: browserToCsv(headers, rows) };
  }

  if (type === "technicians") {
    const headers = ["id", "name", "skill", "status", "quality", "serviceOutlets"];
    const rows = (db.technicians || []).map((tech) => ({
      id: tech.id,
      name: tech.name || "",
      skill: tech.skill || (tech.skills || []).join(", "),
      status: tech.status || "",
      quality: tech.quality || "",
      serviceOutlets: (tech.serviceOutlets || []).join(", ")
    }));
    return { filename: `ticketops-technicians-${browserDateKey()}.csv`, csv: browserToCsv(headers, rows) };
  }

  if (type === "outlets") {
    const headers = ["name", "address", "latitude", "longitude"];
    const rows = (db.outlets || []).map((name) => ({
      name,
      address: db.outletLocations?.[name]?.address || "",
      latitude: db.outletLocations?.[name]?.latitude || "",
      longitude: db.outletLocations?.[name]?.longitude || ""
    }));
    return { filename: `ticketops-outlets-${browserDateKey()}.csv`, csv: browserToCsv(headers, rows) };
  }

  return null;
}

function browserMonthRange(month = "") {
  return /^\d{4}-\d{2}$/.test(month) ? month : "";
}

function browserMonthlyBackup(db, month) {
  const selectedMonth = browserMonthRange(month);
  if (!selectedMonth) return null;
  const backup = {
    type: "ticketops-monthly-backup",
    version: 1,
    month: selectedMonth,
    generatedAt: new Date().toISOString(),
    outlets: db.outlets || [],
    outletLocations: db.outletLocations || {},
    categories: db.categories || [],
    assets: db.assets || [],
    technicians: db.technicians || [],
    maintenanceRules: db.maintenanceRules || [],
    assignmentTimeWindows: db.assignmentTimeWindows || [],
    tickets: (db.tickets || []).filter((ticket) => String(ticket.createdAt || "").slice(0, 7) === selectedMonth || String(ticket.updatedAt || "").slice(0, 7) === selectedMonth),
    tasks: (db.tasks || []).filter((task) => String(task.date || task.taskDate || "").slice(0, 7) === selectedMonth)
  };
  return { ...backup, report: browserBackupReport(backup) };
}

function browserBackupReport(backup = {}) {
  const tickets = backup.tickets || [];
  const tasks = backup.tasks || [];
  const doneTasks = tasks.filter((task) => task.status === "Done").length;
  const openTickets = tickets.filter((ticket) => !["Closed", "Cancelled"].includes(ticket.status)).length;
  const closedTickets = tickets.filter((ticket) => ticket.status === "Closed").length;
  const outlets = [...new Set([...(backup.outlets || []), ...tickets.map((ticket) => ticket.outlet), ...tasks.map((task) => task.outlet)].filter(Boolean))].sort();
  return {
    month: backup.month || "",
    totals: {
      tickets: tickets.length,
      openTickets,
      closedTickets,
      tasks: tasks.length,
      completedTasks: doneTasks,
      taskCompletionRate: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 100
    },
    byOutlet: outlets.map((outlet) => {
      const outletTickets = tickets.filter((ticket) => ticket.outlet === outlet);
      const outletTasks = tasks.filter((task) => task.outlet === outlet);
      return {
        outlet,
        tickets: outletTickets.length,
        closed: outletTickets.filter((ticket) => ticket.status === "Closed").length,
        tasks: outletTasks.length,
        doneTasks: outletTasks.filter((task) => task.status === "Done").length
      };
    })
  };
}

async function browserFallbackApi(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const db = browserReadDb();
  const user = browserRequestUser(db, options);

  if (method === "POST" && path === "/api/auth/login") {
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const found = (db.users || []).find((item) => item.username === username);
    if (!found || ![BROWSER_FALLBACK_PASSWORDS[username], found.passwordPlain, found.password].filter(Boolean).includes(password)) {
      throw new Error("Invalid username or password");
    }
    return { user: browserPublicUser(found) };
  }

  if (method === "GET" && path === "/api/auth/demo-users") return { users: db.users.map(browserPublicUser) };
  if (method === "GET" && path === "/api/bootstrap") {
    browserRequireUser(user);
    return browserScopedDb(db, user);
  }
  if (method === "GET" && /^\/api\/reports\/export\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const exportFile = browserExportCsv(db, decodeURIComponent(path.split("/")[4]));
    if (!exportFile) throw new Error("Unknown report export");
    return exportFile;
  }
  if (method === "GET" && /^\/api\/backups\/monthly\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const backup = browserMonthlyBackup(db, decodeURIComponent(path.split("/")[4]));
    if (!backup) throw new Error("Use month format YYYY-MM");
    return backup;
  }
  if (method === "POST" && path === "/api/backups/report") {
    browserRequireAdmin(user);
    if (body?.type !== "ticketops-monthly-backup") throw new Error("Invalid TicketOps backup file");
    return browserBackupReport(body);
  }
  if (method === "POST" && /^\/api\/technician\/tasks\/[^/]+\/status$/.test(path)) {
    browserRequireUser(user);
    if (user.role !== "technician") throw new Error("Technician access only");
    const task = db.tasks.find((item) => item.id === decodeURIComponent(path.split("/")[4]));
    if (!task) throw new Error("Task not found");
    if (task.assignedTo && user.technicianId && task.assignedTo !== user.technicianId) {
      throw new Error("Technicians can only update their own tasks");
    }
    const status = String(body.status || "").toLowerCase();
    if (!["done", "not_done"].includes(status)) throw new Error("Only status done or not_done is allowed");
    task.status = status === "done" ? "Done" : "Not Done";
    task.evidenceComment = body.comment || task.evidenceComment || "";
    task.photoUrl = body.photoUrl || task.photoUrl || "";
    task.evidencePhotoUrl = body.photoUrl || body.evidencePhotoUrl || task.evidencePhotoUrl || task.photoUrl || "";
    task.photoUrls = body.photoUrls || task.photoUrls || [];
    task.completedAt = task.status === "Done" ? new Date().toISOString() : "";
    browserWriteDb(db);
    return { task, reports: browserReports(db) };
  }
  if (method === "GET" && path === "/api/categories") {
    browserRequireAdmin(user);
    return db.categories || [];
  }
  if (method === "POST" && path === "/api/outlets") {
    browserRequireAdmin(user);
    const name = String(body.name || "").trim();
    if (!name) throw new Error("Outlet name is required");
    if (!db.outlets.includes(name)) db.outlets.push(name);
    db.outletLocations[name] = { address: body.address || "", latitude: body.latitude || null, longitude: body.longitude || null };
    browserWriteDb(db);
    return { name, ...(db.outletLocations[name] || {}) };
  }
  if (method === "PATCH" && /^\/api\/outlets\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const oldName = decodeURIComponent(path.split("/")[3]);
    const name = String(body.name || oldName).trim();
    if (!db.outlets.includes(oldName)) throw new Error("Outlet not found");
    db.outlets = db.outlets.map((outlet) => outlet === oldName ? name : outlet);
    const previousLocation = db.outletLocations[oldName] || {};
    delete db.outletLocations[oldName];
    db.outletLocations[name] = { ...previousLocation, address: body.address || previousLocation.address || "", latitude: body.latitude || previousLocation.latitude || null, longitude: body.longitude || previousLocation.longitude || null };
    db.assets.forEach((asset) => { if (asset.outlet === oldName) asset.outlet = name; });
    db.technicians.forEach((tech) => {
      if (tech.outlet === oldName) tech.outlet = name;
      tech.serviceOutlets = (tech.serviceOutlets || []).map((outlet) => outlet === oldName ? name : outlet);
    });
    db.users.forEach((item) => {
      if (item.outlet === oldName) item.outlet = name;
      item.allowedOutlets = (item.allowedOutlets || []).map((outlet) => outlet === oldName ? name : outlet);
    });
    browserWriteDb(db);
    return { name, ...(db.outletLocations[name] || {}) };
  }
  if (method === "DELETE" && /^\/api\/outlets\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const name = decodeURIComponent(path.split("/")[3]);
    db.outlets = db.outlets.filter((outlet) => outlet !== name);
    delete db.outletLocations[name];
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && path === "/api/categories") {
    browserRequireAdmin(user);
    const category = { id: browserNextId(db.categories, "C-"), name: body.name || "", description: body.description || "" };
    db.categories.push(category);
    browserWriteDb(db);
    return category;
  }
  if (method === "PATCH" && /^\/api\/categories\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const category = db.categories.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!category) throw new Error("Category not found");
    Object.assign(category, { name: body.name || category.name, description: body.description || "" });
    browserWriteDb(db);
    return category;
  }
  if (method === "DELETE" && /^\/api\/categories\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const categoryId = decodeURIComponent(path.split("/")[3]);
    db.categories = db.categories.filter((item) => item.id !== categoryId);
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && path === "/api/assets") {
    browserRequireAdmin(user);
    const asset = { id: browserNextId(db.assets, "ASSET-"), outlet: body.outlet || "", category: body.category || "", name: body.name || "", code: body.code || "", status: body.status || "Active", notes: body.notes || "" };
    db.assets.unshift(asset);
    browserWriteDb(db);
    return asset;
  }
  if (method === "PATCH" && /^\/api\/assets\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const asset = db.assets.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!asset) throw new Error("Asset not found");
    Object.assign(asset, { outlet: body.outlet || asset.outlet, category: body.category || asset.category, name: body.name || asset.name, code: body.code || "", status: body.status || asset.status || "Active" });
    browserWriteDb(db);
    return asset;
  }
  if (method === "DELETE" && /^\/api\/assets\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const assetId = decodeURIComponent(path.split("/")[3]);
    db.assets = db.assets.filter((item) => item.id !== assetId);
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && path === "/api/technicians") {
    browserRequireAdmin(user);
    const technician = { id: browserNextId(db.technicians, "T-"), name: body.name || "", skill: body.skill || "", skills: body.skills || [], status: "Present", workload: 0, quality: 90, outlet: body.outlet || "", serviceOutlets: body.serviceOutlets || [] };
    db.technicians.push(technician);
    browserWriteDb(db);
    return technician;
  }
  if (method === "PATCH" && /^\/api\/technicians\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const technician = db.technicians.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!technician) throw new Error("Technician not found");
    Object.assign(technician, { name: body.name || technician.name, skill: body.skill || technician.skill, skills: body.skills || technician.skills || [], outlet: body.outlet || technician.outlet || "", serviceOutlets: body.serviceOutlets || technician.serviceOutlets || [] });
    browserWriteDb(db);
    return technician;
  }
  if (method === "DELETE" && /^\/api\/technicians\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const technicianId = decodeURIComponent(path.split("/")[3]);
    db.technicians = db.technicians.filter((item) => item.id !== technicianId);
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && path === "/api/assignment-windows") {
    browserRequireAdmin(user);
    const window = { id: browserNextId(db.assignmentTimeWindows, "AW-"), name: body.name || "", days: body.allDays ? [0, 1, 2, 3, 4, 5, 6] : body.days || [], startTime: body.startTime || "", endTime: body.endTime || "", active: body.active !== false, createdAt: new Date().toISOString() };
    db.assignmentTimeWindows.push(window);
    browserWriteDb(db);
    return window;
  }
  if (method === "PATCH" && /^\/api\/assignment-windows\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const window = db.assignmentTimeWindows.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!window) throw new Error("Dispatch window not found");
    Object.assign(window, { name: body.name || window.name, days: body.allDays ? [0, 1, 2, 3, 4, 5, 6] : body.days || window.days || [], startTime: body.startTime || window.startTime, endTime: body.endTime || window.endTime, active: body.active !== false });
    browserWriteDb(db);
    return window;
  }
  if (method === "DELETE" && /^\/api\/assignment-windows\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const windowId = decodeURIComponent(path.split("/")[3]);
    db.assignmentTimeWindows = db.assignmentTimeWindows.filter((item) => item.id !== windowId);
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && path === "/api/admin/users") {
    browserRequireAdmin(user);
    const username = String(body.username || "").trim().toLowerCase();
    if (!username) throw new Error("Username is required");
    const created = { id: browserNextId(db.users, "U-"), username, passwordPlain: body.password || "", name: body.name || username, post: body.post || "", role: body.role || "manager", outlet: (body.allowedOutlets || [])[0] || "", accessAllOutlets: Boolean(body.accessAllOutlets), allowedOutlets: body.allowedOutlets || [], address: body.address || "", defaultView: (body.role || "manager") === "technician" ? "technician" : "manager", allowedViews: ROLE_DEFAULT_VIEWS[body.role] || ROLE_DEFAULT_VIEWS.manager };
    db.users.push(created);
    browserWriteDb(db);
    return browserPublicUser(created);
  }
  if (method === "PATCH" && /^\/api\/admin\/users\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const target = db.users.find((item) => item.id === decodeURIComponent(path.split("/")[4]));
    if (!target) throw new Error("User not found");
    Object.assign(target, { name: body.name || target.name, post: body.post || "", role: body.role || target.role, accessAllOutlets: Boolean(body.accessAllOutlets), allowedOutlets: body.allowedOutlets || [], outlet: (body.allowedOutlets || [])[0] || target.outlet || "", address: body.address || "" });
    if (body.password) target.passwordPlain = body.password;
    browserWriteDb(db);
    return browserPublicUser(target);
  }
  if (method === "DELETE" && /^\/api\/admin\/users\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const userId = decodeURIComponent(path.split("/")[4]);
    db.users = db.users.filter((item) => item.id !== userId);
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && path === "/api/reset") {
    browserRequireAdmin(user);
    browserWriteDb(JSON.parse(JSON.stringify(BROWSER_FALLBACK_DB)));
    return { ok: true };
  }
  if (method === "POST" && path === "/api/tickets") {
    browserRequireUser(user);
    const ticket = {
      id: browserNextId(db.tickets, "TK-"),
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
      latestDetail: body.note || "Created",
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), action: "Ticket created" }]
    };
    db.tickets.unshift(ticket);
    browserWriteDb(db);
    return ticket;
  }
  if (method === "PATCH" && /^\/api\/tickets\/[^/]+\/status$/.test(path)) {
    browserRequireUser(user);
    const ticket = db.tickets.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = body.status || ticket.status;
    ticket.latestDetail = body.detail || ticket.status;
    if (ticket.status === "Closed" && Number(body.closePrice || 0) > 0) {
      ticket.closePrice = Number(body.closePrice || 0);
      ticket.closePriceBy = body.closePriceBy || user.id;
      ticket.closePriceAt = body.closePriceAt || new Date().toISOString();
    }
    if (body.evidencePhotoUrl) {
      ticket.resolutionPhotoUrls = body.evidencePhotoUrls || [body.evidencePhotoUrl];
    }
    ticket.updatedAt = new Date().toISOString();
    browserWriteDb(db);
    return { ticket, reports: browserReports(db) };
  }
  if (method === "PATCH" && /^\/api\/tickets\/[^/]+\/assign$/.test(path)) {
    browserRequireAdmin(user);
    const ticket = db.tickets.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!ticket) throw new Error("Ticket not found");
    ticket.assignedTo = body.technicianId || "";
    ticket.status = ticket.assignedTo ? "Assigned" : "New";
    ticket.scheduledAt = body.scheduledAt || "";
    ticket.updatedAt = new Date().toISOString();
    browserWriteDb(db);
    return { ticket, reports: browserReports(db) };
  }
  if (method === "PATCH" && /^\/api\/technicians\/[^/]+\/status$/.test(path)) {
    browserRequireAdmin(user);
    const technicianId = decodeURIComponent(path.split("/")[3]);
    const tech = db.technicians.find((item) => item.id === technicianId);
    if (!tech) throw new Error("Technician not found");
    tech.status = body.status || tech.status;
    browserWriteDb(db);
    return { technician: tech, reports: browserReports(db) };
  }
  if (method === "POST" && path === "/api/maintenance-rules") {
    browserRequireAdmin(user);
    const rule = {
      id: browserNextId(db.maintenanceRules, "MR-"),
      active: true,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.maintenanceRules.unshift(rule);
    browserWriteDb(db);
    return rule;
  }
  if (method === "PATCH" && /^\/api\/maintenance-rules\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const rule = db.maintenanceRules.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!rule) throw new Error("Maintenance rule not found");
    Object.assign(rule, body, { updatedAt: new Date().toISOString() });
    browserWriteDb(db);
    return rule;
  }
  if (method === "DELETE" && /^\/api\/maintenance-rules\/[^/]+$/.test(path)) {
    browserRequireAdmin(user);
    const ruleId = decodeURIComponent(path.split("/")[3]);
    db.maintenanceRules = db.maintenanceRules.filter((item) => item.id !== ruleId);
    browserWriteDb(db);
    return { ok: true };
  }
  if (method === "POST" && /^\/api\/tickets\/[^/]+\/accept$/.test(path)) {
    browserRequireUser(user);
    const ticket = db.tickets.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = "Acknowledged";
    ticket.updatedAt = new Date().toISOString();
    browserWriteDb(db);
    return { ticket, reports: browserReports(db) };
  }
  if (method === "POST" && /^\/api\/tickets\/[^/]+\/reject$/.test(path)) {
    browserRequireUser(user);
    const ticket = db.tickets.find((item) => item.id === decodeURIComponent(path.split("/")[3]));
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = "New";
    ticket.assignedTo = "";
    ticket.latestDetail = body.reason || "Rejected";
    ticket.updatedAt = new Date().toISOString();
    browserWriteDb(db);
    return { ticket, reports: browserReports(db) };
  }
  if (method === "POST" && /^\/api\/technicians\/[^/]+\/attendance$/.test(path)) {
    browserRequireUser(user);
    const technicianId = decodeURIComponent(path.split("/")[3]);
    const tech = db.technicians.find((item) => item.id === technicianId);
    if (!tech) throw new Error("Technician not found");
    tech.status = body.status || tech.status;
    db.attendancePlans.push({ id: browserNextId(db.attendancePlans, "ATT-"), technicianId, ...body, createdAt: new Date().toISOString() });
    browserWriteDb(db);
    return { plan: db.attendancePlans.at(-1), reports: browserReports(db) };
  }

  throw new Error("This static fallback needs the Google Apps Script URL for that action.");
}

async function appsScriptApi(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    ...(currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      path,
      method,
      headers,
      body: options.body ? JSON.parse(options.body) : null
    })
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    console.error("Apps Script returned invalid JSON", {
      path,
      status: response.status,
      preview: text.slice(0, 240)
    });
    throw new Error("Live Google backend returned invalid JSON. Use ?data=browser for local redesign testing, or check the Apps Script response.");
  }
  if (!response.ok || payload.ok === false) {
    const backendError = payload.error || payload.body?.error || "Request failed";
    if (/Expected ',' or ']' after array element in JSON/i.test(String(backendError))) {
      throw new Error("Live Google backend data is corrupted in the Sheet snapshot. Local test data still works with ?data=browser.");
    }
    throw new Error(backendError);
  }
  return payload.body;
}

function bootstrapCacheKey() {
  return `${BOOTSTRAP_CACHE_KEY}:${currentUser?.id || "guest"}`;
}

function readBootstrapCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(bootstrapCacheKey()) || "null");
    if (!cached?.state) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeBootstrapCache(nextState, etag = "") {
  try {
    localStorage.setItem(bootstrapCacheKey(), JSON.stringify({
      at: Date.now(),
      etag,
      state: nextState
    }));
  } catch {
    // Ignore storage pressure; the network path still works.
  }
}

function hasOperationalData(nextState) {
  if (!nextState || typeof nextState !== "object") return false;
  return ["outlets", "categories", "assets", "technicians", "tickets", "tasks", "maintenanceRules", "assignmentTimeWindows"]
    .some((key) => Array.isArray(nextState[key]) && nextState[key].length > 0);
}

async function fetchBootstrapState({ preferCache = true } = {}) {
  const cached = readBootstrapCache();
  if (preferCache && !LOCAL_DATA_MODE && !USE_APPS_SCRIPT_API && cached?.state && Date.now() - Number(cached.at || 0) < BOOTSTRAP_CACHE_TTL_MS) {
    return cached.state;
  }
  if (USE_BROWSER_FALLBACK_API) {
    const nextState = await browserFallbackApi("/api/bootstrap", {
      method: "GET",
      headers: cached?.etag ? { "If-None-Match": cached.etag } : {}
    });
    return nextState;
  }
  if (USE_APPS_SCRIPT_API) {
    try {
      const nextState = normalizeBootstrapState(await appsScriptApi("/api/bootstrap", {
        method: "GET",
        headers: cached?.etag ? { "If-None-Match": cached.etag } : {}
      }));
      if (!hasOperationalData(nextState) && cached?.state && hasOperationalData(cached.state)) {
        showToast("Live data returned empty. Showing last synced data while the backend catches up.", "warning", 6000);
        return cached.state;
      }
      writeBootstrapCache(nextState, cached?.etag || "");
      return nextState;
    } catch (error) {
      if (cached?.state && hasOperationalData(cached.state)) {
        showToast("Live data could not refresh. Showing last synced data.", "warning", 6000);
        return cached.state;
      }
      throw error;
    }
  }
  const response = await fetch(`${API_BASE}/api/bootstrap`, {
    headers: {
      "Content-Type": "application/json",
      ...(currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}),
      ...(cached?.etag ? { "If-None-Match": cached.etag } : {})
    }
  });
  if (response.status === 304 && cached?.state) {
    writeBootstrapCache(cached.state, cached.etag || "");
    return cached.state;
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  const nextState = await response.json();
  writeBootstrapCache(nextState, response.headers.get("ETag") || "");
  return nextState;
}

async function loginWithCredentials(username, password) {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  saveUser(result.user);
  await enterApp();
}

let appLoadingStartedAt = 0;
let appLoadingHideTimer = 0;
const APP_LOADING_MIN_MS = 180;

function setAppLoading(isLoading, title = "Connecting Google data", detail = "Preparing dashboard, tickets, attendance, and reports.") {
  window.clearTimeout(appLoadingHideTimer);
  const overlay = document.querySelector("#appLoadingOverlay");
  const titleEl = document.querySelector("#appLoadingTitle");
  const detailEl = document.querySelector("#appLoadingDetail");
  if (titleEl) titleEl.textContent = title;
  if (detailEl) detailEl.textContent = detail;
  if (isLoading) {
    if (!document.body.classList.contains("is-app-loading")) {
      appLoadingStartedAt = Date.now();
    }
    document.body.classList.add("is-app-loading");
    if (overlay) overlay.setAttribute("aria-hidden", "false");
    document.querySelector("#syncStatus").textContent = title;
    return;
  }

  const elapsed = Date.now() - appLoadingStartedAt;
  const delay = Math.max(0, APP_LOADING_MIN_MS - elapsed);
  appLoadingHideTimer = window.setTimeout(() => {
    document.body.classList.remove("is-app-loading");
    if (overlay) overlay.setAttribute("aria-hidden", "true");
  }, delay);
}

async function handleLogin(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type='submit']");
  const errorBox = document.querySelector("#loginError");
  button.disabled = true;
  button.textContent = "Signing in...";
  errorBox.textContent = "";

  try {
    await loginWithCredentials(
      document.querySelector("#loginUsername").value,
      document.querySelector("#loginPassword").value
    );
  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Enter Command Center";
  }
}

function showLogin() {
  closeMobileNav();
  setAppLoading(false);
  document.body.classList.remove("has-session");
  document.body.classList.remove("single-role-workspace", "role-admin", "role-manager", "role-technician", "role-auditor");
  delete document.body.dataset.view;
  document.querySelector("#loginScreen").classList.remove("is-hidden");
  document.querySelector("#appShell").classList.add("is-hidden");
  document.querySelector("#userPill").classList.add("is-hidden");
  document.querySelector("#logoutButton").classList.add("is-hidden");
  document.querySelector("#resetData").classList.add("is-hidden");
  document.querySelector("#syncStatus").textContent = "Secure login required";
  updateLiveClock();
}

async function enterApp() {
  document.body.classList.add("has-session");
  document.querySelector("#loginScreen").classList.add("is-hidden");
  document.querySelector("#appShell").classList.add("is-hidden");
  renderAuthChrome();
  const routeView = requestedRouteView();
  const savedView = sessionStorage.getItem("ticketops-last-view");
  document.body.dataset.view = routeView && canOpenView(routeView)
    ? routeView
    : savedView && canOpenView(savedView)
      ? savedView
      : roleHomeView();
  setAppLoading(true);
  try {
    await loadState();
    document.querySelector("#appShell").classList.remove("is-hidden");
    switchView(document.body.dataset.view);
    markUserActivity();
  } catch (error) {
    document.querySelector("#appShell").classList.remove("is-hidden");
    showConnectionError(error);
  } finally {
    setAppLoading(false);
  }
}

function renderAuthChrome() {
  const roleClass = currentUser?.role ? `role-${currentUser.role}` : "";
  const singleRole = isSingleRoleWorkspace();
  document.body.classList.remove("single-role-workspace", "role-admin", "role-manager", "role-technician", "role-auditor");
  if (roleClass) document.body.classList.add(roleClass);
  document.body.classList.toggle("single-role-workspace", singleRole);

  document.querySelector("#userName").textContent = currentUser?.name || "Guest";
  document.querySelector("#userPost").textContent = currentUser?.post || "Guest";
  document.querySelector("#userPill").classList.remove("is-hidden");
  document.querySelector("#logoutButton").classList.remove("is-hidden");
  document.querySelector("#resetData").classList.toggle("is-hidden", currentUser?.role !== "admin");
  document.querySelector("#sidebarToggle")?.classList.toggle("is-hidden", !currentUser || singleRole);
  document.querySelector(".tabs")?.classList.toggle("is-hidden", singleRole);
  updateMobileNav();

  document.querySelectorAll(".tab[data-view]").forEach((button) => {
    const view = button.dataset.view;
    const copy = VIEW_COPY[view] || { icon: "•", label: view };
    button.hidden = !canUseView(view);
    button.innerHTML = `<span class="nav-icon" aria-hidden="true">${escapeHtml(copy.icon)}</span><span class="tab-label">${escapeHtml(copy.label)}</span>`;
  });
}

async function loadState() {
  if (!currentUser) return;
  setAppLoading(true, "Reading live operations", "Loading tickets, technicians, outlets, schedules, and report totals.");
  try {
    state = normalizeBootstrapState(await fetchBootstrapState());
    rebuildStateIndex();
    if (currentUser?.role === "admin" && state.stitch?.configured) {
      try {
        state.stitch = { ...state.stitch, ...(await api("/api/stitch/status")) };
      } catch {
        state.stitch = { ...state.stitch, connected: false, error: "Unable to verify Stitch right now" };
      }
    }
    if (["admin", "auditor"].includes(currentUser?.role) || canUseView("masters") || canUseView("history")) {
      await loadDirectoryUsers();
    } else {
      directoryUsers = [];
    }
    renderSelects();
    render();
    updateLiveIntel();
  } finally {
    setAppLoading(false);
  }
}

async function loadDirectoryUsers() {
  try {
    directoryUsers = (await api("/api/auth/demo-users")).users || [];
  } catch {
    directoryUsers = [];
  }
}

async function createTicket(event) {
  event.preventDefault();
  if (!canUseView("manager")) return;

  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";

  try {
    const photoUrls = await readTicketPhotos();
    const photoUrl = photoUrls[0] || "";
    const impact = document.querySelector("#ticketImpact").value;
  const category = document.querySelector("#ticketCategory").value;
  const note = document.querySelector("#ticketNote").value.trim();
  const assetValue = document.querySelector("#ticketAsset").value;
  const outlet = document.querySelector("#ticketOutlet").value;
  if (!outlet) {
    throw new Error("Add an outlet before creating a ticket.");
  }
  const photoRequired = ticketRequiresPhoto({ impact, category, note });
  if (photoRequired && !photoUrl) {
    throw new Error("Photo is required for critical, food-safety, gas, electrical, leak, or temperature issues.");
  }

    const created = await api("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        outlet,
        category,
        assetId: assetValue === "__other" ? "" : assetValue,
        unknownAsset: assetValue === "__other",
        impact,
        note,
        area: document.querySelector("#ticketArea").value,
        photoUrl,
        photoUrls
      })
    });
    document.querySelector("#ticketNote").value = "";
    document.querySelector("#ticketArea").value = "";
    document.querySelector("#ticketPhoto").value = "";
    updateTicketPhotoHint();
    updateTicketPriorityPreview();
    const suggestion = created.suggestedTechnician?.name
      ? ` Suggestion: ${created.suggestedTechnician.name}.`
      : "";
    const photos = (created.photoUrls?.length || created.photoUrl) ? ` ${created.photoUrls?.length || 1} photo(s) attached.` : "";
    showToast(`${created.id} / ${PRIORITY_LABELS[created.priority] || created.priority} created.${suggestion}${photos}`, "success", 5000);
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Ticket";
  }
}

async function createTechnicianTicket(event) {
  event.preventDefault();
  if (currentUser?.role !== "technician") return;

  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";

  try {
    const photoUrls = await readPhotosFromInput(document.querySelector("#technicianTicketPhotos"));
    const impact = document.querySelector("#technicianTicketImpact").value;
    const category = document.querySelector("#technicianTicketCategory").value;
    const note = document.querySelector("#technicianTicketNote").value.trim();
    if (ticketRequiresPhoto({ impact, category, note }) && !photoUrls.length) {
      throw new Error("Photo is required for critical, food-safety, gas, electrical, leak, or temperature issues.");
    }

    const created = await api("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        outlet: document.querySelector("#technicianTicketOutlet").value,
        category,
        impact,
        note,
        area: "Technician raised",
        assignedTo: currentUser.technicianId || "",
        photoUrl: photoUrls[0] || "",
        photoUrls
      })
    });
    document.querySelector("#technicianTicketNote").value = "";
    document.querySelector("#technicianTicketPhotos").value = "";
    showToast(`${created.id} created and assigned to you.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Ticket";
  }
}

async function setTicketStatus(ticketId, status, detail = "") {
  const payload = { status, detail };
  if (status === "Resolved" && currentUser?.role === "technician") {
    const photoUrl = await chooseEvidencePhoto();
    if (!photoUrl) {
      showToast("Completion photo is required before marking the ticket resolved.", "warning");
      return;
    }
    payload.evidencePhotoUrls = [photoUrl];
    payload.evidencePhotoUrl = photoUrl;
  }
  if (status === "Closed" && currentUser?.role === "admin") {
    const attachPhoto = await showConfirm(
      "Attach completion photo before closing? Admin can skip this image if it is not needed.",
      "Add Photo",
      "primary-button"
    );
    if (attachPhoto) {
      const photoUrl = await chooseEvidencePhoto();
      if (photoUrl) {
        payload.evidencePhotoUrls = [photoUrl];
        payload.evidencePhotoUrl = photoUrl;
      }
    }
  }
  if (status === "Closed") {
    const priceInput = await showPromptModal("Closing price (optional)", "");
    const closePrice = parseClosePrice(priceInput);
    if (closePrice > 0) {
      payload.closePrice = closePrice;
      payload.closePriceBy = currentUser?.id || "";
      payload.closePriceAt = new Date().toISOString();
    }
  }
  await api(`/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  await loadState();
}

async function editClosedTicketPrice(ticketId) {
  if (currentUser?.role !== "admin") return;
  const ticket = (state.tickets || []).find((item) => item.id === ticketId);
  if (!ticket) return;
  const priceInput = await showPromptModal("Updated closing price", Number(ticket.closePrice || 0) > 0 ? String(ticket.closePrice) : "");
  if (priceInput === null) return;
  const closePrice = parseClosePrice(priceInput);
  if (closePrice <= 0) {
    showToast("Enter a valid closing price greater than zero.", "warning");
    return;
  }
  const detail = await showPromptModal("Admin price edit note", `Admin corrected close price to ${formatClosePrice(closePrice)}`);
  if (!detail?.trim()) return;
  await api(`/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "Closed",
      detail: detail.trim(),
      closePrice,
      closePriceBy: currentUser?.id || "",
      closePriceAt: new Date().toISOString()
    })
  });
  await loadState();
  showToast(`${ticketId} close price updated.`, "success");
}

async function detailForStatus(status) {
  if (status === "Blocked") {
    return await showPromptModal("Blocked reason", "Spare part required") || "";
  }
  if (status === "Resolved") {
    return await showPromptModal("Resolution note", "Fixed permanently") || "";
  }
  if (status === "Reopened") {
    return await showPromptModal("Reopen / rejection reason", "Issue not fixed") || "";
  }
  if (status === "Closed") {
    if (currentUser?.role === "admin") {
      return await showPromptModal("Closure note", "Admin verified completion and closed the ticket") || "";
    }
    return "Manager approved resolution";
  }
  return "";
}

async function assignTicket(ticketId, technicianId) {
  if (currentUser?.role !== "admin") return;
  if (!technicianId) {
    showToast("No technician is selected. Add outlet coverage to a technician first, then assign again.", "warning");
    return;
  }

  const technician = technicianById(technicianId);
  const ticket = (state.tickets || []).find((item) => item.id === ticketId);
  const summary = technician && ticket ? technicianAssignmentSummary(technician, ticket) : null;
  const scheduledInput = document.querySelector(`[data-assign-time="${ticketId}"]`);
  const payload = { technicianId };
  if (currentUser?.role === "admin") payload.scheduledAt = scheduledInput?.value || "";
  const hardRisk = summary?.risk || [];
  if (hardRisk.includes("not registered for outlet")) {
    showToast(`${technician?.name || "This technician"} covers ${serviceAreaLabel(technician)} — not ${ticket?.outlet || "this outlet"}. Update outlet coverage in Masters > Technicians, or pick another technician.`, "warning");
    return;
  }

  if (currentUser?.role === "manager" && hardRisk.length) {
    showToast("Manager can only assign technicians who are available and serve this outlet.", "warning");
    return;
  }

  if (currentUser?.role === "admin" && hardRisk.length) {
    const overrideReason = await showPromptModal(
      `Override needed for ${technician.name}`,
      `${hardRisk.join(", ")}. Admin approved because `
    );
    if (!overrideReason?.trim()) return;
    payload.overrideReason = overrideReason.trim();
  }

  await api(`/api/tickets/${ticketId}/assign`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  await loadState();
  showToast(`${ticket?.id || "Ticket"} assigned to ${technician?.name || "technician"}.`, "success");
}

async function saveTicketSchedule(ticketId) {
  if (currentUser?.role !== "admin") return;
  const scheduledInput = document.querySelector(`[data-assign-time="${ticketId}"]`);
  await api(`/api/tickets/${ticketId}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ scheduledAt: scheduledInput?.value || "" })
  });
  await loadState();
}

async function acceptTicket(ticketId) {
  await api(`/api/tickets/${ticketId}/accept`, { method: "POST" });
  await loadState();
}

async function rejectTicket(ticketId) {
  const reason = await showPromptModal("Reject job reason", "I cannot take this job because ");
  if (!reason?.trim()) return;
  await api(`/api/tickets/${ticketId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason.trim() })
  });
  await loadState();
}

async function deleteAssignment(ticketId) {
  await api(`/api/tickets/${ticketId}/assignment`, {
    method: "DELETE"
  });
  await loadState();
}

function parseCsvAssetRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"") {
      if (quoted && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (quoted) throw new Error("CSV has an unclosed quote.");
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells, rowIndex) => ({
    rowNumber: rowIndex + 2,
    values: headers.reduce((record, header, cellIndex) => {
      record[header] = (cells[cellIndex] || "").trim();
      return record;
    }, {})
  }));
}

async function parseExcelAssetRows(file) {
  if (!window.readXlsxFile) throw new Error("Excel parser did not load. Please refresh and try again.");
  const rows = await window.readXlsxFile(file);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => String(header || "").trim());
  return rows.slice(1).filter((row) => row.some((cell) => String(cell ?? "").trim())).map((cells, rowIndex) => ({
    rowNumber: rowIndex + 2,
    values: headers.reduce((record, header, cellIndex) => {
      record[header] = String(cells[cellIndex] ?? "").trim();
      return record;
    }, {})
  }));
}

async function parseAssetBulkFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx") {
    return parseExcelAssetRows(file);
  }
  if (extension === "xls") {
    throw new Error("Legacy .xls is not supported. Please save the sheet as .xlsx or CSV.");
  }
  return parseCsvAssetRows(await file.text());
}

function normalizeAssetHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickAssetBulkValue(row, aliases) {
  const lookup = Object.entries(row).reduce((map, [key, value]) => {
    map[normalizeAssetHeader(key)] = value;
    return map;
  }, {});
  return aliases.map(normalizeAssetHeader).map((key) => lookup[key]).find((value) => value !== undefined && value !== "") || "";
}

function assetBulkPayloadFromRow(row, rowNumber) {
  const outlet = pickAssetBulkValue(row, ["Location", "Outlet", "Outlet Name"]);
  const name = pickAssetBulkValue(row, ["Item Name", "Asset Name", "Name"]);
  const category = pickAssetBulkValue(row, ["Category"]);
  const serialNo = pickAssetBulkValue(row, ["Serial No.", "Serial No", "Serial Number"]);
  if (!outlet || !name || !category) {
    throw new Error(`Row ${rowNumber}: Location, Item Name, and Category are required.`);
  }
  if (!(state.outlets || []).some((item) => item.toLowerCase() === outlet.toLowerCase())) {
    throw new Error(`Row ${rowNumber}: Location "${outlet}" is not in Outlet Master.`);
  }
  if (!(state.categories || []).some((item) => (item.name || item).toLowerCase() === category.toLowerCase())) {
    throw new Error(`Row ${rowNumber}: Category "${category}" is not in Category Master.`);
  }
  return {
    outlet,
    name,
    category,
    code: pickAssetBulkValue(row, ["Asset Code", "Code"]) || serialNo,
    subCategory: pickAssetBulkValue(row, ["Sub Category", "SubCategory"]),
    make: pickAssetBulkValue(row, ["Make"]),
    model: pickAssetBulkValue(row, ["Model"]),
    serialNo,
    power: pickAssetBulkValue(row, ["Power"]),
    phase: pickAssetBulkValue(row, ["phase", "Phase"]),
    dimension: pickAssetBulkValue(row, ["Diamantion", "Dimension", "Dimensions"]),
    volume: pickAssetBulkValue(row, ["Volume"]),
    amc: pickAssetBulkValue(row, ["AMC"]),
    warranty: pickAssetBulkValue(row, ["Warrenty", "Warranty"]),
    purchaseDate: pickAssetBulkValue(row, ["Purchase Date"]),
    purchasePrice: pickAssetBulkValue(row, ["Purchase Price"]),
    vendor: pickAssetBulkValue(row, ["Vendor"]),
    remarks: pickAssetBulkValue(row, ["Remarks"]),
    status: "Active"
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function downloadAssetBulkTemplate() {
  const sample = [
    ASSET_BULK_COLUMNS,
    ["Aiko Ambli", "Walk-in Freezer", "AC", "Freezer", "Blue Star", "BS-500", "SN-001", "2 kW", "3", "1200x900x2100 mm", "500 L", "Yes", "2027-03-31", "2025-04-01", "85000", "ABC Cooling", "Kitchen cold storage"]
  ];
  const blob = new Blob([sample.map((row) => row.map(csvEscape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ticketops-asset-bulk-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function setAssetBulkStatus(message, tone = "idle") {
  const status = document.querySelector("#assetBulkStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

async function importAssetBulkFile(event) {
  const fileInput = event.currentTarget;
  const file = fileInput.files?.[0];
  if (!file) return;
  const uploadButton = document.querySelector("#assetBulkUploadButton");
  uploadButton.disabled = true;
  uploadButton.textContent = "Uploading...";
  try {
    const rows = await parseAssetBulkFile(file);
    if (!rows.length) throw new Error("The upload file has no asset rows.");
    const errors = [];
    let imported = 0;
    for (const row of rows) {
      try {
        const payload = assetBulkPayloadFromRow(row.values, row.rowNumber);
        await api("/api/assets", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        imported += 1;
        setAssetBulkStatus(`Imported ${imported}/${rows.length} assets...`, "busy");
      } catch (error) {
        errors.push(error.message);
      }
    }
    await loadState();
    if (errors.length) {
      setAssetBulkStatus(`${imported} imported. ${errors.length} skipped: ${errors.slice(0, 3).join(" ")}`, "warning");
      showToast(`${imported} assets imported, ${errors.length} skipped.`, "warning");
    } else {
      setAssetBulkStatus(`${imported} assets imported successfully.`, "success");
      showToast(`${imported} assets imported successfully.`, "success");
    }
  } catch (error) {
    setAssetBulkStatus(error.message, "error");
    showToast(error.message, "error");
  } finally {
    fileInput.value = "";
    uploadButton.disabled = false;
    uploadButton.textContent = "Bulk Upload";
  }
}

async function saveAssetMaster(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;

  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = editingAssetId ? "Updating..." : "Adding...";

  try {
    const asset = await api(editingAssetId ? `/api/assets/${editingAssetId}` : "/api/assets", {
      method: editingAssetId ? "PATCH" : "POST",
      body: JSON.stringify({
        outlet: document.querySelector("#assetOutlet").value,
        category: document.querySelector("#assetCategory").value,
        name: document.querySelector("#assetName").value,
        code: document.querySelector("#assetCode").value,
        status: document.querySelector("#assetStatus")?.value || "Active"
      })
    });
    const wasEditing = Boolean(editingAssetId);
    resetAssetForm();
    showToast(`${asset.id} ${wasEditing ? "updated" : "added"} for ${asset.outlet}.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingAssetId ? "Update Asset" : "Add Asset";
  }
}

function resetAssetForm() {
  editingAssetId = "";
  document.querySelector("#assetForm")?.reset();
  document.querySelector("#assetSubmit").textContent = "Add Asset";
}

function fillAssetForm(assetId) {
  const asset = (state.assets || []).find((item) => item.id === assetId);
  if (!asset) return;
  editingAssetId = asset.id;
  document.querySelector("#assetOutlet").value = asset.outlet || "";
  document.querySelector("#assetCategory").value = asset.category || "";
  document.querySelector("#assetName").value = asset.name || "";
  document.querySelector("#assetCode").value = asset.code || "";
  document.querySelector("#assetSubmit").textContent = "Update Asset";
}

async function createOutlet(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = editingOutletName ? "Updating..." : "Adding...";
  try {
    const payload = {
      name: document.querySelector("#outletName").value,
      address: document.querySelector("#outletAddress").value,
      latitude: "",
      longitude: ""
    };
    const outlet = await api(editingOutletName ? `/api/outlets/${encodeURIComponent(editingOutletName)}` : "/api/outlets", {
      method: editingOutletName ? "PATCH" : "POST",
      body: JSON.stringify(payload)
    });
    const wasEditing = Boolean(editingOutletName);
    resetOutletForm();
    showToast(`${outlet.name} outlet ${wasEditing ? "updated" : "added"}${outlet.address ? ` at ${outlet.address}` : ""}.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingOutletName ? "Update Outlet" : "Add Outlet";
  }
}

function resetOutletForm() {
  editingOutletName = "";
  document.querySelector("#outletName").value = "";
  document.querySelector("#outletName").disabled = false;
  document.querySelector("#outletAddress").value = "";
  document.querySelector("#outletSubmit").textContent = "Add Outlet";
}

function fillOutletForm(outletName) {
  const location = state.outletLocations?.[outletName] || {};
  editingOutletName = outletName;
  document.querySelector("#outletName").value = outletName;
  document.querySelector("#outletName").disabled = false;
  document.querySelector("#outletAddress").value = location.address || "";
  document.querySelector("#outletSubmit").textContent = "Update Outlet";
}

async function createCategory(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = editingCategoryId ? "Updating..." : "Adding...";
  try {
    const category = await api(editingCategoryId ? `/api/categories/${editingCategoryId}` : "/api/categories", {
      method: editingCategoryId ? "PATCH" : "POST",
      body: JSON.stringify({
        name: document.querySelector("#categoryName").value,
        description: document.querySelector("#categoryDescription").value.trim()
      })
    });
    const wasEditing = Boolean(editingCategoryId);
    resetCategoryForm();
    showToast(`${category.name} category ${wasEditing ? "updated" : "added"}.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingCategoryId ? "Update Category" : "Add Category";
  }
}

function resetCategoryForm() {
  editingCategoryId = "";
  document.querySelector("#categoryName").value = "";
  document.querySelector("#categoryDescription").value = "";
  document.querySelector("#categorySubmit").textContent = "Add Category";
}

function fillCategoryForm(categoryId) {
  const category = (state.categories || []).find((item) => item.id === categoryId);
  if (!category) return;
  editingCategoryId = category.id;
  document.querySelector("#categoryName").value = category.name || "";
  document.querySelector("#categoryDescription").value = category.description || "";
  document.querySelector("#categorySubmit").textContent = "Update Category";
}

async function saveTechnicianMaster(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = editingTechnicianId ? "Updating..." : "Adding...";
  try {
    const serviceOutlets = selectedOptionValues(document.querySelector("#technicianOutlet"));
    const skills = selectedSkillValues(document.querySelector("#technicianSkill"));
    const technician = await api(editingTechnicianId ? `/api/technicians/${editingTechnicianId}` : "/api/technicians", {
      method: editingTechnicianId ? "PATCH" : "POST",
      body: JSON.stringify({
        name: document.querySelector("#technicianName").value,
        skill: skills.join(", "),
        skills,
        outlet: serviceOutlets[0] || "",
        serviceOutlets
      })
    });
    const wasEditing = Boolean(editingTechnicianId);
    resetTechnicianForm();
    showToast(technician.login
      ? `${technician.name} added. Login: ${technician.login.username} / ${technician.temporaryPassword}`
      : `${technician.name} technician ${wasEditing ? "updated" : "added"}.`, "success", 5500);
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingTechnicianId ? "Update Technician" : "Add Technician";
  }
}

function resetTechnicianForm() {
  editingTechnicianId = "";
  document.querySelector("#technicianForm")?.reset();
  [...(document.querySelector("#technicianOutlet")?.options || [])].forEach((option) => { option.selected = false; });
  setSelectedValues(document.querySelector("#technicianSkill"), []);
  renderMasterSelectionPanels();
  document.querySelector("#technicianSubmit").textContent = "Add Technician";
}

function fillTechnicianForm(technicianId) {
  const tech = state.technicians.find((item) => item.id === technicianId);
  if (!tech) return;
  editingTechnicianId = tech.id;
  document.querySelector("#technicianName").value = tech.name || "";
  setSelectedValues(document.querySelector("#technicianSkill"), skillValuesFromText(tech.skill));
  [...(document.querySelector("#technicianOutlet")?.options || [])].forEach((option) => {
    option.selected = (tech.serviceOutlets || []).includes(option.value);
  });
  renderMasterSelectionPanels();
  document.querySelector("#technicianSubmit").textContent = "Update Technician";
}

function resetUserAccessForm() {
  editingUserAccessId = "";
  document.querySelector("#userAccessForm")?.reset();
  document.querySelector("#accessUsername").disabled = false;
  document.querySelector("#accessPassword").required = true;
  document.querySelector("#userAccessSubmit").textContent = "Add User";
  [...(document.querySelector("#accessOutlets")?.options || [])].forEach((option) => { option.selected = false; });
  setSelectedValues(document.querySelector("#accessSkill"), []);
  renderMasterSelectionPanels();
}

function fillUserAccessForm(userId) {
  const user = directoryUsers.find((item) => item.id === userId);
  if (!user) return;
  editingUserAccessId = user.id;
  document.querySelector("#accessRole").value = user.role || "manager";
  document.querySelector("#accessName").value = user.name || "";
  document.querySelector("#accessUsername").value = user.username || "";
  document.querySelector("#accessUsername").disabled = true;
  document.querySelector("#accessPassword").value = "";
  document.querySelector("#accessPassword").required = false;
  document.querySelector("#accessPost").value = user.post || "";
  document.querySelector("#accessAllOutlets").checked = Boolean(user.accessAllOutlets);
  document.querySelector("#accessAddress").value = user.address || "";
  const tech = state.technicians.find((item) => item.id === user.technicianId);
  if (tech && document.querySelector("#accessSkill")) setSelectedValues(document.querySelector("#accessSkill"), skillValuesFromText(tech.skill));
  const outlets = Array.isArray(user.allowedOutlets) && user.allowedOutlets.length ? user.allowedOutlets : user.outlet ? [user.outlet] : [];
  [...(document.querySelector("#accessOutlets")?.options || [])].forEach((option) => {
    option.selected = outlets.includes(option.value);
  });
  renderMasterSelectionPanels();
  document.querySelector("#userAccessSubmit").textContent = "Update User";
}

async function saveUserAccess(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    const role = document.querySelector("#accessRole").value;
    const accessAllOutlets = document.querySelector("#accessAllOutlets").checked || role === "admin";
    const skills = role === "technician" ? selectedSkillValues(document.querySelector("#accessSkill")) : [];
    const payload = {
      role,
      name: document.querySelector("#accessName").value,
      username: document.querySelector("#accessUsername").value,
      password: document.querySelector("#accessPassword").value,
      post: document.querySelector("#accessPost").value,
      skill: skills.join(", "),
      skills,
      accessAllOutlets,
      allowedOutlets: accessAllOutlets ? [] : selectedOptionValues(document.querySelector("#accessOutlets")),
      address: document.querySelector("#accessAddress").value,
      latitude: "",
      longitude: ""
    };
    const path = editingUserAccessId ? `/api/admin/users/${editingUserAccessId}` : "/api/admin/users";
    const method = editingUserAccessId ? "PATCH" : "POST";
    await api(path, { method, body: JSON.stringify(payload) });
    showToast(editingUserAccessId ? "User access updated." : "User created.", "success");
    resetUserAccessForm();
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteMasterRecord(type, id, label) {
  if (!canUseView("masters")) return;
  if (!await showConfirm(`Delete ${label}?`)) return;
  try {
    await api(`/api/${type}/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast(`${label} deleted.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function switchMasterTab(tabName) {
  activeMasterTab = tabName || "outlets";
  document.querySelectorAll("[data-master-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.masterTab === activeMasterTab);
  });
  document.querySelectorAll("[data-master-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.masterPanel === activeMasterTab);
  });
}

function masterSearchTerm(tabName) {
  return String(masterSearchTerms[tabName] || "").trim().toLowerCase();
}

function masterMatchesSearch(values, tabName) {
  const term = masterSearchTerm(tabName);
  if (!term) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(term));
}

function ensureMasterSearchControls() {
  document.querySelectorAll("[data-master-panel]").forEach((panel) => {
    const panelName = panel.dataset.masterPanel;
    const heading = panel.querySelector(".master-section-heading");
    if (!heading || heading.querySelector("[data-master-search]")) return;
    const tool = document.createElement("label");
    tool.className = "master-search-control";
    tool.innerHTML = `
      <span>Search</span>
      <input data-master-search="${panelName}" placeholder="Filter ${panelName}" autocomplete="off">
    `;
    heading.appendChild(tool);
  });
  document.querySelectorAll("[data-master-search]").forEach((input) => {
    input.value = masterSearchTerms[input.dataset.masterSearch] || "";
  });
}

async function createMaintenanceRule(event) {
  event.preventDefault();
  if (!canUseView("scheduler")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const isEditing = Boolean(editingMaintenanceRuleId);
  submitButton.disabled = true;
  submitButton.textContent = isEditing ? "Updating..." : "Adding...";
  try {
    const rule = await api(isEditing ? `/api/maintenance-rules/${editingMaintenanceRuleId}` : "/api/maintenance-rules", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify({
        outlet: document.querySelector("#ruleOutlet").value,
        category: document.querySelector("#ruleCategory").value,
        title: document.querySelector("#ruleTitle").value,
        startTime: document.querySelector("#ruleStartTime").value,
        endTime: document.querySelector("#ruleEndTime").value,
        frequency: document.querySelector("#ruleFrequency").value,
        recurrenceDayOfWeek: Number(document.querySelector("#ruleDayOfWeek").value),
        recurrenceDayOfMonth: Number(document.querySelector("#ruleDayOfMonth").value),
        recurrenceMonths: selectedNumericValues("#ruleMonths"),
        reminderDays: Number(document.querySelector("#ruleReminderDays").value || 0),
        assignedTechnicianId: document.querySelector("#ruleTechnician").value,
        assignments: editingMaintenanceAssignments.length
          ? editingMaintenanceAssignments
          : [{ outlet: document.querySelector("#ruleOutlet").value, assignedTechnicianId: document.querySelector("#ruleTechnician").value }],
        allowOutsideWindow: document.querySelector("#ruleAllowOutsideWindow").checked
      })
    });
    resetMaintenanceRuleForm();
    showToast(`${rule.frequency} rule ${isEditing ? "updated" : "added"} for ${rule.category}.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = isEditing ? "Update Rule" : "Add Rule";
  }
}

function resetMaintenanceRuleForm() {
  editingMaintenanceRuleId = "";
  document.querySelector("#maintenanceRuleForm")?.reset();
  document.querySelector("#ruleStartTime").value = "09:00";
  document.querySelector("#ruleEndTime").value = "18:00";
  document.querySelector("#ruleDayOfWeek").value = "1";
  document.querySelector("#ruleDayOfMonth").value = "1";
  document.querySelector("#ruleReminderDays").value = "0";
  [...document.querySelector("#ruleMonths").options].forEach((option) => {
    option.selected = ["0", "3", "6", "9"].includes(option.value);
  });
  document.querySelector("#ruleSubmit").textContent = "Add Rule";
  editingMaintenanceAssignments = [];
  renderRuleAssignmentsBoard();
  updateRuleTimeDisabled();
  updateRuleRecurrenceFields();
}

function updateRuleTimeDisabled() {
  const allDay = document.querySelector("#ruleAllowOutsideWindow")?.checked;
  const from = document.querySelector("#ruleStartTime");
  const to = document.querySelector("#ruleEndTime");
  if (from) from.disabled = allDay;
  if (to) to.disabled = allDay;
}

function updateRuleRecurrenceFields() {
  const frequency = document.querySelector("#ruleFrequency")?.value || "daily";
  document.querySelector(".rule-weekly-field")?.classList.toggle("is-hidden", frequency !== "weekly");
  document.querySelector(".rule-date-field")?.classList.toggle("is-hidden", !["monthly", "quarterly", "half-yearly", "yearly"].includes(frequency));
  document.querySelector(".rule-month-field")?.classList.toggle("is-hidden", !["quarterly", "half-yearly", "yearly"].includes(frequency));
  const monthSelect = document.querySelector("#ruleMonths");
  if (!monthSelect) return;
  const defaults = {
    quarterly: ["0", "3", "6", "9"],
    "half-yearly": ["0", "6"],
    yearly: ["0"]
  }[frequency] || [];
  if (defaults.length && ![...monthSelect.selectedOptions].length) {
    [...monthSelect.options].forEach((option) => {
      option.selected = defaults.includes(option.value);
    });
  }
}

function assignmentListForRule(rule = {}) {
  if (Array.isArray(rule.assignments) && rule.assignments.length) return rule.assignments;
  if (rule.outlet) {
    return [{ outlet: rule.outlet, assignedTechnicianId: rule.assignedTechnicianId || "", active: true }];
  }
  return [];
}

function renderRuleAssignmentsBoard() {
  const board = document.querySelector("#ruleAssignmentsBoard");
  if (!board) return;
  board.innerHTML = editingMaintenanceAssignments.length
    ? editingMaintenanceAssignments.map((assignment, index) => {
      const tech = technicianById(assignment.assignedTechnicianId);
      return `
        <div class="assignment-chip">
          <span>${escapeHtml(assignment.outlet)} / ${escapeHtml(tech?.name || "Balanced")}</span>
          <button type="button" class="small-button danger" data-remove-rule-assignment="${index}">Remove</button>
        </div>
      `;
    }).join("")
    : `<div class="empty mini">No outlet assignments added.</div>`;
}

function syncCurrentRuleAssignment() {
  const outlet = document.querySelector("#ruleOutlet")?.value || "";
  const assignedTechnicianId = document.querySelector("#ruleTechnician")?.value || "";
  if (!outlet) return;
  const existing = editingMaintenanceAssignments.find((item) => item.outlet === outlet);
  if (existing) {
    existing.assignedTechnicianId = assignedTechnicianId;
  } else {
    editingMaintenanceAssignments.push({ outlet, assignedTechnicianId, active: true });
  }
  renderRuleAssignmentsBoard();
}

function populateRuleTechnicians(outlet, keepValue) {
  const el = document.querySelector("#ruleTechnician");
  if (!el) return;
  const techs = outlet
    ? (state.technicians || []).filter((t) => (t.serviceOutlets || []).includes(outlet))
    : (state.technicians || []);
  el.innerHTML = [
    `<option value="">Balanced / auto assign</option>`,
    ...techs.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`)
  ].join("");
  if (keepValue && techs.some((t) => t.id === keepValue)) el.value = keepValue;
}

function fillMaintenanceRuleForm(ruleId) {
  const rule = (state.maintenanceRules || []).find((item) => item.id === ruleId);
  if (!rule) return;
  editingMaintenanceRuleId = rule.id;
  document.querySelector("#ruleOutlet").value = rule.outlet || "";
  document.querySelector("#ruleCategory").value = rule.category || "";
  document.querySelector("#ruleTitle").value = rule.title || "";
  document.querySelector("#ruleStartTime").value = rule.startTime || "09:00";
  document.querySelector("#ruleEndTime").value = rule.endTime || "18:00";
  document.querySelector("#ruleFrequency").value = rule.frequency || "daily";
  document.querySelector("#ruleDayOfWeek").value = String(rule.recurrenceDayOfWeek ?? 1);
  document.querySelector("#ruleDayOfMonth").value = String(rule.recurrenceDayOfMonth || 1);
  document.querySelector("#ruleReminderDays").value = String(rule.reminderDays || 0);
  [...document.querySelector("#ruleMonths").options].forEach((option) => {
    option.selected = (rule.recurrenceMonths || []).map(String).includes(option.value);
  });
  document.querySelector("#ruleAllowOutsideWindow").checked = Boolean(rule.allowOutsideWindow);
  document.querySelector("#ruleSubmit").textContent = "Update Rule";
  editingMaintenanceAssignments = assignmentListForRule(rule).map((assignment) => ({
    outlet: assignment.outlet,
    assignedTechnicianId: assignment.assignedTechnicianId || "",
    active: assignment.active !== false
  }));
  populateRuleTechnicians(rule.outlet || "", rule.assignedTechnicianId || "");
  updateRuleTimeDisabled();
  updateRuleRecurrenceFields();
  renderRuleAssignmentsBoard();
  document.querySelector("#maintenanceRuleForm")?.scrollIntoView({ block: "start", behavior: "smooth" });
  showToast(`Editing ${rule.title}.`, "info");
}

async function toggleMaintenanceRule(ruleId, active) {
  if (!canUseView("scheduler")) return;

  await api(`/api/maintenance-rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify({ active })
  });
  await loadState();
  showToast(`Rule ${active ? "enabled" : "paused"}.`, "success");
}

async function deleteMaintenanceRule(ruleId, title) {
  if (!canUseView("scheduler")) return;
  if (!confirm(`Delete rule "${title}"? This cannot be undone.`)) return;
  await api(`/api/maintenance-rules/${ruleId}`, { method: "DELETE" });
  await loadState();
  showToast(`Deleted ${title}.`, "success");
}

async function updateTechnicianStatus(technicianId, status) {
  if (!canUseView("admin")) return;

  await api(`/api/technicians/${technicianId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  await loadState();
}

async function createAttendancePlan(technicianId, payload) {
  const isOwnTechnician = currentUser?.role === "technician" && currentUser.technicianId === technicianId;
  if (!canUseView("admin") && !isOwnTechnician) return;

  await api(`/api/technicians/${technicianId}/attendance`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  await loadState();
}

async function collectTaskEvidence(task) {
  const comment = await showPromptModal(
    taskRequiresEvidence(task) ? "Safety evidence note (photo required)" : "Completion note (photo required)",
    taskRequiresEvidence(task) ? "Checked and verified on site" : "Completed on site"
  );
  if (comment === null) return null;

  const photoUrl = await chooseEvidencePhoto();

  if (!photoUrl) {
    showToast("Photo evidence is required to complete this task.", "warning");
    return null;
  }

  return { comment, photoUrl };
}

async function updateTaskStatus(taskId, status = "Done", evidence = {}) {
  const normalizedStatus = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  await api(`/api/technician/tasks/${taskId}/status`, {
    method: "POST",
    body: JSON.stringify({ status: normalizedStatus, ...evidence })
  });
  await loadState();
}

async function deleteTask(taskId) {
  if (currentUser?.role !== "admin") return;
  if (!await showConfirm("Delete this task?")) return;
  await api(`/api/tasks/${taskId}`, { method: "DELETE" });
  await loadState();
}

async function downloadReport(type) {
  if (LOCAL_DATA_MODE) {
    const exportFile = await browserFallbackApi(`/api/reports/export/${type}`, {
      method: "GET",
      headers: currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}
    });
    downloadBlob(new Blob([exportFile.csv || ""], { type: "text/csv;charset=utf-8" }), exportFile.filename || `ticketops-${type}.csv`);
    return;
  }
  if (USE_APPS_SCRIPT_API) {
    const exportFile = await appsScriptApi(`/api/reports/export/${type}`, { method: "GET" });
    downloadBlob(new Blob([exportFile.csv || ""], { type: "text/csv;charset=utf-8" }), exportFile.filename || `ticketops-${type}.csv`);
    return;
  }
  const response = await fetch(`${API_BASE}/api/reports/export/${type}`, {
    headers: currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Export failed" }));
    throw new Error(error.error || "Export failed");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || `ticketops-${type}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadMonthlyBackup() {
  const month = document.querySelector("#backupMonth")?.value || todayInputValue().slice(0, 7);
  if (LOCAL_DATA_MODE) {
    const backup = await browserFallbackApi(`/api/backups/monthly/${encodeURIComponent(month)}`, {
      method: "GET",
      headers: currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}
    });
    downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" }), `ticketops-backup-${month}.json`);
    return;
  }
  if (USE_APPS_SCRIPT_API) {
    const backup = await appsScriptApi(`/api/backups/monthly/${encodeURIComponent(month)}`, { method: "GET" });
    downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" }), `ticketops-backup-${month}.json`);
    return;
  }
  const response = await fetch(`${API_BASE}/api/backups/monthly/${encodeURIComponent(month)}`, {
    headers: currentUser ? { "X-TicketOps-User": currentUser.id, "X-TicketOps-Role": currentUser.role } : {}
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Backup failed" }));
    throw new Error(error.error || "Backup failed");
  }
  const blob = await response.blob();
  downloadBlob(blob, `ticketops-backup-${month}.json`);
}

async function renderBackupReportFromFile(file) {
  const text = await file.text();
  const backup = JSON.parse(text);
  const report = await api("/api/backups/report", {
    method: "POST",
    body: JSON.stringify(backup)
  });
  const target = document.querySelector("#backupReportBoard");
  if (!target) return;
  target.innerHTML = `
    <section class="report-table wide">
      <div class="mini-heading">
        <span class="section-kicker">Archive ${escapeHtml(report.month || backup.month || "")}</span>
        <strong>${escapeHtml(report.totals?.taskCompletionRate ?? 0)}% task completion</strong>
      </div>
      <div class="report-card-grid">
        ${[
          ["Tickets", report.totals?.tickets || 0],
          ["Open", report.totals?.openTickets || 0],
          ["Closed", report.totals?.closedTickets || 0],
          ["Tasks", report.totals?.tasks || 0],
          ["Done Tasks", report.totals?.completedTasks || 0]
        ].map(([label, value]) => `<article class="report-card"><div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div></article>`).join("")}
      </div>
      <div class="report-row-list">
        ${(report.byOutlet || []).map((row) => `
          <article class="report-row">
            <strong>${escapeHtml(row.outlet)}</strong>
            <span>${escapeHtml(row.tickets)} tickets</span>
            <span>${escapeHtml(row.closed)} closed</span>
            <span>${escapeHtml(row.tasks)} tasks</span>
            <span>${escapeHtml(row.doneTasks)} done</span>
          </article>
        `).join("") || `<div class="empty mini">No archive rows in this backup.</div>`}
      </div>
    </section>
  `;
}

function technicianById(id) {
  return stateIndex.techniciansById.get(id);
}

function updateTicketPriorityPreview() {
  const preview = document.querySelector("#ticketPriorityPreview");
  if (!preview) return;
  const impact = document.querySelector("#ticketImpact")?.value || "";
  const category = document.querySelector("#ticketCategory")?.value || "";
  const note = document.querySelector("#ticketNote")?.value || "";
  const priority = priorityForImpact(impact);
  const needsPhoto = ticketRequiresPhoto({ impact, category, note });
  preview.className = `ticket-priority-preview priority-${token(priority)}${needsPhoto ? " needs-photo" : ""}`;
  preview.innerHTML = `
    <span>${escapeHtml(PRIORITY_LABELS[priority] || priority)}</span>
    <strong>${needsPhoto ? "Photo required" : "Photo optional"}</strong>
  `;
}

function renderSelects() {
  const outletSelect = document.querySelector("#ticketOutlet");
  const ticketAsset = document.querySelector("#ticketAsset");
  const assetOutlet = document.querySelector("#assetOutlet");
  const assetCategory = document.querySelector("#assetCategory");
  const technicianSkill = document.querySelector("#technicianSkill");
  const technicianOutlet = document.querySelector("#technicianOutlet");
  const accessSkill = document.querySelector("#accessSkill");
  const accessOutlets = document.querySelector("#accessOutlets");
  const ticketCategory = document.querySelector("#ticketCategory");
  const ruleOutlet = document.querySelector("#ruleOutlet");
  const ruleCategory = document.querySelector("#ruleCategory");
  const ruleTechnician = document.querySelector("#ruleTechnician");
  const activeTechnician = document.querySelector("#activeTechnician");
  const activeTechnicianControl = document.querySelector("#activeTechnicianControl");

  const selectedTechnician = activeTechnician?.value;
  const selectedTicketOutlet = outletSelect?.value;
  const selectedTicketAsset = ticketAsset?.value;
  const selectedAssetOutlet = assetOutlet?.value;
  const selectedAssetCategory = assetCategory?.value;
  const selectedTechnicianSkills = selectedSkillValues(technicianSkill);
  const selectedTechnicianOutlet = technicianOutlet?.value;
  const selectedTechnicianOutlets = selectedOptionValues(technicianOutlet);
  const selectedAccessSkills = selectedSkillValues(accessSkill);
  const selectedAccessOutlets = selectedOptionValues(accessOutlets);
  const selectedTicketCategory = ticketCategory?.value;
  const selectedRuleOutlet = ruleOutlet?.value;
  const selectedRuleTechnician = ruleTechnician?.value;

  const categories = state.categories?.length
    ? state.categories
    : ["AC", "Refrigeration", "Electrical", "Plumbing", "Kitchen Equipment", "Gas", "POS / IT", "Civil"].map((name) => ({ name }));

  const managerOutlets = currentUser?.role === "manager" ? outletAccessForUser(currentUser) : state.outlets;
  const ticketOutlets = managerOutlets.length ? managerOutlets : state.outlets;

  if (outletSelect) {
    outletSelect.innerHTML = ticketOutlets.length
      ? ticketOutlets.map((outlet) => `<option value="${escapeHtml(outlet)}">${escapeHtml(outlet)}</option>`).join("")
      : `<option value="">No outlets available</option>`;
    outletSelect.disabled = !ticketOutlets.length;
  }

  const ticketSubmit = document.querySelector("#ticketForm button[type='submit']");
  if (ticketSubmit) {
    ticketSubmit.disabled = !ticketOutlets.length;
    ticketSubmit.textContent = ticketOutlets.length ? "Create Ticket" : "Add outlet first";
  }

  function renderTicketAssets() {
    if (!ticketAsset) return;
    const outlet = (outletSelect ? outletSelect.value : null) || currentUser?.outlet || state.outlets[0];
    const assets = (state.assets || []).filter((asset) => asset.outlet === outlet);
    ticketAsset.innerHTML = [
      `<option value="">General outlet issue</option>`,
      `<option value="__other">Other / unknown asset</option>`,
      ...assets.map((asset) => `<option value="${escapeHtml(asset.id)}">${escapeHtml(asset.name)} / ${escapeHtml(asset.code || asset.category)}</option>`)
    ].join("");
    if (selectedTicketAsset === "__other" || (selectedTicketAsset && assets.some((asset) => asset.id === selectedTicketAsset))) {
      ticketAsset.value = selectedTicketAsset;
    }
  }

  function syncTicketCategoryToAsset() {
    const asset = (state.assets || []).find((item) => item.id === ticketAsset?.value);
    if (asset && ticketCategory) {
      ticketCategory.value = asset.category;
    }
  }

  if (assetOutlet) {
    assetOutlet.innerHTML = state.outlets
      .map((outlet) => `<option value="${escapeHtml(outlet)}">${escapeHtml(outlet)}</option>`)
      .join("");
    if (selectedAssetOutlet && state.outlets.includes(selectedAssetOutlet)) {
      assetOutlet.value = selectedAssetOutlet;
    }
  }

  if (technicianOutlet) {
    technicianOutlet.innerHTML = state.outlets
      .map((outlet) => `<option value="${escapeHtml(outlet)}">${escapeHtml(outlet)}</option>`)
      .join("");
    if (selectedTechnicianOutlets.length) {
      selectedTechnicianOutlets.forEach((outlet) => {
        const option = [...technicianOutlet.options].find((item) => item.value === outlet);
        if (option) option.selected = true;
      });
    } else if (selectedTechnicianOutlet && state.outlets.includes(selectedTechnicianOutlet)) {
      const option = [...technicianOutlet.options].find((item) => item.value === selectedTechnicianOutlet);
      if (option) option.selected = true;
    }
  }

  if (accessOutlets) {
    accessOutlets.innerHTML = state.outlets
      .map((outlet) => `<option value="${escapeHtml(outlet)}">${escapeHtml(outlet)}</option>`)
      .join("");
    selectedAccessOutlets.forEach((outlet) => {
      const option = [...accessOutlets.options].find((item) => item.value === outlet);
      if (option) option.selected = true;
    });
  }

  if (assetCategory) {
    assetCategory.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    if (selectedAssetCategory && categories.some((category) => category.name === selectedAssetCategory)) {
      assetCategory.value = selectedAssetCategory;
    }
  }

  if (technicianSkill) {
    technicianSkill.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    setSelectedValues(technicianSkill, selectedTechnicianSkills.filter((skill) => categories.some((category) => category.name === skill)));
  }

  if (accessSkill) {
    accessSkill.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    setSelectedValues(accessSkill, selectedAccessSkills.filter((skill) => categories.some((category) => category.name === skill)));
  }

  if (ticketCategory) {
    ticketCategory.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    if (selectedTicketCategory && categories.some((category) => category.name === selectedTicketCategory)) {
      ticketCategory.value = selectedTicketCategory;
    }
  }

  if (ruleOutlet) {
    ruleOutlet.innerHTML = (state.outlets || [])
      .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
      .join("");
    if (selectedRuleOutlet && (state.outlets || []).includes(selectedRuleOutlet)) {
      ruleOutlet.value = selectedRuleOutlet;
    }
  }

  if (ruleCategory) {
    const selectedRuleCategory = ruleCategory.value;
    ruleCategory.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    if (selectedRuleCategory && categories.some((category) => category.name === selectedRuleCategory)) {
      ruleCategory.value = selectedRuleCategory;
    }
  }

  if (ruleTechnician) {
    populateRuleTechnicians(selectedRuleOutlet, selectedRuleTechnician);
  }

  if (activeTechnician) {
    const technicianOptions = (state.technicians || []).map((tech) => `<option value="${escapeHtml(tech.id)}">${escapeHtml(tech.name)}</option>`);
    activeTechnician.innerHTML = technicianOptions.join("");
    if (selectedTechnician && (state.technicians || []).some((t) => t.id === selectedTechnician)) {
      activeTechnician.value = selectedTechnician;
    }
    if (activeTechnicianControl) {
      activeTechnicianControl.style.display = currentUser?.role === "technician" ? "none" : "flex";
    }
  }

  if (currentUser?.role === "manager" && outletSelect) {
    if (ticketOutlets.includes(selectedTicketOutlet)) outletSelect.value = selectedTicketOutlet;
    if (currentUser.outlet && ticketOutlets.includes(currentUser.outlet)) outletSelect.value = currentUser.outlet;
    outletSelect.disabled = ticketOutlets.length <= 1;
    const scope = document.querySelector("#managerScope");
    if (scope) scope.textContent = `${userOutletLabel(currentUser)} auto dispatch`;
  } else if (outletSelect) {
    outletSelect.disabled = !ticketOutlets.length;
    const scope = document.querySelector("#managerScope");
    if (scope) scope.textContent = ticketOutlets.length ? "Coverage + time auto dispatch" : "Add outlet first";
  }

  renderTicketAssets();
  syncTicketCategoryToAsset();
  updateTicketPriorityPreview();

  if (outletSelect) {
    outletSelect.onchange = () => {
      renderTicketAssets();
      syncTicketCategoryToAsset();
      updateTicketPriorityPreview();
    };
  }

  if (ticketAsset) {
    ticketAsset.onchange = () => {
      syncTicketCategoryToAsset();
      updateTicketPriorityPreview();
    };
  }

  if (activeTechnician) {
    activeTechnician.innerHTML = state.technicians
      .map((tech) => `<option value="${escapeHtml(tech.id)}">${escapeHtml(tech.name)}</option>`)
      .join("");

    if (currentUser?.technicianId) {
      activeTechnician.value = currentUser.technicianId;
      activeTechnician.disabled = true;
      if (activeTechnicianControl) activeTechnicianControl.hidden = true;
    } else {
      activeTechnician.disabled = false;
      if (activeTechnicianControl) activeTechnicianControl.hidden = false;
      if (selectedTechnician && state.technicians.some((tech) => tech.id === selectedTechnician)) {
        activeTechnician.value = selectedTechnician;
      }
    }
  }

  renderMasterSelectionPanels();
}

function renderActionButtons(ticket, mode, canVerify, canWork) {
  const canDeleteAssignment = Boolean(ticket.assignedTo) && (currentUser?.role === "admin" || ticket.createdBy === currentUser?.id);
  const canAdminClose = currentUser?.role === "admin" && ticket.status !== "Closed";
  const isClosed = ticket.status === "Closed";
  const availableStatuses = ["Present", "Busy", "Emergency Available"];
  // Admin sees every technician (available first) — unavailable ones go through the
  // override-with-reason flow instead of disappearing from the dropdown entirely.
  const assignableForRole = currentUser?.role === "admin"
    ? [...state.technicians].sort((a, b) =>
        Number(availableStatuses.includes(b.status)) - Number(availableStatuses.includes(a.status))
        || String(a.name).localeCompare(String(b.name)))
    : state.technicians.filter((tech) => availableStatuses.includes(tech.status));
  const assignmentOptions = assignableForRole
    .map((tech) => {
      const selected = tech.id === ((ticket.suggestedTechnician && assignableForRole.some((item) => item.id === ticket.suggestedTechnician.id) ? ticket.suggestedTechnician.id : "") || ticket.assignedTo) ? "selected" : "";
      const summary = technicianAssignmentSummary(tech, ticket);
      const hardRisk = summary.risk;
      const warning = hardRisk.includes("not registered for outlet") ? " [blocked]" : hardRisk.length ? " [override]" : "";
      return `<option value="${escapeHtml(tech.id)}" ${selected}>${escapeHtml(summary.label)}${escapeHtml(warning)}</option>`;
    })
    .join("");

  if (canVerify && ["admin", "manager"].includes(mode) && ["admin", "manager"].includes(currentUser?.role)) {
    return `
      <div class="action-group-title">Verification</div>
      <button class="small-button success" data-status="${escapeHtml(ticket.id)}:Closed">Approve + Close</button>
      <button class="small-button warning" data-status="${escapeHtml(ticket.id)}:Reopened">Reopen</button>
    `;
  }

  if (mode === "admin" && canUseView("admin")) {
    return `
      <div class="action-group-title">${isClosed ? "Admin Recovery" : "Dispatch"}</div>
      <select data-assign="${escapeHtml(ticket.id)}" aria-label="Assign ${escapeHtml(ticket.id)}">${assignmentOptions}</select>
      <button class="small-button primary" data-assign-button="${escapeHtml(ticket.id)}">${isClosed ? "Reassign + Reopen" : "Assign Job"}</button>
      ${canDeleteAssignment ? `<button class="small-button danger" data-delete-assignment="${escapeHtml(ticket.id)}">Delete</button>` : ""}
      ${isClosed ? `<button class="small-button warning" data-status="${escapeHtml(ticket.id)}:Reopened">Reopen</button>` : `<button class="small-button warning" data-status="${escapeHtml(ticket.id)}:Blocked">Blocked</button>`}
      ${(isClosed || Number(ticket.closePrice || 0) > 0) ? `<button class="small-button" data-edit-close-price="${escapeHtml(ticket.id)}">Edit Price</button>` : ""}
      ${canAdminClose ? `<button class="small-button success" data-status="${escapeHtml(ticket.id)}:Closed">Close Ticket</button>` : ""}
    `;
  }

  if (mode === "technician" && canWork && canUseView("technician")) {
    return `
      <div class="action-group-title">Field Actions</div>
      ${ticket.status === "Assigned" ? `<button class="small-button primary" data-accept-ticket="${escapeHtml(ticket.id)}">Accept Job</button>` : ""}
      ${ticket.status === "Acknowledged" ? `<button class="small-button primary" data-status="${escapeHtml(ticket.id)}:In Progress">Start</button>` : ""}
      ${["In Progress", "Blocked"].includes(ticket.status) ? `<button class="small-button warning" data-status="${escapeHtml(ticket.id)}:Blocked">Stop / Not Done</button>` : ""}
      ${["In Progress", "Blocked"].includes(ticket.status) ? `<button class="small-button success" data-status="${escapeHtml(ticket.id)}:Resolved">Complete</button>` : ""}
    `;
  }

  return "";
}

function ticketCard(ticket, mode) {
  const assigned = technicianById(ticket.assignedTo);
  const asset = (state.assets || []).find((item) => item.id === ticket.assetId);
  const category = ticketCategoryLabel(ticket);
  const suggested = !assigned && ticket.status !== "Closed" ? ticket.suggestedTechnician : null;
  const selectedTech = assigned || suggested;
  const selectedSummary = selectedTech ? technicianAssignmentSummary(selectedTech, ticket) : null;
  const canVerify = ticket.status === "Resolved" || ticket.status === "Verification Pending";
  const canWork = ["Assigned", "Acknowledged", "In Progress", "Blocked"].includes(ticket.status);
  const history = Array.isArray(ticket.history) ? ticket.history : [];
  const lastHistory = history[history.length - 1];
  const priorityClass = `priority-${token(ticket.priority)}`;
  const statusClass = `status-${token(ticket.status)}`;
  const step = ticketStep(ticket.status);
  const actions = renderActionButtons(ticket, mode, canVerify, canWork);
  const dispatchReason = suggested?.dispatchReason || (assigned ? `Assigned to ${assigned.name}` : "");
  const nextAction = mode === "admin" ? ticketNextAction(ticket, assigned, suggested) : "";
  const photoUrls = (ticket.photoUrls?.length ? ticket.photoUrls : [ticket.photoUrl]).filter(Boolean);
  const resolutionPhotoUrls = (ticket.resolutionPhotoUrls || []).filter(Boolean);
  const workflowSteps = ticketWorkflowSteps(ticket);

  return `
    <article class="ticket-card ${priorityClass}" data-ticket-id="${escapeHtml(ticket.id)}">
      <div class="ticket-top">
        <div>
          <h3 class="ticket-title"><span class="ticket-id">${escapeHtml(ticket.id)}</span> ${escapeHtml(ticket.note || "Maintenance request")}</h3>
          <p class="ticket-meta">${escapeHtml(ticket.outlet)}${ticket.area ? ` / ${escapeHtml(ticket.area)}` : ""} / Category: ${escapeHtml(category)} / Asset: ${escapeHtml(asset?.name || "General")} / ${escapeHtml(ticket.impact)}</p>
          <p class="ticket-meta">Opened ${escapeHtml(formatDateTime(ticket.createdAt))} / ${escapeHtml(formatAge(ticket.createdAt))}</p>
        </div>
        <span class="badge ${priorityClass}">${escapeHtml(PRIORITY_LABELS[ticket.priority] || ticket.priority)}</span>
      </div>
      <div class="ticket-flow" aria-label="Ticket workflow">
        ${workflowSteps.map((item) => `
          <span class="${escapeHtml(item.className)}">${escapeHtml(item.label)}</span>
        `).join("")}
      </div>
      <div class="ticket-progress" aria-label="Ticket progress">
        <div class="progress-copy">
          <span>${escapeHtml(step.label)}</span>
          <span>${step.percent}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width: ${step.percent}%"></div></div>
      </div>
      <div class="badge-row">
        <span class="badge ${statusClass}">${escapeHtml(ticket.status)}</span>
        <span class="badge">${escapeHtml(assigned ? assigned.name : "Unassigned")}</span>
        ${ticket.scheduledAt ? `<span class="badge">Dispatch ${escapeHtml(formatDateTime(ticket.scheduledAt))}</span>` : ""}
        ${Number(ticket.closePrice || 0) > 0 ? `<span class="badge status-closed">Close ${escapeHtml(formatClosePrice(ticket.closePrice))}</span>` : ""}
        ${photoUrls.length ? `<span class="badge photo-badge">${photoUrls.length} Photo${photoUrls.length === 1 ? "" : "s"}</span>` : ""}
        ${resolutionPhotoUrls.length ? `<span class="badge status-closed">Completion Photo</span>` : ""}
        ${suggested ? `<span class="badge confidence">Score ${escapeHtml(suggested.dispatchScore || "OK")}: ${escapeHtml(suggested.name)}</span>` : ""}
        ${selectedSummary?.risk.length ? `<span class="badge status-blocked">Override risk: ${escapeHtml(selectedSummary.risk.join(", "))}</span>` : ""}
      </div>
      ${nextAction ? `<p class="ticket-meta next-action">Next: ${escapeHtml(nextAction)}</p>` : ""}
      ${photoUrls.length ? `
        <button class="ticket-photo" type="button" data-photo-open="${escapeHtml(ticket.id)}" aria-label="Open issue photo for ${escapeHtml(ticket.id)}">
          <img src="${escapeHtml(photoUrls[0])}" alt="Issue photo for ${escapeHtml(ticket.id)}">
          <span>${photoUrls.length} issue photo${photoUrls.length === 1 ? "" : "s"} attached</span>
        </button>
      ` : ""}
      ${resolutionPhotoUrls.length ? `
        <button class="ticket-photo completion-photo" type="button" data-resolution-photo-open="${escapeHtml(ticket.id)}" aria-label="Open completion photo for ${escapeHtml(ticket.id)}">
          <img src="${escapeHtml(resolutionPhotoUrls[0])}" alt="Completion photo for ${escapeHtml(ticket.id)}">
          <span>${resolutionPhotoUrls.length} completion photo${resolutionPhotoUrls.length === 1 ? "" : "s"} attached</span>
        </button>
      ` : ""}
      ${dispatchReason ? `<p class="ticket-meta dispatch-confidence">Dispatch: ${escapeHtml(dispatchReason)}</p>` : ""}
      ${mode === "admin" && selectedSummary ? `
        <div class="assignment-signal">
          <span>${escapeHtml(technicianSkillLabel(selectedTech))}</span>
          <span>${selectedSummary.servesOutlet ? "Outlet covered" : "Not registered for outlet"}</span>
          <span>${selectedSummary.openJobs} active jobs</span>
          <span>${selectedSummary.pendingTasks} pending tasks</span>
        </div>
      ` : ""}
      ${ticket.latestDetail ? `<p class="ticket-meta">Detail: ${escapeHtml(ticket.latestDetail)}</p>` : ""}
      ${lastHistory ? `<p class="ticket-meta">Last action: ${escapeHtml(lastHistory.action)}</p>` : ""}
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </article>
  `;
}

function dashboardTitle() {
  if (currentUser?.role === "manager") return `${currentUser.outlet} Workspace`;
  if (currentUser?.role === "technician") return "Field Workspace";
  if (currentUser?.role === "admin") return "Admin Workspace";
  return "Business Dashboard";
}

function dashboardSubtitle() {
  if (currentUser?.role === "manager") return "Outlet work, risk, dispatch, and closure pressure in one place.";
  if (currentUser?.role === "technician") return "Assigned tickets and next field actions in one place.";
  return "Live health across outlets, technicians, dispatch, and ticket movement.";
}

function actionItems() {
  const tickets = ticketsForCurrentUser(state.tickets).filter((ticket) => ticket.status !== "Closed");
  if (currentUser?.role === "technician") {
    return tickets
      .filter((ticket) => ["Assigned", "Acknowledged", "In Progress", "Blocked", "Reopened"].includes(ticket.status))
      .slice(0, 5)
      .map((ticket) => ({
        title: `${ticket.id} ${ticket.status}`,
        detail: `${ticket.outlet} / ${ticket.category} / ${ticket.note}`,
        tone: ticket.status === "Blocked" || ticket.status === "Reopened" ? "urgent" : "normal"
      }));
  }

  if (currentUser?.role === "manager") {
    return tickets
      .filter((ticket) => ["Resolved", "Verification Pending", "Reopened", "Blocked", "Assigned", "In Progress", "New"].includes(ticket.status))
      .slice(0, 5)
      .map((ticket) => ({
        title: `${ticket.id} ${ticket.status}`,
        detail: `${ticket.category} / ${ticket.note}`,
        tone: ticket.priority === "P1" || ticket.status === "Blocked" || ticket.status === "Reopened" ? "urgent" : "normal"
      }));
  }

  return tickets
    .filter((ticket) => !ticket.assignedTo || ticket.priority === "P1" || ["Blocked", "Reopened"].includes(ticket.status))
    .slice(0, 5)
    .map((ticket) => ({
      title: `${ticket.id} ${ticket.assignedTo ? ticket.status : "Unassigned"}`,
      detail: `${ticket.outlet} / ${ticket.category} / ${ticket.note}`,
      tone: ticket.priority === "P1" || ticket.status === "Blocked" || ticket.status === "Reopened" ? "urgent" : "normal"
    }));
}

function latestActivities(limit = 5) {
  return ticketsForCurrentUser(state.tickets)
    .flatMap((ticket) => (ticket.history || []).map((item) => ({
      ...item,
      ticketId: ticket.id,
      note: ticket.note,
      outlet: ticket.outlet,
      atTime: new Date(item.at).getTime()
    })))
    .sort((a, b) => (b.atTime || 0) - (a.atTime || 0))
    .slice(0, limit);
}

function outletHealthCards(limit = 6) {
  const tickets = ticketsForCurrentUser(state.tickets);
  const outlets = currentUser?.role === "manager" && currentUser.outlet ? [currentUser.outlet] : state.outlets;
  const outletRows = outlets.map((outlet) => {
    const outletTickets = tickets.filter((ticket) => ticket.outlet === outlet && ticket.status !== "Closed");
    const critical = outletTickets.filter((ticket) => ticket.priority === "P1").length;
    const blocked = outletTickets.filter((ticket) => ticket.status === "Blocked").length;
    const unassigned = outletTickets.filter((ticket) => !ticket.assignedTo).length;
    const health = critical ? "Critical" : blocked ? "Blocked" : unassigned ? "Dispatch" : outletTickets.length ? "Active" : "Healthy";
    const score = (critical * 7) + (blocked * 5) + (unassigned * 3) + outletTickets.length;
    return { outlet, outletTickets, critical, blocked, unassigned, health, score };
  }).sort((a, b) => b.score - a.score || b.outletTickets.length - a.outletTickets.length || a.outlet.localeCompare(b.outlet));

  const maxOpen = Math.max(...outletRows.map((row) => row.outletTickets.length), 1);
  return outletRows.slice(0, limit).map(({ outlet, outletTickets, critical, blocked, unassigned, health }) => {
    const expanded = health !== "Healthy";
    return `
      <article class="outlet-card status-${token(health)} ${expanded ? "is-expanded" : "is-healthy"}" style="--outlet-load: ${Math.round((outletTickets.length / maxOpen) * 100)}%">
        <div class="outlet-card-main">
          <span class="health-dot" aria-hidden="true"></span>
          <strong>${escapeHtml(outlet)}</strong>
          <span>${escapeHtml(health)}</span>
        </div>
        ${expanded ? `
          <div class="outlet-stats">
            <span>${outletTickets.length}<small> open</small></span>
            <span>${critical}<small> crit</small></span>
            <span>${blocked}<small> blkd</small></span>
            <span>${unassigned}<small> queue</small></span>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

function closedAt(ticket) {
  const history = Array.isArray(ticket.history) ? ticket.history : [];
  const closed = [...history].reverse().find((item) => /closed|approved/i.test(item.action || ""));
  return closed?.at || ticket.updatedAt || ticket.completedAt || ticket.createdAt;
}

function dateBucketCount(items, dateGetter, days) {
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const value = dateGetter(item);
    const time = new Date(value || 0).getTime();
    return Number.isFinite(time) && now - time <= windowMs;
  }).length;
}

function calendarDayCount(items, dateGetter, dateKey = todayInputValue()) {
  return items.filter((item) => String(dateGetter(item) || "").slice(0, 10) === dateKey).length;
}

function categoryRepairRows(tickets) {
  const map = new Map();
  tickets.forEach((ticket) => {
    const key = ticket.category || "Uncategorized";
    const row = map.get(key) || { category: key, total: 0, open: 0, critical: 0, blocked: 0, closed: 0 };
    row.total += 1;
    if (ticket.status === "Closed") row.closed += 1;
    else row.open += 1;
    if (ticket.priority === "P1") row.critical += 1;
    if (ticket.status === "Blocked") row.blocked += 1;
    map.set(key, row);
  });
  return [...map.values()].sort((a, b) => b.open - a.open || b.total - a.total || a.category.localeCompare(b.category));
}

function renderCategoryRepairBoard(tickets, limit = Infinity) {
  const rows = categoryRepairRows(tickets);
  const max = Math.max(...rows.map((row) => row.open), 1);
  return rows.length
    ? rows.slice(0, limit).map((row, index) => {
      const percent = Math.round((row.open / max) * 100);
      return `
        <article class="repair-row heat-${Math.min(index + 1, 5)}" style="--repair-load: ${percent}%">
          <div>
            <strong>${escapeHtml(row.category)}</strong>
            <span>${row.total} total / ${row.closed} closed / ${row.critical} critical</span>
          </div>
          <div class="repair-bar" aria-label="${escapeHtml(row.category)} open repairs">
            <span style="width: ${percent}%"></span>
          </div>
          <b>${row.open}</b>
        </article>
      `;
    }).join("")
    : `<div class="empty mini">No category repair data yet.</div>`;
}

function ticketTrendSeries(tickets) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString([], { weekday: "short" }),
      created: tickets.filter((ticket) => String(ticket.createdAt || "").slice(0, 10) === key).length,
      closed: tickets.filter((ticket) => ticket.status === "Closed" && String(closedAt(ticket) || "").slice(0, 10) === key).length
    };
  });
}

function renderTicketTrend(tickets) {
  const series = ticketTrendSeries(tickets);
  const max = Math.max(...series.flatMap((item) => [item.created, item.closed]), 1);
  return `
    <div class="dashboard-trend" aria-label="Seven day ticket movement">
      ${series.map((item) => `
        <div>
          <span class="trend-bars">
            <i class="created" style="height: ${Math.max(8, Math.round((item.created / max) * 100))}%"></i>
            <i class="closed" style="height: ${Math.max(8, Math.round((item.closed / max) * 100))}%"></i>
          </span>
          <small>${escapeHtml(item.label)}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function openClawAdvisor(tickets, reports, actions) {
  const open = tickets.filter((ticket) => ticket.status !== "Closed");
  const blocked = open.filter((ticket) => ticket.status === "Blocked");
  const unassigned = open.filter((ticket) => !ticket.assignedTo);
  const verification = open.filter((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status));
  const critical = open.filter((ticket) => ticket.priority === "P1");
  const overloaded = (reports.technicianWorkload || [])
    .filter((tech) => Number(tech.openTickets || 0) >= 3)
    .sort((a, b) => Number(b.openTickets || 0) - Number(a.openTickets || 0));
  const topCategory = categoryRepairRows(tickets)[0];

  const moves = [];
  if (critical.length) moves.push(`Escalate ${critical.length} critical ticket${critical.length === 1 ? "" : "s"} first; require ETA and photo proof.`);
  if (unassigned.length) moves.push(`Assign ${unassigned.length} unassigned ticket${unassigned.length === 1 ? "" : "s"} before new work enters the queue.`);
  if (blocked.length) moves.push(`Ask blockers for reason, owner, and next decision; ${blocked.length} blocked item${blocked.length === 1 ? "" : "s"} cannot move.`);
  if (verification.length) moves.push(`Push manager verification on ${verification.length} resolved item${verification.length === 1 ? "" : "s"} to close the loop.`);
  if (overloaded.length) moves.push(`${overloaded[0].name} is carrying ${overloaded[0].openTickets} open jobs; rebalance before assigning more.`);
  if (topCategory?.open) moves.push(`${topCategory.category} is the hottest repair category with ${topCategory.open} open item${topCategory.open === 1 ? "" : "s"}.`);
  if (!moves.length && actions.length) moves.push(...actions.slice(0, 2).map((item) => `${item.title}: ${item.detail}`));
  if (!moves.length) moves.push("Operation is stable. Keep watching closures, proof, and technician availability.");

  const focus = critical.length ? "Critical risk" : blocked.length ? "Blocked work" : unassigned.length ? "Dispatch queue" : verification.length ? "Closure loop" : "Stable operations";

  return `
    <article class="openclaw-lead">
      <span>Current focus</span>
      <strong>${escapeHtml(focus)}</strong>
      <p>OpenClaw is watching missing manual actions and turning them into clear admin moves.</p>
    </article>
    <div class="openclaw-moves">
      ${moves.slice(0, 3).map((move, index) => `
        <article>
          <b>${index + 1}</b>
          <span>${escapeHtml(move)}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function dashboardSummarySnapshot(tickets, reports, actions, completedToday, completedWeek, completedMonth, todayTasks, doneTasks) {
  const open = tickets.filter((ticket) => ticket.status !== "Closed");
  const blocked = open.filter((ticket) => ticket.status === "Blocked").length;
  const unassigned = open.filter((ticket) => !ticket.assignedTo).length;
  const critical = open.filter((ticket) => ticket.priority === "P1").length;
  const verification = open.filter((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status)).length;
  const outletRows = (currentUser?.role === "manager" && currentUser.outlet ? [currentUser.outlet] : state.outlets).map((outlet) => {
    const outletTickets = tickets.filter((ticket) => ticket.outlet === outlet);
    return {
      outlet,
      open: outletTickets.length,
      critical: outletTickets.filter((ticket) => ticket.priority === "P1").length,
      blocked: outletTickets.filter((ticket) => ticket.status === "Blocked").length,
      unassigned: outletTickets.filter((ticket) => !ticket.assignedTo).length
    };
  }).sort((a, b) => b.open - a.open || b.critical - a.critical || b.blocked - a.blocked || a.outlet.localeCompare(b.outlet));
  const focus = critical ? "Critical risk" : blocked ? "Blocked work" : unassigned ? "Dispatch gap" : verification ? "Closure loop" : "Stable operations";
  const nextChecks = actions.length
    ? actions.slice(0, 3)
    : [
        { title: `Open ${open.length} active ticket${open.length === 1 ? "" : "s"}`, detail: `${blocked} blocked / ${unassigned} unassigned / ${critical} critical`, tone: "normal" },
        { title: `Close loop on ${verification} verified item${verification === 1 ? "" : "s"}`, detail: "Manager approval before closure", tone: verification ? "urgent" : "normal" },
        { title: todayTasks.length ? `Checklist ${doneTasks}/${todayTasks.length}` : "Checklist clear", detail: `${completedToday} today / ${completedWeek} this week / ${completedMonth} this month`, tone: "normal" }
      ];

  const topCategory = categoryRepairRows(tickets)[0];

  return `
    <article class="summary-focus-card">
      <div class="summary-focus-head">
        <div>
          <span>Current focus</span>
          <strong>${escapeHtml(focus)}</strong>
        </div>
        <span class="heading-chip">${escapeHtml(open.length)} open</span>
      </div>
      <p>OpenClaw keeps the board tight: priority, dispatch gap, verification, and checklist completion.</p>
      <div class="summary-signal-grid">
        <div><span>Critical</span><strong>${critical}</strong></div>
        <div><span>Blocked</span><strong>${blocked}</strong></div>
        <div><span>Unassigned</span><strong>${unassigned}</strong></div>
        <div><span>Verify</span><strong>${verification}</strong></div>
      </div>
      <div class="summary-checklist">
        <span>Today ${todayTasks.length ? `${doneTasks}/${todayTasks.length}` : "0/0"}</span>
        <span>This week ${completedWeek}</span>
        <span>This month ${completedMonth}</span>
      </div>
    </article>
    <div class="action-list compact">
      ${nextChecks.map((item, index) => `
        <article class="action-item ${item.tone === "urgent" ? "urgent" : ""}">
          <strong>${index + 1}. ${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>
      `).join("")}
    </div>
    <div class="summary-mini-stack">
      <div class="summary-mini-block">
        <span>Top category</span>
        <strong>${escapeHtml(topCategory?.category || "No data")}</strong>
        <p>${topCategory ? `${topCategory.open} open / ${topCategory.critical} critical / ${topCategory.blocked} blocked` : "Waiting for live ticket volume."}</p>
      </div>
      <div class="summary-mini-block">
        <span>Top outlet</span>
        <strong>${escapeHtml(outletRows[0]?.outlet || "No data")}</strong>
        <p>${outletRows[0] ? `${outletRows[0].open} open / ${outletRows[0].critical} critical / ${outletRows[0].blocked} blocked` : "Outlet pressure is rolled up in the deep dive view."}</p>
      </div>
    </div>
  `;
}

// ─── KPI DRILL PANEL ──────────────────────────────────────────────────────
function openKpiDrill(title, tickets, tasks) {
  const overlay = document.getElementById("kpiDrillOverlay");
  const body = document.getElementById("kpiDrillBody");
  const titleEl = document.getElementById("kpiDrillTitle");
  const countEl = document.getElementById("kpiDrillCount");
  if (!overlay || !body) return;

  titleEl.textContent = title;

  if (tasks && tasks.length) {
    countEl.textContent = tasks.length;
    body.innerHTML = tasks.length
      ? tasks.map((task) => `
          <div class="kpi-drill-task-item">
            <strong>${escapeHtml(task.title || "Task")}</strong>
            <span>${escapeHtml(task.outlet || "")} · ${escapeHtml(task.status || "")} · ${escapeHtml(task.date || "")}</span>
          </div>
        `).join("")
      : `<div class="kpi-drill-empty">No tasks found.</div>`;
  } else {
    countEl.textContent = (tickets || []).length;
    body.innerHTML = (tickets && tickets.length)
      ? tickets.map((ticket) => {
          const tech = technicianById(ticket.assignedTo);
          const age = ticket.createdAt ? formatAge(ticket.createdAt) : "";
          return `
            <article class="ticket-card priority-${token(ticket.priority || "p4")}"
              style="cursor:default;">
              <div class="ticket-id-row">
                <span class="ticket-id">${escapeHtml(ticket.id)}</span>
                <span class="priority-badge priority-${token(ticket.priority)}">${escapeHtml(ticket.priority || "")}</span>
                <span class="status-badge">${escapeHtml(ticket.status || "")}</span>
              </div>
              <div class="ticket-main">
                <strong>${escapeHtml(ticket.note || ticket.latestDetail || "")}</strong>
                <span>${escapeHtml(ticket.outlet || "")} · ${escapeHtml(ticket.category || "")}${ticket.area ? " · " + ticket.area : ""}</span>
              </div>
              <div class="ticket-meta">
                <span>${tech ? escapeHtml(tech.name) : "Unassigned"}</span>
                <span>${age}</span>
              </div>
            </article>
          `;
        }).join("")
      : `<div class="kpi-drill-empty">Nothing here right now.</div>`;
  }

  overlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeKpiDrill() {
  const overlay = document.getElementById("kpiDrillOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
}
// ─── END KPI DRILL ────────────────────────────────────────────────────────

function renderDashboard() {
  const reports = state.reports || {};
  const allScopedTickets = ticketsForCurrentUser(state.tickets);
  const scopedTickets = allScopedTickets.filter((ticket) => ticket.status !== "Closed");
  const scopedTicketIds = new Set(scopedTickets.map((ticket) => ticket.id));
  const readyTechs = state.technicians.filter((tech) => ["Present", "Emergency Available"].includes(tech.status)).length;
  const actions = actionItems();
  const activities = latestActivities();
  const closedTicketList = allScopedTickets.filter((ticket) => ticket.status === "Closed");
  const closedTickets = closedTicketList.length;
  const blocked = scopedTickets.filter((ticket) => ticket.status === "Blocked").length;
  const unassigned = scopedTickets.filter((ticket) => !ticket.assignedTo).length;
  const assigned = scopedTickets.filter((ticket) => ticket.assignedTo).length;
  const critical = scopedTickets.filter((ticket) => ticket.priority === "P1").length;
  const goingOn = scopedTickets.filter((ticket) => ["Assigned", "Acknowledged", "In Progress", "Blocked", "Reopened"].includes(ticket.status)).length;
  const completedToday = calendarDayCount(closedTicketList, closedAt);
  const completedWeek = dateBucketCount(closedTicketList, closedAt, 7);
  const completedMonth = dateBucketCount(closedTicketList, closedAt, 30);
  const closePriceTotal = Number(reports.closePriceTotal || closedTicketList.reduce((sum, ticket) => sum + Number(ticket.closePrice || 0), 0));
  const closePriceMonth = closedTicketList
    .filter((ticket) => {
      const value = closedAt(ticket);
      if (!value) return false;
      const time = new Date(value).getTime();
      return Number.isFinite(time) && Date.now() - time <= 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((sum, ticket) => sum + Number(ticket.closePrice || 0), 0);
  const todayTasks = (state.tasks || []).filter((task) => task.date === todayInputValue());
  const doneTasks = todayTasks.filter((task) => task.status === "Done").length;
  const totalForCharts = Math.max(scopedTickets.length, 1);
  const readyPercent = state.technicians.length ? Math.round((readyTechs / state.technicians.length) * 100) : 0;

  const taskPercent = todayTasks.length ? Math.round((doneTasks / todayTasks.length) * 100) : 100;
  document.querySelector("#dashboardTitle").textContent = "TicketOps Command Board";
  document.querySelector("#dashboardSubtitle").textContent = "Live, read-only command view for risk, dispatch, repair pressure, outlet health, and closure movement.";
  applyDashboardMode(currentDashboardMode);
  document.querySelector("#dashOpen").textContent = reports.open ?? scopedTickets.length;
  document.querySelector("#dashCritical").textContent = reports.critical || 0;
  document.querySelector("#dashReady").textContent = `${readyTechs}/${state.technicians.length || 0}`;
  document.querySelector("#dashboardKpiGrid").innerHTML = [
    ["Active", scopedTickets.length, "All open tickets", "blue", Math.min(100, scopedTickets.length * 12), "Now", "active"],
    ["Going On", goingOn, "Assigned / running / blocked", "purple", Math.min(100, goingOn * 15), "Field", "going-on"],
    ["Completed Today", completedToday, "Approved closures", "green", Math.min(100, completedToday * 20), "Today", "completed-today"],
    ["This Week", completedWeek, "Closed in 7 days", "teal", Math.min(100, completedWeek * 10), "7D", "week"],
    ["This Month", completedMonth, "Closed in 30 days", "gold", Math.min(100, completedMonth * 4), "30D", "month"],
    ["Close Value", formatClosePrice(closePriceTotal), "All priced closures", "gold", Math.min(100, closePriceTotal / 1000), "Rs", "close-value"],
    ["30D Value", formatClosePrice(closePriceMonth), "Priced closures in 30 days", "teal", Math.min(100, closePriceMonth / 1000), "30D", "30d-value"],
    ["Checklist", todayTasks.length ? `${doneTasks}/${todayTasks.length}` : "0/0", "Daily PM completion", "coral", taskPercent, "PM", "checklist"]
  ].map(([label, value, detail, tone, meter, badge, kpiKey]) => `
    <article class="dashboard-kpi ${tone} kpi-${escapeHtml(kpiKey || label)}" data-kpi-key="${escapeHtml(kpiKey || label)}" role="button" tabindex="0" aria-label="View ${escapeHtml(label)} details">
      <div class="dashboard-kpi-head">
        <span>${escapeHtml(label)}</span>
        <b>${escapeHtml(badge)}</b>
      </div>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(detail)}</small>
      <i class="dashboard-kpi-meter" aria-hidden="true"><em style="width: ${Math.max(4, Math.min(100, Number(meter) || 0))}%"></em></i>
    </article>
  `).join("");
  // Wire KPI card click handlers
  document.querySelector("#dashboardKpiGrid").onclick = (e) => {
    const card = e.target.closest("[data-kpi-key]");
    if (!card) return;
    const key = card.dataset.kpiKey;
    const allTickets = ticketsForCurrentUser(state.tickets);
    const open = allTickets.filter((t) => !["Closed", "Cancelled"].includes(t.status));
    const today = todayInputValue();
    const drillMap = {
      "active": { title: "Active Tickets", tickets: open },
      "going-on": { title: "In-Progress Tickets", tickets: open.filter((t) => ["Assigned","Acknowledged","In Progress","Blocked","Reopened"].includes(t.status)) },
      "completed-today": { title: "Closed Today", tickets: allTickets.filter((t) => { const d = closedAt(t); return d && d.startsWith(today); }) },
      "week": { title: "Closed This Week (7D)", tickets: allTickets.filter((t) => { const d = closedAt(t); if (!d) return false; return Date.now() - new Date(d).getTime() <= 7*24*60*60*1000; }) },
      "month": { title: "Closed This Month (30D)", tickets: allTickets.filter((t) => { const d = closedAt(t); if (!d) return false; return Date.now() - new Date(d).getTime() <= 30*24*60*60*1000; }) },
      "close-value": { title: "Tickets with Close Price", tickets: allTickets.filter((t) => Number(t.closePrice || 0) > 0) },
      "30d-value": { title: "30D Priced Closures", tickets: allTickets.filter((t) => { const d = closedAt(t); if (!d) return false; return Number(t.closePrice || 0) > 0 && Date.now() - new Date(d).getTime() <= 30*24*60*60*1000; }) },
      "checklist": { title: "Today's Checklist Tasks", tasks: (state.tasks || []).filter((t) => t.date === today) }
    };
    const drill = drillMap[key];
    if (!drill) return;
    openKpiDrill(drill.title, drill.tickets, drill.tasks);
  };
  document.querySelector("#dashboardKpiGrid").onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.target.closest("[data-kpi-key]")?.click();
    }
  };

  // Calculate status breakdown for utilization metric
  const utilization = state.technicians.length > 0
    ? Math.round((assigned / state.technicians.length) * 100)
    : 0;

  document.querySelector("#dashboardCharts").innerHTML = `
    ${donutChart("Dispatch", assigned, totalForCharts, `${unassigned} waiting for admin`, "blue")}
    ${donutChart("Risk", critical + blocked, totalForCharts, `${critical} critical / ${blocked} blocked`, "coral")}
    ${donutChart("Queue Velocity", goingOn, totalForCharts, `${goingOn} in active progress`, "purple")}
    ${donutChart("Utilization", assigned, Math.max(state.technicians.length || 1, 1), `${utilization}% tech allocation`, "gold")}
    <article class="ops-chart trend-card">
      <div class="trend-head">
        <span>7D Flow</span>
        <div class="trend-legend"><i class="created"></i>New <i class="closed"></i>Done</div>
      </div>
      ${renderTicketTrend(allScopedTickets)}
    </article>
  `;

  document.querySelector("#dashboardSummaryActions").innerHTML = dashboardSummarySnapshot(
    scopedTickets,
    reports,
    actions,
    completedToday,
    completedWeek,
    completedMonth,
    todayTasks,
    doneTasks
  );
  document.querySelector("#dashboardSummaryCategories").innerHTML = renderCategoryRepairBoard(allScopedTickets, 8);
  document.querySelector("#dashboardSummaryOutlets").innerHTML = outletHealthCards(Math.max(state.outlets.length, 8)) || `<div class="empty mini">No outlet data yet.</div>`;

  document.querySelector("#openClawAdvisorBoard").innerHTML = openClawAdvisor(allScopedTickets, reports, actions);
  document.querySelector("#categoryRepairBoard").innerHTML = renderCategoryRepairBoard(allScopedTickets, 12);
  document.querySelector("#outletHealthBoard").innerHTML = outletHealthCards(Math.max(state.outlets.length, 10)) || `<div class="empty mini">No outlet data yet.</div>`;

  document.querySelector("#needsActionBoard").innerHTML = actions.length
    ? actions.map((item) => `
        <article class="action-item ${item.tone === "urgent" ? "urgent" : ""}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>
      `).join("")
    : `<div class="empty mini">No urgent action right now.</div>`;

  document.querySelector("#dispatchBrainBoard").innerHTML = state.technicians.map((tech) => {
    const activeJobs = (stateIndex.ticketsByTechnicianId.get(tech.id) || [])
      .filter((ticket) => scopedTicketIds.has(ticket.id))
      .length;
    const todayPending = technicianPendingTasks(tech.id);
    const loadTotal = Math.max(activeJobs + todayPending, 1);
    return `
      <article class="dispatch-card status-${token(tech.status)}">
        <div>
          <strong>${escapeHtml(tech.name)}</strong>
          <span>${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(tech.status)}</span>
        </div>
        <span>${escapeHtml(serviceAreaLabel(tech))}</span>
        <div class="dispatch-score">
          <span>${activeJobs} active</span>
          <span>${todayPending} PM</span>
        </div>
        <div class="tech-load-bar"><span style="width: ${Math.min(100, loadTotal * 18)}%"></span></div>
      </article>
    `;
  }).join("");

  if (!state.technicians.length) {
    document.querySelector("#dispatchBrainBoard").innerHTML = `<div class="empty mini">No technician workload data.</div>`;
  }

  document.querySelector("#dashboardActivityBoard").innerHTML = activities.length
    ? activities.slice(0, 8).map((item) => `
        <article class="activity-item">
          <div>
            <strong>${escapeHtml(item.ticketId)} / ${escapeHtml(item.outlet)}</strong>
            <span>${escapeHtml(item.action)}</span>
          </div>
          <time>${escapeHtml(formatDateTime(item.at))}</time>
        </article>
      `).join("")
    : `<div class="empty mini">No activity recorded yet.</div>`;
}

function donutChart(label, value, total, detail, tone = "teal") {
  const cleanTotal = Math.max(Number(total) || 0, 1);
  const cleanValue = Math.max(0, Math.min(Number(value) || 0, cleanTotal));
  const percent = Math.round((cleanValue / cleanTotal) * 100);
  const chartColors = {
    blue: "#2563eb",
    teal: "#0f766e",
    green: "#16a34a",
    coral: "#dc2626",
    gold: "#d97706",
    purple: "#7c3aed"
  };
  return `
    <article class="ops-chart chart-${escapeHtml(tone)}" style="--chart-color: ${chartColors[tone] || chartColors.teal}">
      <div class="chart-ring" style="--value: ${percent}"></div>
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(percent)}%</strong>
        <p>${escapeHtml(cleanValue)} / ${escapeHtml(cleanTotal)} &middot; ${escapeHtml(detail)}</p>
      </div>
    </article>
  `;
}

function renderManager() {
  const scopedTickets = ticketsForCurrentUser(state.tickets);
  const list = scopedTickets
    .filter((ticket) => ticket.status !== "Closed")
    .sort((a, b) => {
      const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 };
      return (priorityRank[a.priority] || 9) - (priorityRank[b.priority] || 9)
        || String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  const seen = new Set();
  const takeTickets = (predicate) => list.filter((ticket) => {
    if (seen.has(ticket.id) || !predicate(ticket)) return false;
    seen.add(ticket.id);
    return true;
  });
  const groups = [
    {
      title: "Verify and close",
      detail: "Resolved work waiting for manager approval",
      tickets: takeTickets((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status))
    },
    {
      title: "Blocked or reopened",
      detail: "Needs a manager decision before work can move",
      tickets: takeTickets((ticket) => ["Blocked", "Reopened"].includes(ticket.status))
    },
    {
      title: "Dispatch queue",
      detail: "New requests waiting for ownership",
      tickets: takeTickets((ticket) => !ticket.assignedTo || ticket.status === "New")
    },
    {
      title: "Technician in progress",
      detail: "Assigned work moving through the field",
      tickets: takeTickets((ticket) => ["Assigned", "Acknowledged", "In Progress"].includes(ticket.status))
    },
    {
      title: "Other active work",
      detail: "Everything still open for this outlet",
      tickets: takeTickets(() => true)
    }
  ].filter((group) => group.tickets.length);

  const verify = list.filter((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status)).length;
  const blocked = list.filter((ticket) => ["Blocked", "Reopened"].includes(ticket.status)).length;
  const unassigned = list.filter((ticket) => !ticket.assignedTo || ticket.status === "New").length;
  const critical = list.filter((ticket) => ticket.priority === "P1").length;

  document.querySelector("#managerTickets").innerHTML = list.length
    ? `
      <div class="queue-summary-strip manager-summary">
        <span>${list.length} open</span>
        <span>${verify} verify</span>
        <span>${blocked} blocked</span>
        <span>${unassigned} dispatch</span>
        <span>${critical} critical</span>
      </div>
      ${groups.map((group) => `
        <section class="ticket-queue-group manager-queue-group">
          <div class="queue-group-heading">
            <strong>${escapeHtml(group.title)}</strong>
            <span>${escapeHtml(group.detail)} / ${group.tickets.length}</span>
          </div>
          <div class="queue-group-list">
            ${group.tickets.map((ticket) => ticketCard(ticket, "manager")).join("")}
          </div>
        </section>
      `).join("")}
    `
    : `<div class="empty">No active tickets for this outlet.</div>`;

  const managerScheduled = document.querySelector("#managerScheduledJobs");
  if (managerScheduled) {
    const tasks = scheduledTasksForScope("manager");
    const done = tasks.filter((task) => task.status === "Done").length;
    managerScheduled.innerHTML = `
      <div class="queue-summary-strip manager-summary">
        <span>${tasks.length} today</span>
        <span>${done} done</span>
        <span>${tasks.filter((task) => task.status === "Pending").length} pending</span>
        <span>${tasks.filter((task) => task.status === "Not Done").length} not done</span>
      </div>
      <div class="technician-task-list">${scheduledTaskRows(tasks)}</div>
    `;
  }
}

function masterEntry({ className = "", editAttr, title, detail, deleteValue }) {
  return `
    <div class="master-row master-entry ${className}">
      <button type="button" class="master-row-main" ${editAttr}>
        <strong>${title}</strong>
        <span>${detail}</span>
      </button>
      <div class="master-row-actions">
        <button type="button" class="small-button" ${editAttr}>Edit</button>
        <button type="button" class="small-button danger master-delete-button" data-delete-master="${deleteValue}">Delete</button>
      </div>
    </div>
  `;
}

function assignmentDayLabel(days = []) {
  const clean = [...new Set(days.map((day) => Number(day)).filter((day) => Number.isInteger(day)))].sort((a, b) => a - b);
  return clean.length === 7 ? "All days" : clean.map((day) => ASSIGNMENT_DAY_LABELS[day]).filter(Boolean).join(", ") || "No days";
}

function selectedAssignmentDays() {
  return [...document.querySelectorAll('input[name="assignmentWindowDays"]:checked')].map((input) => Number(input.value));
}

function renderAssignmentTimeRow(window) {
  return `
    <div class="master-row master-entry time-master-row ${window.active === false ? "is-paused" : ""}">
      <div class="master-row-main">
        <strong>${escapeHtml(window.name)}</strong>
        <span>${escapeHtml(assignmentDayLabel(window.days))} / ${escapeHtml(window.startTime)} to ${escapeHtml(window.endTime)} / ${window.active === false ? "Paused" : "Active"}</span>
      </div>
      <div class="master-row-actions time-master-actions">
        <button type="button" class="small-button" data-edit-assignment-window="${escapeHtml(window.id)}">Edit</button>
        <button type="button" class="small-button danger master-delete-button" data-delete-master="assignment-windows:${escapeHtml(window.id)}:${escapeHtml(window.name)}">Delete</button>
      </div>
    </div>
  `;
}

async function saveAssignmentWindow(event) {
  event.preventDefault();
  if (!canUseView("masters") || currentUser?.role !== "admin") return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = editingAssignmentWindowId ? "Updating..." : "Adding...";
  try {
    const allDays = document.querySelector("#assignmentWindowAllDays").checked;
    const window = await api(editingAssignmentWindowId ? `/api/assignment-windows/${editingAssignmentWindowId}` : "/api/assignment-windows", {
      method: editingAssignmentWindowId ? "PATCH" : "POST",
      body: JSON.stringify({
        name: document.querySelector("#assignmentWindowName").value,
        startTime: document.querySelector("#assignmentWindowStart").value,
        endTime: document.querySelector("#assignmentWindowEnd").value,
        allDays,
        days: allDays ? [] : selectedAssignmentDays(),
        active: true
      })
    });
    const wasEditing = Boolean(editingAssignmentWindowId);
    resetAssignmentWindowForm();
    showToast(`${window.name} dispatch window ${wasEditing ? "updated" : "added"}.`, "success");
    await loadState();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingAssignmentWindowId ? "Update Window" : "Add Window";
  }
}

function resetAssignmentWindowForm() {
  editingAssignmentWindowId = "";
  document.querySelector("#assignmentWindowForm")?.reset();
  document.querySelector("#assignmentWindowSubmit").textContent = "Add Window";
}

function fillAssignmentWindowForm(windowId) {
  const window = (state.assignmentTimeWindows || []).find((item) => item.id === windowId);
  if (!window) return;
  editingAssignmentWindowId = window.id;
  document.querySelector("#assignmentWindowName").value = window.name || "";
  document.querySelector("#assignmentWindowStart").value = window.startTime || "";
  document.querySelector("#assignmentWindowEnd").value = window.endTime || "";
  document.querySelector("#assignmentWindowAllDays").checked = (window.days || []).length === 7;
  [...document.querySelectorAll('input[name="assignmentWindowDays"]')].forEach((input) => {
    input.checked = (window.days || []).includes(Number(input.value));
  });
  document.querySelector("#assignmentWindowSubmit").textContent = "Update Window";
}

function renderMasters() {
  ensureMasterSearchControls();
  switchMasterTab(activeMasterTab);

  renderMasterList("#outletBoard", state.outlets.map((outlet) => {
    const location = state.outletLocations?.[outlet] || {};
    const coordinates = location.latitude !== null && location.latitude !== undefined && location.longitude !== null && location.longitude !== undefined
      ? `${location.latitude}, ${location.longitude}`
      : "";
    return masterListItem({ outlet, location, coordinates }, [outlet, location.address, coordinates]);
  }), "outlets", ({ outlet, location, coordinates }) => masterEntry({
    editAttr: `data-edit-outlet="${escapeHtml(outlet)}"`,
    title: escapeHtml(outlet),
    detail: escapeHtml(location.address || coordinates || "Location pending"),
    deleteValue: `outlets:${escapeHtml(outlet)}:${escapeHtml(outlet)}`
  }), masterSearchTerm("outlets") ? "No outlets match this search." : "No outlets yet.");

  const visibleCategories = (state.categories || []).filter((c) => c.name);
  renderMasterList("#categoryBoard", visibleCategories.map((category) => masterListItem(category, [category.name, category.description])), "categories", (category) => masterEntry({
    editAttr: `data-edit-category="${escapeHtml(category.id)}"`,
    title: escapeHtml(category.name),
    detail: escapeHtml(category.description || "Category"),
    deleteValue: `categories:${escapeHtml(category.id)}:${escapeHtml(category.name)}`
  }), masterSearchTerm("categories") ? "No categories match this search." : "No categories yet.");

  renderMasterList("#assetBoard", (state.assets || []).map((asset) => masterListItem(asset, [
    asset.name,
    asset.outlet,
    asset.category,
    asset.subCategory,
    asset.make,
    asset.model,
    asset.serialNo,
    asset.vendor,
    asset.code,
    asset.status
  ])), "assets", (asset) => masterEntry({
    className: `asset-row status-${token(asset.status)}`,
    editAttr: `data-edit-asset="${escapeHtml(asset.id)}"`,
    title: escapeHtml(asset.name),
    detail: escapeHtml([
      asset.outlet,
      asset.category,
      asset.subCategory,
      asset.make || asset.vendor,
      asset.model,
      asset.serialNo || asset.code || "No code"
    ].filter(Boolean).join(" / ")),
    deleteValue: `assets:${escapeHtml(asset.id)}:${escapeHtml(asset.name)}`
  }), masterSearchTerm("assets") ? "No assets match this search." : "No assets yet.");

  renderMasterList("#technicianMasterBoard", state.technicians.map((tech) => masterListItem(tech, [tech.name, tech.skill, technicianSkillLabel(tech), serviceAreaLabel(tech), tech.status])), "technicians", (tech) => masterEntry({
    className: `status-${token(tech.status)}`,
    editAttr: `data-edit-technician="${escapeHtml(tech.id)}"`,
    title: escapeHtml(tech.name),
    detail: `${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(serviceAreaLabel(tech))}`,
    deleteValue: `technicians:${escapeHtml(tech.id)}:${escapeHtml(tech.name)}`
  }), masterSearchTerm("technicians") ? "No technicians match this search." : "No technicians yet.");

  renderMasterList("#peopleAccessBoard", directoryUsers.map((user) => masterListItem(user, [user.name, user.role, user.username, userOutletLabel(user), user.address])), "users", (user) => masterEntry({
    editAttr: `data-edit-user-access="${escapeHtml(user.id)}"`,
    title: `${escapeHtml(user.name)} / ${escapeHtml(user.role)}`,
    detail: `${escapeHtml(user.username)} / ${escapeHtml(userOutletLabel(user))}${user.address ? ` / ${escapeHtml(user.address)}` : ""}`,
    deleteValue: `admin/users:${escapeHtml(user.id)}:${escapeHtml(user.username)}`
  }), masterSearchTerm("users") ? "No users match this search." : "No users yet.");

  const windows = [...(state.assignmentTimeWindows || [])]
    .sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")) || String(a.name || "").localeCompare(String(b.name || "")));
  renderMasterList("#assignmentTimeBoard", windows.map((window) => masterListItem(window, [window.name, assignmentDayLabel(window.days), window.startTime, window.endTime, window.active === false ? "Paused" : "Active"])), "time", renderAssignmentTimeRow, masterSearchTerm("time") ? "No dispatch windows match this search." : "No dispatch time windows yet. Until a window is added, assignment is open all day.");
}

function renderAdmin() {
  document.querySelector("#criticalCount").textContent = state.reports.critical || 0;
  document.querySelector("#newCount").textContent = state.reports.pendingTasks || 0;
  document.querySelector("#blockedCount").textContent = state.reports.blocked || 0;
  document.querySelector("#presentCount").textContent = state.reports.open || 0;
  document.querySelector("#adminPasswordBoard").innerHTML = renderPasswordResetControl("admin", "Choose a user, set a new password, and share it privately.");

  const workload = state.reports.technicianWorkload || [];
  const today = todayInputValue();
  const openTickets = state.tickets.filter((ticket) => ticket.status !== "Closed");
  document.querySelector("#attendanceBoard").innerHTML = state.technicians.length ? state.technicians.map((tech) => {
    const techLoad = workload.find((item) => item.id === tech.id)?.openTickets || 0;
    const statusClass = `status-${token(tech.status)}`;
    const activePlan = tech.activeAttendancePlan;
    const nextPlan = (tech.attendancePlans || []).find((plan) => plan.id !== activePlan?.id);
    const availability = ["Present", "Emergency Available"].includes(tech.status)
      ? "Available"
      : tech.status === "Busy"
        ? "Busy"
        : "Unavailable";
    return `
      <article class="tech-card ${statusClass}">
        <div class="tech-status-row">
          <div>
            <strong>${escapeHtml(tech.name)}</strong>
            <span>${escapeHtml(technicianSkillLabel(tech))} / ${techLoad} active</span>
            <span>Serves: ${escapeHtml(serviceAreaLabel(tech))}</span>
            ${activePlan ? `<span>Now: ${escapeHtml(activePlan.status)} / ${escapeHtml(formatDateRange(activePlan.from, activePlan.to))}</span>` : ""}
            ${nextPlan ? `<span>Next: ${escapeHtml(nextPlan.status)} / ${escapeHtml(formatDateRange(nextPlan.from, nextPlan.to))}</span>` : ""}
          </div>
          <span class="status-dot" aria-hidden="true"></span>
        </div>
        <div class="attendance-signal">
          <span>${escapeHtml(availability)}</span>
          <span>${techLoad} active jobs</span>
        </div>
        <select class="status-select" data-tech-status="${escapeHtml(tech.id)}" aria-label="Status for ${escapeHtml(tech.name)}">
          ${["Present", "Busy", "Break", "On Leave", "Absent", "Off Duty", "Emergency Available"].map((status) => (
            `<option ${tech.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`
          )).join("")}
        </select>
      </article>
    `;
  }).join("") : `<div class="empty">No technicians found.</div>`;

  document.querySelector("#adminTechnicianDashboard").innerHTML = state.technicians.length
    ? state.technicians.map((tech) => {
      const techTickets = (stateIndex.ticketsByTechnicianId.get(tech.id) || []).filter((ticket) => ticket.status !== "Closed");
      const techTasks = stateIndex.tasksByTechnicianId.get(tech.id) || [];
      const todayTasks = techTasks.filter((task) => task.date === today);
      const doneTasks = todayTasks.filter((task) => task.status === "Done").length;
      const pendingTasks = todayTasks.filter((task) => task.status === "Pending").length;
      const notDoneTasks = todayTasks.filter((task) => task.status === "Not Done").length;
      const blockedTickets = techTickets.filter((ticket) => ticket.status === "Blocked").length;
      const nextTicket = techTickets.find((ticket) => ["Assigned", "Acknowledged", "In Progress", "Blocked"].includes(ticket.status));
      const nextTask = todayTasks.find((task) => task.status !== "Done");
      const nextWork = nextTask
        ? `${nextTask.title} / ${nextTask.asset?.name || "Asset"}`
        : nextTicket
          ? `${nextTicket.id} / ${nextTicket.note}`
          : "No active work";
      const completion = todayTasks.length ? Math.round((doneTasks / todayTasks.length) * 100) : 100;
      const capacityScore = techTickets.length + pendingTasks + notDoneTasks + (blockedTickets * 2);
      const capacityState = blockedTickets
        ? "Blocked load"
        : token(tech.status) === "present" && capacityScore <= 1
          ? "Ready"
          : capacityScore >= 4
            ? "High load"
            : "Steady";
      const capacityClass = token(capacityState);

      return `
        <article class="admin-tech-card status-${token(tech.status)} capacity-${capacityClass}">
          <div class="admin-tech-top">
            <div>
              <strong>${escapeHtml(tech.name)}</strong>
              <span>${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(tech.status)}</span>
            </div>
            <span class="badge capacity-badge">${escapeHtml(capacityState)}</span>
          </div>
          <div class="admin-tech-load">
            <span><strong>${techTickets.length}</strong><small>active tickets</small></span>
            <span><strong>${pendingTasks + notDoneTasks}</strong><small>open tasks</small></span>
            <span><strong>${completion}%</strong><small>checklist</small></span>
          </div>
          <div class="admin-tech-stats">
            <span><strong>${doneTasks}</strong><small>done</small></span>
            <span><strong>${pendingTasks}</strong><small>pending</small></span>
            <span><strong>${notDoneTasks}</strong><small>not done</small></span>
            <span><strong>${techTickets.length}</strong><small>tickets</small></span>
            <span><strong>${blockedTickets}</strong><small>blocked</small></span>
          </div>
          <p class="admin-tech-next">Next: ${escapeHtml(nextWork)}</p>
          <div class="mini-progress" aria-label="Checklist progress">
            <span style="width: ${completion}%"></span>
          </div>
        </article>
      `;
    }).join("")
    : `<div class="empty">No technicians found.</div>`;

  const adminScheduled = document.querySelector("#adminScheduledJobs");
  if (adminScheduled) {
    const tasks = scheduledTasksForScope("admin");
    const done = tasks.filter((task) => task.status === "Done").length;
    adminScheduled.innerHTML = `
      <div class="queue-summary-strip">
        <span>${tasks.length} today</span>
        <span>${done} done</span>
        <span>${tasks.filter((task) => task.status === "Pending").length} pending</span>
        <span>${tasks.filter((task) => task.status === "Not Done").length} not done</span>
      </div>
      <div class="technician-task-list">${scheduledTaskRows(tasks)}</div>
    `;
  }

  const adminTicketSearchTerm = adminQueueSearch.trim().toLowerCase();
  const filteredOpenTickets = adminTicketSearchTerm
    ? openTickets.filter((ticket) => [
      ticket.id,
      ticket.outlet,
      ticket.note,
      ticket.status,
      ticket.priority,
      ticketCategoryLabel(ticket),
      technicianById(ticket.assignedTo)?.name
    ].some((value) => String(value || "").toLowerCase().includes(adminTicketSearchTerm)))
    : openTickets;
  document.querySelector("#adminTickets").innerHTML = openTickets.length
    ? `
      <div class="queue-tools admin-queue-tools">
        <label>
          <span>Search queue</span>
          <input data-admin-queue-search value="${escapeHtml(adminQueueSearch)}" placeholder="Ticket, outlet, category, technician">
        </label>
        <span>${filteredOpenTickets.length}/${openTickets.length} shown</span>
      </div>
      ${filteredOpenTickets.length ? renderAdminTicketQueue(filteredOpenTickets) : `<div class="empty">No admin tickets match this search.</div>`}
    `
    : `<div class="empty">The admin queue is clear.</div>`;
}

function renderAdminTicketQueue(tickets) {
  const groups = [
    ["Critical Unassigned", "P1 tickets waiting for dispatch"],
    ["Blocked", "Parts, vendor, or decision needed"],
    ["Ready for Verification", "Resolved work waiting for manager approval"],
    ["Unassigned", "New tickets waiting for assignment"],
    ["Critical Assigned", "P1 tickets already with technicians"],
    ["Assigned", "Active technician work"]
  ];
  const sortedTickets = [...tickets].sort(adminTicketSort);

  return groups
    .map(([name, subtitle]) => {
      const groupTickets = sortedTickets.filter((ticket) => ticketAdminBucket(ticket) === name);
      if (!groupTickets.length) return "";
      return `
        <section class="ticket-queue-group">
          <div class="queue-group-heading">
            <div>
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(subtitle)}</span>
            </div>
            <span class="badge">${groupTickets.length}</span>
          </div>
          <div class="queue-summary-strip">
            <span>${groupTickets.filter((ticket) => !ticket.assignedTo).length} unassigned</span>
            <span>${groupTickets.filter((ticket) => ticket.priority === "P1").length} critical</span>
            <span>${groupTickets.filter((ticket) => ticket.status === "Blocked").length} blocked</span>
          </div>
          <div class="queue-group-list">
            ${groupTickets.map((ticket) => ticketCard(ticket, "admin")).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderMaintenanceScheduler() {
  const rules = state.maintenanceRules || [];
  const activeRules = rules.filter((rule) => rule.active !== false);
  const tomorrow = addDaysInputValue(1);
  const previewRules = activeRules.filter((rule) => isMaintenanceRuleDueOn(rule, tomorrow));

  document.querySelector("#maintenanceRulesBoard").innerHTML = rules.length
    ? rules.map((rule) => {
      const timeLabel = rule.allowOutsideWindow ? "All day" : `${escapeHtml(rule.startTime || "?")} - ${escapeHtml(rule.endTime || "?")}`;
      const reminderLabel = rule.reminderDays ? `${escapeHtml(rule.reminderDays)}d reminder` : "No reminder";
      const assignmentCount = assignmentListForRule(rule).length;
      return `
      <article class="rule-row scheduler-rule-card ${rule.active === false ? "is-paused" : "is-active-rule"}">
        <div class="rule-main">
          <div class="rule-title-row">
            <strong>${escapeHtml(rule.title)}</strong>
            <span class="rule-state">${rule.active === false ? "Paused" : "Active"}</span>
          </div>
          <span class="rule-meta">${escapeHtml(rule.outlet || "All outlets")} / ${escapeHtml(rule.category)} / ${escapeHtml(maintenanceRuleTechnicianLabel(rule))}</span>
          <div class="rule-chip-row">
            <span>${timeLabel}</span>
            <span>${escapeHtml(scheduleLabel(rule))}</span>
            <span>${reminderLabel}</span>
            <span>${assignmentCount || 1} outlet${(assignmentCount || 1) === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div class="rule-actions">
          <button class="small-button" data-edit-rule="${escapeHtml(rule.id)}">Edit</button>
          <button class="small-button ${rule.active === false ? "success" : "warning"}" data-rule-toggle="${escapeHtml(rule.id)}:${rule.active === false ? "true" : "false"}">
            ${rule.active === false ? "Enable" : "Pause"}
          </button>
          <button class="small-button danger" data-delete-rule="${escapeHtml(rule.id)}" data-delete-rule-title="${escapeHtml(rule.title)}">Delete</button>
        </div>
      </article>`;
    }).join("")
    : `<div class="empty mini">No scheduler rules yet.</div>`;

  const preview = [];
  const previewLoad = new Map((state.technicians || []).map((tech) => [
    tech.id,
    (state.tasks || []).filter((task) => task.date === tomorrow && task.assignedTo === tech.id).length
  ]));
  const previewTechnicians = [...(state.technicians || [])].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const pickPreviewTechnician = (outlet) => previewTechnicians
    .filter((tech) => technicianCoversOutlet(tech, outlet))
    .reduce((selected, tech) => {
      if (!selected) return tech;
      const selectedLoad = previewLoad.get(selected.id) || 0;
      const techLoad = previewLoad.get(tech.id) || 0;
      if (techLoad < selectedLoad) return tech;
      if (techLoad === selectedLoad && String(tech.name).localeCompare(String(selected.name)) < 0) return tech;
      return selected;
    }, null);

  state.outlets.forEach((outlet) => {
    const outletAssets = (state.assets || []).filter((asset) => asset.status === "Active" && asset.outlet === outlet);
    previewRules.forEach((rule) => {
      const asset = outletAssets.find((item) => item.category === rule.category) || outletAssets[0];
      const assignment = assignmentListForRule(rule).find((item) => item.outlet === outlet);
      if (!assignment) return;
      const assignedTechnicianId = assignment.assignedTechnicianId || rule.assignedTechnicianId || "";
      const assignedTechnician = assignedTechnicianId
        ? previewTechnicians.find((tech) => tech.id === assignedTechnicianId)
        : null;
      const technician = assignedTechnician || pickPreviewTechnician(outlet);
      if (!asset || !technician) return;
      preview.push({ rule, outlet, asset, technician });
      previewLoad.set(technician.id, (previewLoad.get(technician.id) || 0) + 1);
    });
  });

  document.querySelector("#maintenancePreviewBoard").innerHTML = preview.length
    ? preview.slice(0, 12).map((item) => {
      const timeLabel = item.rule.allowOutsideWindow ? "All day" : `${item.rule.startTime || "?"} - ${item.rule.endTime || "?"}`;
      return `
      <article class="rule-row scheduler-preview-card">
        <div class="rule-main">
          <div class="rule-title-row">
            <strong>${escapeHtml(item.rule.title)}</strong>
            <span class="rule-state">Tomorrow</span>
          </div>
          <span class="rule-meta">${escapeHtml(item.outlet)} / ${escapeHtml(item.asset.name)} / ${escapeHtml(item.technician.name)}</span>
          <div class="rule-chip-row">
            <span>${escapeHtml(timeLabel)}</span>
            <span>${escapeHtml(scheduleLabel(item.rule))}</span>
          </div>
        </div>
      </article>`;
    }).join("") + (preview.length > 12 ? `<div class="empty mini">${preview.length - 12} more tasks will generate.</div>` : "")
    : `<div class="empty mini">No task will generate tomorrow from active rules.</div>`;
  renderRuleAssignmentsBoard();
}
function closeAssetDetail() {
  document.querySelector("#assetDetailOverlay")?.classList.add("is-hidden");
}

function openAssetDetail(assetId) {
  const asset = assetById(assetId);
  const overlay = document.querySelector("#assetDetailOverlay");
  const content = document.querySelector("#assetDetailContent");
  if (!asset || !overlay || !content) return;

  const assetTickets = ticketsForAsset(asset.id).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const assetTasks = tasksForAsset(asset.id).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const openTickets = assetTickets.filter((ticket) => ticket.status !== "Closed");
  const today = todayInputValue();
  const todayTasks = assetTasks.filter((task) => task.date === today);
  const doneTasks = todayTasks.filter((task) => task.status === "Done");
  const photos = assetTickets.filter((ticket) => ticket.photoUrl);
  const technicians = assetCurrentTechnicians(asset.id);
  const historyItems = [
    ...assetTasks
      .filter((task) => ["Done", "Not Done"].includes(task.status))
      .map((task) => ({
        at: task.completedAt || task.date,
        title: task.title,
        detail: `${technicianById(task.assignedTo)?.name || "Technician"} ${task.status === "Done" ? "completed checklist" : "marked not done"}`
      })),
    ...assetTickets.flatMap((ticket) => (ticket.history || []).map((item) => ({
      at: item.at || ticket.createdAt,
      title: `${ticket.id} ${ticket.note}`,
      detail: item.action
    })))
  ].sort((a, b) => String(b.at || "").localeCompare(String(a.at || ""))).slice(0, 8);

  content.innerHTML = `
    <header class="asset-detail-header">
      <div>
        <span class="section-kicker">${escapeHtml(asset.outlet)} / ${escapeHtml(asset.category)}</span>
        <h2 id="assetDetailTitle">${escapeHtml(asset.name)}</h2>
        <p>${escapeHtml(asset.code || "No asset code")} / ${escapeHtml(asset.status || "Active")}</p>
      </div>
      <div class="asset-detail-stats">
        <article><strong>${openTickets.length}</strong><span>open tickets</span></article>
        <article><strong>${doneTasks.length}/${todayTasks.length || 0}</strong><span>today tasks</span></article>
        <article><strong>${photos.length}</strong><span>issue photos</span></article>
      </div>
    </header>

    <div class="asset-detail-grid">
      <section class="asset-detail-section">
        <div class="mini-heading">
          <span class="section-kicker">Open Issues</span>
          <strong>${openTickets.length ? "Needs attention" : "Clear"}</strong>
        </div>
        <div class="asset-mini-list">
          ${openTickets.length ? openTickets.map((ticket) => `
            <article class="asset-mini-row priority-${token(ticket.priority)}">
              <strong>${escapeHtml(ticket.id)} ${escapeHtml(ticket.note)}</strong>
              <span>${escapeHtml(ticket.status)} / ${escapeHtml(technicianById(ticket.assignedTo)?.name || "Unassigned")} / ${escapeHtml(PRIORITY_LABELS[ticket.priority] || ticket.priority)}</span>
              ${ticket.photoUrl ? `<button type="button" class="small-button" data-photo-open="${escapeHtml(ticket.id)}">Open Photo</button>` : ""}
            </article>
          `).join("") : `<div class="empty mini">No open issue ticket for this asset.</div>`}
        </div>
      </section>

      <section class="asset-detail-section">
        <div class="mini-heading">
          <span class="section-kicker">Today Checklist</span>
          <strong>${doneTasks.length}/${todayTasks.length || 0} done</strong>
        </div>
        <div class="asset-mini-list">
          ${todayTasks.length ? todayTasks.map((task) => `
            <article class="asset-mini-row status-${token(task.status)}">
              <strong>${escapeHtml(task.title.replace(`${taskPhase(task.title)}: `, ""))}</strong>
              <span>${escapeHtml(task.status)} / ${escapeHtml(technicianById(task.assignedTo)?.name || "Technician")}${task.evidencePhotoUrl || task.evidenceComment ? " / evidence attached" : taskRequiresEvidence(task) ? " / photo required" : ""}</span>
              ${task.status === "Not Done" && task.evidenceComment ? `<span>${escapeHtml(task.evidenceComment)}</span>` : ""}
              ${task.evidencePhotoUrl ? `<button type="button" class="small-button" data-task-photo="${escapeHtml(task.id)}">Open Evidence</button>` : ""}
            </article>
          `).join("") : `<div class="empty mini">No checklist task for this asset today.</div>`}
        </div>
      </section>

      <section class="asset-detail-section">
        <div class="mini-heading">
          <span class="section-kicker">Current Owner</span>
          <strong>${technicians.length ? "Assigned" : "No active owner"}</strong>
        </div>
        <div class="asset-mini-list">
          ${technicians.length ? technicians.map((tech) => `
            <article class="asset-mini-row status-${token(tech.status)}">
              <strong>${escapeHtml(tech.name)}</strong>
              <span>${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(tech.status)} / ${escapeHtml(serviceAreaLabel(tech))}</span>
            </article>
          `).join("") : `<div class="empty mini">No technician currently owns this asset work.</div>`}
        </div>
      </section>

      <section class="asset-detail-section">
        <div class="mini-heading">
          <span class="section-kicker">Maintenance History</span>
          <strong>Latest ${historyItems.length}</strong>
        </div>
        <div class="asset-mini-list history-list">
          ${historyItems.length ? historyItems.map((item) => `
            <article class="asset-mini-row">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.detail)} / ${escapeHtml(formatDateTime(item.at))}</span>
            </article>
          `).join("") : `<div class="empty mini">No history yet for this asset.</div>`}
        </div>
      </section>
    </div>
  `;

  overlay.classList.remove("is-hidden");
}

function historyScopeLabel() {
  if (currentUser?.role === "admin") return "All outlets and technicians";
  if (currentUser?.role === "manager") return userOutletLabel(currentUser);
  if (currentUser?.role === "technician") return technicianById(currentUser.technicianId)?.name || "My closed jobs";
  return "Closed tickets";
}

function userById(userId) {
  return directoryUsers.find((user) => user.id === userId);
}

function closedTicketManager(ticket) {
  const creator = userById(ticket.createdBy);
  if (creator?.role === "manager") return creator.name;
  const outletManager = directoryUsers.find((user) => user.role === "manager" && outletAccessForUser(user).includes(ticket.outlet));
  return outletManager?.name || creator?.name || "Not recorded";
}

function formatDurationBetween(start, end) {
  const started = new Date(start || 0);
  const ended = new Date(end || 0);
  if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime()) || ended < started) return "Not recorded";
  const minutes = Math.max(1, Math.round((ended - started) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function closedHistoryCard(ticket) {
  const assigned = technicianById(ticket.assignedTo);
  const asset = assetById(ticket.assetId);
  const closedTime = closedAt(ticket);
  const duration = formatDurationBetween(ticket.createdAt, closedTime);
  const problem = ticket.note || ticket.latestDetail || "Maintenance request";
  const category = ticketCategoryLabel(ticket);
  const fullCard = ticketCard(ticket, currentUser?.role === "admin" ? "admin" : "archive");

  return `
    <details class="closed-history-card">
      <summary class="closed-history-summary">
        <div class="closed-history-problem">
          <span class="section-kicker">${escapeHtml(ticket.id)}</span>
          <strong>${escapeHtml(problem)}</strong>
          <small>${escapeHtml(category)} / ${escapeHtml(asset?.name || "General repair")}</small>
        </div>
        <div class="closed-history-facts" aria-label="Closed ticket summary">
          <span><b>Manager</b>${escapeHtml(closedTicketManager(ticket))}</span>
          <span><b>Outlet</b>${escapeHtml(ticket.outlet || "Not recorded")}</span>
          <span><b>Technician</b>${escapeHtml(assigned?.name || "Unassigned")}</span>
          <span><b>Price</b>${escapeHtml(Number(ticket.closePrice || 0) > 0 ? formatClosePrice(ticket.closePrice) : "Not priced")}</span>
          <span><b>Time</b>${escapeHtml(duration)}</span>
        </div>
        <span class="closed-history-toggle">View full</span>
      </summary>
      <div class="closed-history-detail">
        ${fullCard}
      </div>
    </details>
  `;
}

function renderClosedHistory() {
  const closedTickets = ticketsForCurrentUser(state.tickets)
    .filter((ticket) => ticket.status === "Closed")
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  const searchTerm = historySearch.trim().toLowerCase();
  const visibleClosedTickets = searchTerm
    ? closedTickets.filter((ticket) => {
      const assigned = technicianById(ticket.assignedTo);
      const asset = assetById(ticket.assetId);
      return [
        ticket.id,
        ticket.outlet,
        ticket.note,
        ticket.latestDetail,
        ticketCategoryLabel(ticket),
        asset?.name,
        assigned?.name,
        closedTicketManager(ticket),
        ticket.closePrice
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
    })
    : closedTickets;
  const withCompletionPhotos = closedTickets.filter((ticket) => (ticket.resolutionPhotoUrls || []).length).length;
  const withIssuePhotos = closedTickets.filter((ticket) => (ticket.photoUrls?.length ? ticket.photoUrls : [ticket.photoUrl]).filter(Boolean).length).length;

  document.querySelector("#historyTitle").textContent = currentUser?.role === "technician" ? "My Closed Jobs" : "Closed Ticket History";
  document.querySelector("#historyScope").textContent = historyScopeLabel();
  document.querySelector("#historyStats").innerHTML = [
    ["Closed", closedTickets.length, "Approved completed tickets"],
    ["Completion Photos", withCompletionPhotos, "Technician proof attached"],
    ["Issue Photos", withIssuePhotos, "Original issue photo attached"]
  ].map(([label, value, detail]) => `
    <article class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `).join("");
  document.querySelector("#closedTicketHistory").innerHTML = closedTickets.length
    ? `
      <div class="queue-tools history-tools">
        <label>
          <span>Search archive</span>
          <input data-history-search value="${escapeHtml(historySearch)}" placeholder="Ticket, outlet, category, technician, price">
        </label>
        <span>${visibleClosedTickets.length}/${closedTickets.length} shown</span>
      </div>
      ${visibleClosedTickets.length ? visibleClosedTickets.map((ticket) => closedHistoryCard(ticket)).join("") : `<div class="empty">No closed tickets match this search.</div>`}
    `
    : `<div class="empty">No closed tickets found for this login.</div>`;
}

function renderTechnician() {
  const activeId = currentUser?.technicianId || document.querySelector("#activeTechnician").value || state.technicians[0]?.id;
  const activeTech = technicianById(activeId);
  const dashboard = document.querySelector("#technicianDashboard");
  const ticketTools = document.querySelector("#technicianAttendanceTools");
  const ticketBoard = document.querySelector("#technicianTickets");
  const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 };
  const statusRank = {
    Assigned: 1,
    Acknowledged: 2,
    "In Progress": 3,
    Blocked: 4,
    Reopened: 5,
    Resolved: 6,
    "Verification Pending": 7,
    Closed: 8
  };
  const tickets = activeTech
    ? state.tickets
      .filter((ticket) => (ticket.assignedTo === activeTech.id || ticket.createdBy === currentUser?.id) && ticket.status !== "Cancelled" && isTicketReleased(ticket))
      .sort((a, b) => (statusRank[a.status] || 9) - (statusRank[b.status] || 9)
        || (priorityRank[a.priority] || 9) - (priorityRank[b.priority] || 9)
        || String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
    : [];
  const activeTickets = tickets.filter((ticket) => ["New", "Assigned", "Acknowledged", "Reopened"].includes(ticket.status));
  const runningTickets = tickets.filter((ticket) => ticket.status === "In Progress");
  const blockedTickets = tickets.filter((ticket) => ticket.status === "Blocked");
  const doneTickets = tickets.filter((ticket) => ["Resolved", "Verification Pending", "Closed"].includes(ticket.status));
  const liveTickets = tickets.filter((ticket) => ["New", "Assigned", "Acknowledged", "In Progress", "Blocked", "Reopened"].includes(ticket.status));
  const today = todayInputValue();
  const todayTasks = activeTech
    ? (state.tasks || [])
      .filter((task) => task.assignedTo === activeTech.id && task.date === today)
      .sort((a, b) => (a.status === "Done") - (b.status === "Done")
        || taskPhaseRank(a.title) - taskPhaseRank(b.title)
        || String(a.title || "").localeCompare(String(b.title || "")))
    : [];
  const doneTasks = todayTasks.filter((task) => task.status === "Done");

  dashboard.innerHTML = activeTech ? `
    <div class="technician-simple-dashboard">
      ${[
        ["Active", activeTickets.length],
        ["Running", runningTickets.length],
        ["Blocked", blockedTickets.length],
        ["Done", doneTickets.length],
        ["Jobs", todayTasks.length ? `${doneTasks.length}/${todayTasks.length}` : "0/0"]
      ].map(([label, count]) => `
        <article class="technician-simple-stat status-${token(label)}">
          <span>${escapeHtml(label)}</span>
          <strong>${count}</strong>
        </article>
      `).join("")}
    </div>
  ` : `<div class="empty">No technician selected.</div>`;

  ticketTools.innerHTML = activeTech ? `
    <div class="technician-ticket-panel">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">Field Support</span>
          <h2>Raise Field Ticket</h2>
        </div>
        <span class="heading-chip">Self assigned</span>
      </div>
      <form id="technicianTicketForm" class="ticket-form technician-ticket-form">
        <label>
          Outlet
          <select id="technicianTicketOutlet" required>
            ${(activeTech.serviceOutlets || state.outlets).map((outlet) => `<option value="${escapeHtml(outlet)}">${escapeHtml(outlet)}</option>`).join("")}
          </select>
        </label>
        <label>
          Category
          <select id="technicianTicketCategory" required>
            ${(state.categories || []).map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`).join("")}
          </select>
        </label>
        <label>
          Impact
          <select id="technicianTicketImpact" required>
            <option value="Normal repair">Normal repair</option>
            <option value="Service stopped">Service stopped</option>
            <option value="Food safety risk">Food safety risk</option>
            <option value="Customer visible">Customer visible</option>
            <option value="Cosmetic">Cosmetic</option>
          </select>
        </label>
        <label>
          Issue details
          <input id="technicianTicketNote" required placeholder="Example: Valve leaking after service">
        </label>
        <label class="photo-upload">
          Issue photos
          <input id="technicianTicketPhotos" type="file" accept="image/*" multiple>
        </label>
        <button type="submit" class="primary-button">Create Ticket</button>
        <p id="technicianTicketResult" class="form-hint" aria-live="polite"></p>
      </form>
    </div>
  ` : "";

  const scheduledJobs = activeTech ? `
    <section class="technician-job-section">
      <div class="mini-heading">
        <span class="section-kicker">Scheduled Jobs</span>
        <strong>${escapeHtml(doneTasks.length)}/${escapeHtml(todayTasks.length || 0)} done today</strong>
      </div>
      <div class="technician-task-list">
        ${todayTasks.length ? todayTasks.map((task) => {
          return scheduledTaskRows([task], { allowActions: true });
        }).join("") : `<div class="empty">No scheduled jobs for today.</div>`}
      </div>
    </section>
  ` : "";

  const ticketJobs = activeTech ? `
    <section class="technician-job-section">
      <div class="mini-heading">
        <span class="section-kicker">Repair Tickets</span>
        <strong>${escapeHtml(liveTickets.length)} active</strong>
      </div>
      ${liveTickets.length
        ? liveTickets.map((ticket) => ticketCard(ticket, "technician")).join("")
        : `<div class="empty">No active tickets right now.</div>`}
    </section>
  ` : "";

  const evidenceJobs = activeTech ? `
    <section class="technician-job-section technician-evidence-section">
      <div class="mini-heading">
        <span class="section-kicker">Evidence Submitted</span>
        <strong>${escapeHtml(doneTickets.length)} ready for review</strong>
      </div>
      ${doneTickets.length
        ? doneTickets.slice(0, 4).map((ticket) => ticketCard(ticket, "technician")).join("")
        : `<div class="empty">Completed tickets with proof will appear here after submission.</div>`}
    </section>
  ` : "";

  ticketBoard.innerHTML = activeTech
    ? scheduledJobs + ticketJobs + evidenceJobs
    : "";
}

function ticketsByStatus(status) {
  return state.tickets.filter((ticket) => ticket.status === status).length;
}

function ticketsByStatuses(statuses) {
  return state.tickets.filter((ticket) => statuses.includes(ticket.status)).length;
}

function scopedTasks() {
  if (currentUser?.role === "manager") {
    const outlets = outletAccessForUser(currentUser);
    return (state.tasks || []).filter((task) => outlets.includes(task.outlet));
  }
  if (currentUser?.role === "technician" && currentUser.technicianId) {
    return (state.tasks || []).filter((task) => task.assignedTo === currentUser.technicianId);
  }
  return state.tasks || [];
}

function reportCompletionRate(tasks) {
  const today = todayInputValue();
  const todayTasks = tasks.filter((task) => task.date === today);
  if (!todayTasks.length) return "100%";
  return `${Math.round((todayTasks.filter((task) => task.status === "Done").length / todayTasks.length) * 100)}%`;
}

function roleReportConfig() {
  const reports = state.reports || {};
  const scopedTickets = ticketsForCurrentUser(state.tickets);
  const openScopedTickets = scopedTickets.filter((ticket) => ticket.status !== "Closed");
  const tasks = scopedTasks();
  const assignedToMe = currentUser?.technicianId
    ? state.tickets.filter((ticket) => ticket.assignedTo === currentUser.technicianId)
    : scopedTickets;

  if (currentUser?.role === "manager") {
    const outlet = currentUser.outlet || "My outlet";
    return {
      title: `${outlet} Reports`,
      scope: "Manager needs",
      cards: [
        ["Open At Outlet", openScopedTickets.length, "Work still visible to this outlet"],
        ["Critical Risk", openScopedTickets.filter((ticket) => ticket.priority === "P1").length, "Food-safety or service-stop pressure"],
        ["Awaiting Assignment", openScopedTickets.filter((ticket) => !ticket.assignedTo).length, "Tickets admin still needs to dispatch"],
        ["Needs Verification", ticketsByStatuses(["Resolved", "Verification Pending"]), "Items waiting for manager approval"],
        ["Checklist Today", reportCompletionRate(tasks), "Daily maintenance completion"],
        ["Blocked", openScopedTickets.filter((ticket) => ticket.status === "Blocked").length, "Parts, vendor, or admin dependency"],
        ["Closed", scopedTickets.filter((ticket) => ticket.status === "Closed").length, "Approved work for this outlet"],
        ["Latest Ticket Age", scopedTickets[0] ? formatAge(scopedTickets[0].createdAt) : "None", "How fresh the current queue is"]
      ]
    };
  }

  if (currentUser?.role === "technician") {
    const myTech = technicianById(currentUser.technicianId);
    return {
      title: "My Technician Report",
      scope: "Field needs",
      cards: [
        ["My Active Jobs", assignedToMe.filter((ticket) => ticket.status !== "Closed").length, "Work assigned to this technician"],
        ["To Acknowledge", ticketsByStatus("Assigned"), "Jobs that need first response"],
        ["In Progress", ticketsByStatus("In Progress"), "Repairs currently being worked"],
        ["Checklist Today", reportCompletionRate(tasks), "Daily task completion"],
        ["Pending Tasks", tasks.filter((task) => task.date === todayInputValue() && task.status !== "Done").length, "Checklist items still open"],
        ["Blocked Jobs", assignedToMe.filter((ticket) => ticket.status === "Blocked").length, "Items needing part, vendor, or admin help"],
        ["Ready To Resolve", ticketsByStatuses(["Acknowledged", "In Progress"]), "Jobs that can move toward closure"],
        ["Closed By Me", assignedToMe.filter((ticket) => ticket.status === "Closed").length, "Completed and approved assigned jobs"],
        ["My Status", myTech?.status || "Unknown", "Attendance state used for dispatch"]
      ]
    };
  }

  if (currentUser?.role === "auditor") {
    return {
      title: "Business Review Reports",
      scope: "Audit needs",
      cards: [
        ["Total Open", reports.open || 0, "Whole-business active ticket load"],
        ["Critical Exposure", reports.critical || 0, "P1 risk count across outlets"],
        ["Blocked Exposure", reports.blocked || 0, "Work unable to move forward"],
        ["Reopened", reports.reopened || 0, "Fixes that failed verification"],
        ["Closed Tickets", reports.closed || 0, "Completed work volume"],
        ["Unassigned Queue", reports.unassigned || 0, "Dispatch process delay"],
        ["Tech Coverage", `${reports.presentTechnicians || 0}/${reports.technicianCount || 0}`, "Attendance capacity snapshot"],
        ["Alert Count", reports.alerts?.length || 0, "Items requiring management attention"]
      ]
    };
  }

  return {
    title: "Admin Control Reports",
    scope: "Command needs",
    cards: [
      ["Open Tickets", reports.open || 0, "Active work across outlets"],
      ["Blocked Tickets", reports.blocked || 0, "Admin action required"],
      ["Reopened Tickets", reports.reopened || 0, "Review loop pressure"],
      ["Present Technicians", reports.presentTechnicians || 0, "Available attendance"],
      ["Critical Tickets", reports.critical || 0, "P1 operational risk"],
      ["Checklist Today", `${reports.taskCompletionRate || 0}%`, "Daily maintenance completion"],
      ["Unassigned Tickets", reports.unassigned || 0, "Dispatch backlog"],
      ["Attendance Coverage", `${reports.presentTechnicians || 0}/${reports.technicianCount || 0}`, "Ready capacity"],
      ["Avg Closure", `${reports.avgClosureHours || 0}h`, "Approved ticket cycle time"]
    ]
  };
}

function renderAnalyticsContent(period) {
  const msMap = { "7d": 7 * 86400000, "30d": 30 * 86400000, "90d": 90 * 86400000 };
  const cutoff = msMap[period] ? Date.now() - msMap[period] : 0;

  const allTickets = ticketsForCurrentUser(state.tickets);
  const filtered = cutoff
    ? allTickets.filter((t) => new Date(t.createdAt || 0).getTime() >= cutoff)
    : allTickets;
  const closed = filtered.filter((t) => t.status === "Closed");

  const totalCount = filtered.length;
  const closedCount = closed.length;
  const pctClosed = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

  const periodLabel = { "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days", "all": "All Time" }[period] || period;

  const outletNames = [...new Set(allTickets.map((t) => t.outlet))].filter(Boolean).sort();
  const outletRows = outletNames.map((name) => {
    const total = filtered.filter((t) => t.outlet === name).length;
    const outletClosed = closed.filter((t) => t.outlet === name).length;
    const price = closed
      .filter((t) => t.outlet === name && Number(t.closePrice || 0) > 0)
      .reduce((s, t) => s + Number(t.closePrice || 0), 0);
    return { name, total, closed: outletClosed, price };
  }).filter((o) => o.total > 0).sort((a, b) => b.total - a.total);
  const maxOutlet = Math.max(...outletRows.map((o) => o.total), 1);

  const priorityRows = [
    { key: "P1", label: "Critical", color: "red" },
    { key: "P2", label: "High", color: "orange" },
    { key: "P3", label: "Standard", color: "teal" },
    { key: "P4", label: "Low", color: "muted" }
  ].map((p) => ({ ...p, count: filtered.filter((t) => t.priority === p.key).length }))
   .filter((p) => p.count > 0);
  const maxPri = Math.max(...priorityRows.map((p) => p.count), 1);

  const techRows = (state.technicians || []).map((tech) => {
    const active = filtered.filter((t) => t.assignedTo === tech.id && t.status !== "Closed").length;
    const done = closed.filter((t) => t.assignedTo === tech.id).length;
    return { name: tech.name, active, done, total: active + done };
  }).filter((t) => t.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
  const maxTech = Math.max(...techRows.map((t) => t.total), 1);

  const catMap = {};
  filtered.forEach((t) => { if (t.category) catMap[t.category] = (catMap[t.category] || 0) + 1; });
  const catRows = Object.entries(catMap).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCat = Math.max(...catRows.map((c) => c.count), 1);

  const sparkDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    const count = allTickets.filter((t) => (t.createdAt || "").startsWith(key)).length;
    sparkDays.push({ key, label: dayLabel, count });
  }
  const maxSpark = Math.max(...sparkDays.map((d) => d.count), 1);

  const totalPrice = closed.reduce((s, t) => s + Number(t.closePrice || 0), 0);
  const priceOutlets = outletRows.filter((o) => o.price > 0).sort((a, b) => b.price - a.price);
  const maxPrice = Math.max(...priceOutlets.map((o) => o.price), 1);

  return `
    <div class="analytics-section">
      <div class="analytics-filter-bar">
        <span class="section-kicker">Analytics Period</span>
        ${["7d", "30d", "90d", "all"].map((p) => `
          <button class="analytics-period-btn${period === p ? " is-active" : ""}" data-analytics-period="${p}">
            ${p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "All Time"}
          </button>
        `).join("")}
        <span class="analytics-tally">${totalCount} tickets &bull; ${pctClosed}% closed</span>
      </div>

      <div class="analytics-grid">

        <section class="analytics-panel analytics-panel--wide">
          <div class="analytics-panel-head">
            <span class="section-kicker">Activity</span>
            <strong>Tickets Opened — Last 7 Days</strong>
          </div>
          <div class="spark-row">
            ${sparkDays.map((d) => `
              <div class="spark-col">
                <div class="spark-track">
                  <div class="spark-bar" style="height:${Math.round((d.count / maxSpark) * 100)}%"></div>
                </div>
                <span class="spark-label">${escapeHtml(d.label)}</span>
                ${d.count > 0 ? `<span class="spark-value">${d.count}</span>` : ""}
              </div>
            `).join("")}
          </div>
        </section>

        ${outletRows.length ? `
        <section class="analytics-panel analytics-panel--wide">
          <div class="analytics-panel-head">
            <span class="section-kicker">Outlets</span>
            <strong>Ticket Volume by Outlet — ${escapeHtml(periodLabel)}</strong>
          </div>
          <div class="bar-chart">
            ${outletRows.map((o) => `
              <div class="bar-row">
                <span class="bar-label">${escapeHtml(o.name)}</span>
                <div class="bar-track">
                  <div class="bar-fill bar-fill--teal" style="width:${Math.round((o.total / maxOutlet) * 100)}%"></div>
                </div>
                <span class="bar-value">${o.total} <small>${o.closed} closed</small></span>
              </div>
            `).join("")}
          </div>
        </section>
        ` : ""}

        ${priorityRows.length ? `
        <section class="analytics-panel">
          <div class="analytics-panel-head">
            <span class="section-kicker">Risk</span>
            <strong>Priority Distribution</strong>
          </div>
          <div class="bar-chart">
            ${priorityRows.map((p) => `
              <div class="bar-row">
                <span class="bar-label">${escapeHtml(p.label)}</span>
                <div class="bar-track">
                  <div class="bar-fill bar-fill--${p.color}" style="width:${Math.round((p.count / maxPri) * 100)}%"></div>
                </div>
                <span class="bar-value">${p.count}</span>
              </div>
            `).join("")}
          </div>
        </section>
        ` : ""}

        ${techRows.length ? `
        <section class="analytics-panel">
          <div class="analytics-panel-head">
            <span class="section-kicker">Team</span>
            <strong>Technician Workload</strong>
          </div>
          <div class="bar-chart">
            ${techRows.map((t) => `
              <div class="bar-row">
                <span class="bar-label">${escapeHtml(t.name.split(" ")[0])}</span>
                <div class="bar-track">
                  <div class="bar-fill bar-fill--orange" style="width:${Math.round((t.total / maxTech) * 100)}%"></div>
                </div>
                <span class="bar-value">${t.active} active, ${t.done} closed</span>
              </div>
            `).join("")}
          </div>
        </section>
        ` : ""}

        ${catRows.length ? `
        <section class="analytics-panel">
          <div class="analytics-panel-head">
            <span class="section-kicker">Issues</span>
            <strong>Top Issue Categories</strong>
          </div>
          <div class="bar-chart">
            ${catRows.map((c) => `
              <div class="bar-row">
                <span class="bar-label" title="${escapeHtml(c.name)}">${escapeHtml(c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name)}</span>
                <div class="bar-track">
                  <div class="bar-fill bar-fill--teal" style="width:${Math.round((c.count / maxCat) * 100)}%"></div>
                </div>
                <span class="bar-value">${c.count}</span>
              </div>
            `).join("")}
          </div>
        </section>
        ` : ""}

        ${priceOutlets.length ? `
        <section class="analytics-panel">
          <div class="analytics-panel-head">
            <span class="section-kicker">Revenue</span>
            <strong>Close Value by Outlet</strong>
            <span class="analytics-total">${escapeHtml(formatClosePrice(totalPrice))} total</span>
          </div>
          <div class="bar-chart">
            ${priceOutlets.map((o) => `
              <div class="bar-row">
                <span class="bar-label">${escapeHtml(o.name)}</span>
                <div class="bar-track">
                  <div class="bar-fill bar-fill--purple" style="width:${Math.round((o.price / maxPrice) * 100)}%"></div>
                </div>
                <span class="bar-value">${escapeHtml(formatClosePrice(o.price))}</span>
              </div>
            `).join("")}
          </div>
        </section>
        ` : ""}

      </div>
    </div>
  `;
}

function renderReports() {
  const config = roleReportConfig();
  document.querySelector("#reportsTitle").textContent = config.title;
  document.querySelector("#reportsScope").textContent = config.scope;
  document.querySelector("#reportExportActions").innerHTML = currentUser?.role === "admin" ? `
    <input id="backupMonth" type="month" value="${escapeHtml(todayInputValue().slice(0, 7))}" aria-label="Backup month">
    <button class="small-button primary" data-monthly-backup>Download Monthly Backup</button>
    <button class="small-button" data-load-backup-report>Load Backup Report</button>
    <input id="backupReportFile" class="is-hidden" type="file" accept="application/json,.json">
    <button class="small-button primary" data-export-report="tasks">Export Tasks CSV</button>
    <button class="small-button primary" data-export-report="tickets">Export Tickets CSV</button>
    <button class="small-button primary" data-export-report="technicians">Export Technicians CSV</button>
    <button class="small-button primary" data-export-report="outlets">Export Outlets CSV</button>
  ` : "";

  document.querySelector("#reportsBoard").innerHTML = `
    <div class="report-card-grid">
      ${config.cards.map(([label, value, detail]) => `
        <article class="report-card">
          <div>
            <strong>${escapeHtml(value)}</strong>
            <span>${escapeHtml(label)}</span>
          </div>
          <span>${escapeHtml(detail)}</span>
        </article>
      `).join("")}
    </div>
    ${renderReportTables()}
    <div id="backupReportBoard" class="report-grid"></div>
    ${renderAlerts()}
    <div id="analyticsSection">${renderAnalyticsContent("30d")}</div>
  `;
}

function renderReportTables() {
  const reports = state.reports || {};
  const outletRows = (reports.byOutlet || []).map((outlet) => `
    <article class="report-row">
      <strong>${escapeHtml(outlet.outlet)}</strong>
      <span>${escapeHtml(outlet.open ?? outlet.count ?? 0)} open</span>
      <span>${escapeHtml(outlet.critical || 0)} critical</span>
      <span>${escapeHtml(outlet.blocked || 0)} blocked</span>
      <span>${escapeHtml(outlet.completedTasks || 0)}/${escapeHtml((outlet.completedTasks || 0) + (outlet.pendingTasks || 0))} tasks</span>
    </article>
  `).join("");

  const techRows = (reports.technicianWorkload || []).map((tech) => `
    <article class="report-row">
      <strong>${escapeHtml(tech.name)}</strong>
      <span>${escapeHtml(tech.status)}</span>
      <span>${escapeHtml(tech.openTickets || 0)} active</span>
      <span>${escapeHtml((tech.serviceOutlets || []).join(", ") || "All outlets")}</span>
    </article>
  `).join("");

  const openTickets = ticketsForCurrentUser(state.tickets)
    .filter((ticket) => ticket.status !== "Closed")
    .sort(adminTicketSort)
    .slice(0, 6);

  const ticketRows = openTickets.map((ticket) => `
    <article class="report-row priority-${token(ticket.priority)}">
      <strong>${escapeHtml(ticket.id)}</strong>
      <span>${escapeHtml(ticket.outlet)}</span>
      <span>${escapeHtml(ticket.priority)}</span>
      <span>${escapeHtml(ticket.status)}</span>
      <span>${escapeHtml(technicianById(ticket.assignedTo)?.name || "Unassigned")}</span>
    </article>
  `).join("");

  return `
    <section class="report-table wide">
      <div class="mini-heading">
        <span class="section-kicker">Outlet Health</span>
        <strong>Open work and checklist status</strong>
      </div>
      <div class="report-row-list">${outletRows || `<div class="empty mini">No outlet data.</div>`}</div>
    </section>
    <section class="report-table">
      <div class="mini-heading">
        <span class="section-kicker">Technician Capacity</span>
        <strong>Workload snapshot</strong>
      </div>
      <div class="report-row-list">${techRows || `<div class="empty mini">No technician data.</div>`}</div>
    </section>
    <section class="report-table">
      <div class="mini-heading">
        <span class="section-kicker">Risk Queue</span>
        <strong>Top active tickets</strong>
      </div>
      <div class="report-row-list">${ticketRows || `<div class="empty mini">No active tickets.</div>`}</div>
    </section>
  `;
}

function renderPasswordResetControl(scope, helpText) {
  return `
    <div class="password-copy">
      <span class="section-kicker">Recovery</span>
      <strong>Reset user password</strong>
      <p>${escapeHtml(helpText)}</p>
    </div>
    <div class="password-stack" data-password-reset-shell>
      <form id="${escapeHtml(scope)}PasswordResetForm" class="password-form" data-password-reset-form>
        <select data-password-reset-user autocomplete="username" required>
          <option value="">Choose user</option>
          ${directoryUsers.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} / ${escapeHtml(user.role)} / ${escapeHtml(user.username)}</option>`).join("")}
        </select>
        <input data-password-reset-value type="password" autocomplete="new-password" placeholder="Optional new password, min 8 characters" minlength="8">
        <button class="small-button warning" type="submit">Reset Password</button>
      </form>
      <div class="password-safety">
        <span>Blank password auto-generates a temporary password.</span>
        <span>Share reset credentials outside the shared screen.</span>
      </div>
      <p class="password-feedback" data-password-reset-status>Leave the password field blank to auto-generate a temporary password.</p>
    </div>
  `;
}

function masterListItem(value, searchValues) {
  return { value, searchValues };
}

function renderMasterList(boardSelector, items, tabName, renderItem, emptyText) {
  const board = document.querySelector(boardSelector);
  if (!board) return;
  const filtered = items.filter((item) => masterMatchesSearch(item.searchValues || [], tabName));
  board.innerHTML = `
    <div class="master-list-summary">
      <span>${filtered.length} shown</span>
      <span>${items.length} total</span>
    </div>
    ${filtered.length ? filtered.map((item) => renderItem(item.value)).join("") : `<div class="empty mini">${escapeHtml(emptyText)}</div>`}
  `;
}

function renderSettings() {
  const allowed = allowedViews()
    .map((view) => view[0].toUpperCase() + view.slice(1))
    .join(", ");
  document.querySelector("#settingsBoard").innerHTML = `
    <article class="settings-card wide">
      <div>
        <span class="section-kicker">Signed In</span>
        <strong>${escapeHtml(currentUser?.name || "Guest")}</strong>
        <p>${escapeHtml(currentUser?.post || "No post")} / ${escapeHtml(currentUser?.username || "no username")}</p>
      </div>
      <div class="settings-actions">
        <button class="small-button primary" data-menu-action="refresh">Refresh Now</button>
        <button class="small-button" data-menu-action="logout">Logout</button>
      </div>
    </article>
    <article class="settings-card wide">
      <div class="password-copy">
        <span class="section-kicker">Security</span>
        <strong>Change password</strong>
        <p>Update your login password for both web and mobile access. Current password is required.</p>
      </div>
      <div class="password-stack">
        <form id="passwordChangeForm" class="password-form">
          <input id="passwordCurrent" type="password" autocomplete="current-password" placeholder="Current password" required>
          <input id="passwordNew" type="password" autocomplete="new-password" placeholder="New password" minlength="8" required>
          <input id="passwordConfirm" type="password" autocomplete="new-password" placeholder="Confirm new password" minlength="8" required>
          <button class="small-button primary" type="submit">Update Password</button>
        </form>
        <p class="password-feedback" id="passwordChangeStatus">Keep the new password at least 8 characters long.</p>
      </div>
    </article>
    <article class="settings-card">
      <span>Default Workspace</span>
      <strong>${escapeHtml(currentUser?.defaultView || allowedViews()[0] || "None")}</strong>
      <p>${escapeHtml(allowed || "No role views")}</p>
    </article>
    <article class="settings-card">
      <span>Storage Mode</span>
      <strong>${escapeHtml(state.storage === "supabase" ? "Supabase" : "Local JSON")}</strong>
      <p>${state.storage === "supabase" ? "Production-ready persistent database." : "Development fallback for this desktop."}</p>
    </article>
    <article class="settings-card">
      <span>Live Refresh</span>
      <strong>15 seconds</strong>
      <p>Dashboard data refreshes automatically while the app is visible.</p>
    </article>
    <article class="settings-card">
      <span>Access Scope</span>
      <strong>${escapeHtml(currentUser?.outlet || currentUser?.technicianId || "All allowed data")}</strong>
      <p>Reports and lists stay scoped to the logged-in post.</p>
    </article>
    ${currentUser?.role === "admin" ? `
      <article class="settings-card wide">
        ${renderPasswordResetControl("settings", "Use this when someone forgets a password. A temporary password can be auto-generated or set manually.")}
      </article>
    ` : ""}
    ${currentUser?.role === "admin" ? `
      <article class="settings-card danger">
        <span>Demo Data</span>
        <strong>Reset available</strong>
        <p>Only admin control panel operators can reset local demo data.</p>
        <button class="small-button warning" data-menu-action="reset">Reset Demo</button>
      </article>
    ` : ""}
  `;
}

function renderDirectory() {
  const usersByRole = ["admin", "manager", "technician"].map((role) => [
    role,
    directoryUsers.filter((user) => user.role === role)
  ]);

  const userCards = usersByRole.map(([role, users]) => `
    <article class="directory-card">
      <span class="section-kicker">${escapeHtml(role === "admin" ? "Admin Operators" : `${role}s`)}</span>
      <strong>${users.length}</strong>
      <div class="people-list">
        ${users.map((user) => `
          <div class="person-row">
            <span>${escapeHtml(user.name)}</span>
            <small>${escapeHtml(user.post)}${user.outlet ? ` / ${escapeHtml(user.outlet)}` : ""}${user.technicianId ? ` / ${escapeHtml(user.technicianId)}` : ""}</small>
          </div>
        `).join("") || `<div class="empty mini">No people in this post.</div>`}
      </div>
    </article>
  `).join("");

  const techCards = state.technicians.map((tech) => `
    <article class="directory-card tech-card status-${token(tech.status)}">
      <div class="tech-status-row">
        <div>
          <strong>${escapeHtml(tech.name)}</strong>
          <span>${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(tech.status)}</span>
          <span>Serves: ${escapeHtml(serviceAreaLabel(tech))}</span>
        </div>
        <span class="status-dot" aria-hidden="true"></span>
      </div>
    </article>
  `).join("");

  document.querySelector("#directoryBoard").innerHTML = userCards + techCards;
}

function renderActivity() {
  const activities = ticketsForCurrentUser(state.tickets)
    .flatMap((ticket) => (ticket.history || []).map((item) => ({
      ...item,
      ticketId: ticket.id,
      note: ticket.note,
      outlet: ticket.outlet,
      status: ticket.status
    })))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, 12);

  document.querySelector("#activityBoard").innerHTML = activities.length
    ? activities.map((item) => `
      <article class="activity-item">
        <div>
          <strong>${escapeHtml(item.ticketId)} / ${escapeHtml(item.note)}</strong>
          <span>${escapeHtml(item.action)} / ${escapeHtml(item.outlet)} / ${escapeHtml(item.status)}</span>
        </div>
        <time>${escapeHtml(formatDateTime(item.at))}</time>
      </article>
    `).join("")
    : `<div class="empty">No activity in this workspace yet.</div>`;
}

function renderSystem() {
  const apiLabel = API_BASE || "Same origin API";
  const currentUrl = window.location.origin;
  const stitch = state.stitch || {};
  document.querySelector("#systemBoard").innerHTML = `
    <article class="system-card">
      <span>API Target</span>
      <strong>${escapeHtml(apiLabel)}</strong>
      <p>Frontend requests are routed through the TicketOps REST API.</p>
    </article>
    <article class="system-card">
      <span>Storage</span>
      <strong>${escapeHtml(state.storage === "google-sheets" ? "Google Sheets" : state.storage === "browser" ? "Browser" : state.storage === "supabase" ? "Supabase" : "Local JSON")}</strong>
      <p>${state.storage === "supabase" ? "Persistent cloud database active." : state.storage === "google-sheets" ? "Google Sheets backend active." : state.storage === "browser" ? "Browser fallback active until Apps Script is configured." : "Local JSON backend active."}</p>
    </article>
    <article class="system-card">
      <span>Render Ready</span>
      <strong>${state.storage === "google-sheets" ? "Yes" : state.storage === "browser" ? "Fallback" : state.storage === "supabase" ? "Legacy" : "Local only"}</strong>
      <p>Production should use the Google Apps Script API URL.</p>
    </article>
    <article class="system-card">
      <span>App URL</span>
      <strong>${escapeHtml(currentUrl)}</strong>
      <p>Use deployed Render URL for mobile API configuration.</p>
    </article>
    <article class="system-card">
      <span>Stitch API</span>
      <strong>${escapeHtml(stitch.configured ? (stitch.connected ? "Connected" : "Configured") : "Not set")}</strong>
      <p>${escapeHtml(stitch.configured ? (stitch.connected ? `Remote MCP ready at ${stitch.endpoint}` : stitch.error || "Stitch key detected, but remote check failed.") : "Set STITCH_API_KEY to enable Google Stitch calls.")}</p>
    </article>
  `;
}

function renderUtilityViews() {
  renderSettings();
  renderDirectory();
  renderActivity();
  renderSystem();
}

function renderStagePulse() {
  const tickets = ticketsForCurrentUser(state.tickets);
  const open = tickets.filter((ticket) => ticket.status !== "Closed");
  const closed = tickets.filter((ticket) => ticket.status === "Closed");
  const waiting = open.filter((ticket) => !ticket.assignedTo);
  const verify = open.filter((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status));
  const blocked = open.filter((ticket) => ticket.status === "Blocked");
  const readyTechs = state.technicians.filter((tech) => ["Present", "Emergency Available"].includes(tech.status));
  const activeRules = (state.maintenanceRules || []).filter((rule) => rule.active !== false);
  const windows = (state.assignmentTimeWindows || []).filter((window) => window.active !== false);
  const visibleOutlets = currentUser?.role === "manager" ? outletAccessForUser(currentUser).length : state.outlets.length;
  const activeAssets = (state.assets || []).filter((asset) => asset.status !== "Inactive").length;
  const activeTech = currentUser?.technicianId ? technicianById(currentUser.technicianId) : null;
  const myOpen = activeTech ? open.filter((ticket) => ticket.assignedTo === activeTech.id) : open;

  const groups = {
    managerPulse: [
      ["Open", open.length],
      ["Verify", verify.length],
      ["Blocked", blocked.length]
    ],
    adminPulse: [
      ["Unassigned", waiting.length],
      ["Ready Techs", `${readyTechs.length}/${state.technicians.length}`],
      ["Verify", verify.length]
    ],
    historyPulse: [
      ["Closed", closed.length],
      ["Photos", closed.filter((ticket) => (ticket.resolutionPhotoUrls || []).length).length],
      ["Outlets", visibleOutlets]
    ],
    schedulerPulse: [
      ["Rules", activeRules.length],
      ["Windows", windows.length],
      ["Assets", activeAssets]
    ],
    mastersPulse: [
      ["Outlets", state.outlets.length],
      ["Assets", state.assets.length],
      ["Techs", state.technicians.length]
    ],
    technicianPulse: [
      ["My Open", myOpen.length],
      ["Blocked", myOpen.filter((ticket) => ticket.status === "Blocked").length],
      ["Status", activeTech?.status || "Ready"]
    ],
    reportsPulse: [
      ["Open", open.length],
      ["Closed", closed.length],
      ["Critical", open.filter((ticket) => ticket.priority === "P1").length]
    ]
  };

  Object.entries(groups).forEach(([id, values]) => {
    const target = document.querySelector(`#${id}`);
    if (!target) return;
    target.innerHTML = values.map(([label, value]) => `
      <article>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </article>
    `).join("");
  });
}

function renderAlerts() {
  const alerts = state.reports.alerts || [];
  if (!alerts.length) return "";
  return `
    <article class="report-card alert-card">
      <div>
        <strong>${alerts.length}</strong>
        <span>Operational Alerts</span>
      </div>
      <ul>
        ${alerts.slice(0, 6).map((alert) => `<li>${escapeHtml(alert.ticketId)}: ${escapeHtml(alert.message)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function updateLiveClock() {
  const clock = document.querySelector("#liveClock");
  if (!clock) return;
  clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function updateLiveIntel() {
  updateLiveClock();

  const reports = state.reports || {};
  const critical = reports.critical || 0;
  const blocked = reports.blocked || 0;
  const open = reports.open || 0;
  const unassigned = reports.unassigned || 0;
  const present = reports.presentTechnicians || 0;
  const total = reports.technicianCount || 0;
  const verificationPending = (state.tickets || []).filter((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status)).length;

  document.querySelector("#intelSla").textContent = critical ? `${critical} Critical` : blocked ? `${blocked} Blocked` : open ? "Stable" : "Clear";
  document.querySelector("#intelSlaDetail").textContent = critical
    ? "Food-safety or service-stop tickets need first response."
    : blocked
      ? "Blocked work is waiting on parts, vendors, or admin decisions."
      : `${open} open ticket${open === 1 ? "" : "s"} currently in motion.`;

  document.querySelector("#intelDispatch").textContent = unassigned ? `${unassigned} To assign` : `${present}/${total} Ready`;
  document.querySelector("#intelDispatchDetail").textContent = unassigned
    ? "Smart suggestions favor outlet coverage, availability, and lower workload."
    : "Attendance is feeding assignment choices in real time.";

  document.querySelector("#intelVerify").textContent = verificationPending ? `${verificationPending} Pending` : "Closed loop";
  document.querySelector("#intelVerifyDetail").textContent = verificationPending
    ? "Resolved tickets are waiting for manager approval."
    : "No resolved tickets are waiting for review.";

  document.querySelector("#storageMode").textContent = state.storage === "google-sheets" ? "Google Sheets store" : state.storage === "browser" ? "Browser fallback store" : state.storage === "supabase" ? "Supabase live store" : "Local JSON store";
  document.querySelector("#syncStatus").textContent = `Synced ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function render() {
  renderAuthChrome();
  renderStagePulse();
  renderActiveView(document.body.dataset.view || roleHomeView());
  renderUtilityViews();
}

function renderActiveView(viewName) {
  if (viewName === "dashboard" && canUseView("dashboard")) {
    renderDashboard();
    return;
  }

  if (viewName === "manager" && canUseView("manager")) {
    renderManager();
    return;
  }

  if (viewName === "admin" && canUseView("admin")) {
    renderAdmin();
    return;
  }

  if (viewName === "scheduler" && canUseView("scheduler")) {
    renderMaintenanceScheduler();
    return;
  }

  if (viewName === "masters" && canUseView("masters")) {
    renderMasters();
    return;
  }

  if (viewName === "technician" && canUseView("technician")) {
    renderTechnician();
    return;
  }

  if (viewName === "reports" && canUseView("reports")) {
    renderReports();
    return;
  }

  if (viewName === "history" && canUseView("history")) {
    renderClosedHistory();
  }
}

function switchView(viewName) {
  const nextView = canOpenView(viewName) ? viewName : allowedViews()[0];
  if (!nextView) return;

  sessionStorage.setItem("ticketops-last-view", nextView);
  document.body.dataset.view = nextView;
  const nextFile = VIEW_ROUTE_FILES[nextView] || "index.html";
  const currentFile = location.pathname.split("/").pop() || "index.html";
  if (currentFile !== nextFile && location.protocol !== "capacitor:") {
    const nextUrl = new URL(location.href);
    nextUrl.pathname = nextUrl.pathname.replace(/[^/]*$/, nextFile);
    nextUrl.searchParams.delete("view");
    history.replaceState(null, "", nextUrl);
  }
  document.querySelectorAll(".tab[data-view]").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === nextView));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === nextView));
  renderActiveView(nextView);
  closeMobileNav();
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function releasePointerFocus(event) {
  if (!event?.detail) return;
  const control = event.target?.closest?.("button, a[href], input, select, textarea, [tabindex]");
  if (!(control instanceof HTMLElement)) return;
  window.requestAnimationFrame(() => control.blur());
}

function showConnectionError(error) {
  document.querySelector("#appShell").innerHTML = `
    <section class="error-shell">
      <h2>API connection failed</h2>
      <p>${escapeHtml(error.message)}</p>
      <p>Run <strong>npm start</strong> and open <strong>http://localhost:3000</strong> for web testing.</p>
      <label class="inline-control">
        API server URL
        <input id="apiBaseInput" value="${escapeHtml(API_BASE)}" placeholder="https://your-api-domain.com">
      </label>
      <button class="primary-button" id="saveApiBase">Save API URL</button>
    </section>
  `;
  bind("#saveApiBase", "click", () => {
    localStorage.setItem("ticketops-api-base", document.querySelector("#apiBaseInput")?.value.trim() || "");
    window.location.reload();
  });
}

function startWaterDrift() {
  const root = document.documentElement;
  let rafId = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  function paint() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    root.style.setProperty("--water-a-x", `${18 + currentX * 7}%`);
    root.style.setProperty("--water-a-y", `${12 + currentY * 6}%`);
    root.style.setProperty("--water-b-x", `${72 - currentX * 7}%`);
    root.style.setProperty("--water-b-y", `${42 + currentY * 5}%`);
    root.style.setProperty("--water-c-x", `${92 + currentX * 4}%`);
    root.style.setProperty("--water-c-y", `${18 - currentY * 4}%`);
    rafId = window.requestAnimationFrame(paint);
  }

  window.addEventListener("pointermove", (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    if (!rafId) paint();
  }, { passive: true });

  window.addEventListener("blur", () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });
}

bind("#loginForm", "submit", handleLogin);

document.querySelectorAll(".tab[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});
document.querySelector(".topbar")?.addEventListener("click", releasePointerFocus);

/* ─── Collapsible panels (Manager Desk / Admin Control) ───
   Panel headings get a chevron toggle; collapsed state persists per user device. */
const PANEL_COLLAPSE_KEY = "ticketops-collapsed-panels";

function readCollapsedPanels() {
  try {
    return JSON.parse(localStorage.getItem(PANEL_COLLAPSE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function panelCollapseId(panel) {
  const view = panel.closest(".view")?.id || "view";
  const marker = [...panel.classList].filter((name) => name !== "panel" && name !== "is-collapsed").sort().join(".") || "panel";
  return `${view}:${marker}`;
}

function setPanelCollapsed(panel, collapsed) {
  panel.classList.toggle("is-collapsed", collapsed);
  const toggle = panel.querySelector(":scope > .panel-heading .panel-collapse-toggle");
  toggle?.setAttribute("aria-expanded", String(!collapsed));
  toggle?.setAttribute("aria-label", collapsed ? "Expand panel" : "Collapse panel");
}

function togglePanelCollapse(panel) {
  const collapsed = !panel.classList.contains("is-collapsed");
  setPanelCollapsed(panel, collapsed);
  const map = readCollapsedPanels();
  if (collapsed) map[panelCollapseId(panel)] = 1;
  else delete map[panelCollapseId(panel)];
  try {
    localStorage.setItem(PANEL_COLLAPSE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage pressure; collapse still works for this session.
  }
}

function initManagerSideRail() {
  // Group Create Ticket + Scheduled Work into one grid item so the Review Gate
  // never inflates their rows (grid distributes a spanning item's height across
  // all spanned rows, which opened a huge gap under the intake panel).
  const view = document.querySelector("#manager");
  const intake = view?.querySelector(".intake-panel");
  const scheduled = view?.querySelector(".manager-scheduled-panel");
  if (!view || !intake || !scheduled || view.querySelector(".manager-side-rail")) return;
  const rail = document.createElement("div");
  rail.className = "manager-side-rail";
  intake.before(rail);
  rail.append(intake, scheduled);
}

function initCollapsiblePanels() {
  const stored = readCollapsedPanels();
  document.querySelectorAll("#manager .panel, #admin > .panel").forEach((panel) => {
    const heading = panel.querySelector(":scope > .panel-heading");
    if (!heading || heading.querySelector(".panel-collapse-toggle")) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "panel-collapse-toggle";
    toggle.textContent = "▾";
    heading.appendChild(toggle);
    setPanelCollapsed(panel, Boolean(stored[panelCollapseId(panel)]));
  });
}

document.addEventListener("click", (event) => {
  const heading = event.target.closest?.("#manager .panel > .panel-heading, #admin > .panel > .panel-heading");
  if (!heading) return;
  const interactive = event.target.closest("button, select, input, a, label");
  if (interactive && !interactive.classList.contains("panel-collapse-toggle")) return;
  togglePanelCollapse(heading.parentElement);
});
initManagerSideRail();
initCollapsiblePanels();

document.getElementById("kpiDrillClose")?.addEventListener("click", closeKpiDrill);
document.getElementById("kpiDrillOverlay")?.addEventListener("click", (e) => { if (e.target === e.currentTarget) closeKpiDrill(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeKpiDrill(); });
bind("#ticketForm", "submit", createTicket);
bind("#ticketPhoto", "change", updateTicketPhotoHint);
bind("#ticketImpact", "change", updateTicketPriorityPreview);
bind("#ticketCategory", "change", updateTicketPriorityPreview);
bind("#ticketNote", "input", updateTicketPriorityPreview);
bind("#assetForm", "submit", saveAssetMaster);
bind("#assetCancel", "click", resetAssetForm);
bind("#assetBulkTemplate", "click", downloadAssetBulkTemplate);
bind("#assetBulkUploadButton", "click", () => document.querySelector("#assetBulkFile")?.click());
bind("#assetBulkFile", "change", importAssetBulkFile);
bind("#outletForm", "submit", createOutlet);
bind("#outletCancel", "click", resetOutletForm);
bind("#categoryForm", "submit", createCategory);
bind("#categoryCancel", "click", resetCategoryForm);
bind("#technicianForm", "submit", saveTechnicianMaster);
bind("#technicianCancel", "click", resetTechnicianForm);
bind("#userAccessForm", "submit", saveUserAccess);
bind("#userAccessCancel", "click", resetUserAccessForm);
bind("#accessRole", "change", () => {
  updateUserAccessVisibility();
  renderMasterSelectionPanels();
});
bind("#accessAllOutlets", "change", () => {
  updateUserAccessVisibility();
  renderMasterSelectionPanels();
});
bind("#assignmentWindowForm", "submit", saveAssignmentWindow);
bind("#assignmentWindowCancel", "click", resetAssignmentWindowForm);
bind("#maintenanceRuleForm", "submit", createMaintenanceRule);
bind("#ruleCancel", "click", resetMaintenanceRuleForm);
bind("#ruleAllowOutsideWindow", "change", updateRuleTimeDisabled);
bind("#ruleOutlet", "change", () => populateRuleTechnicians(document.querySelector("#ruleOutlet")?.value || "", ""));
bind("#activeTechnician", "change", renderTechnician);
document.querySelectorAll("[data-master-tab]").forEach((button) => {
  button.addEventListener("click", () => switchMasterTab(button.dataset.masterTab));
});
document.addEventListener("input", (event) => {
  const search = event.target.closest?.("[data-master-search]");
  if (!search) return;
  masterSearchTerms[search.dataset.masterSearch] = search.value;
  renderMasters();
});
document.addEventListener("input", (event) => {
  const adminSearch = event.target.closest?.("[data-admin-queue-search]");
  if (adminSearch) {
    adminQueueSearch = adminSearch.value;
    renderAdmin();
    return;
  }
  const archiveSearch = event.target.closest?.("[data-history-search]");
  if (archiveSearch) {
    historySearch = archiveSearch.value;
    renderClosedHistory();
  }
});
bind("#logoutButton", "click", () => {
  clearUser();
  showLogin();
});
bind("#themeToggle", "click", toggleTheme);
bind("#dashboardSummaryMode", "click", () => toggleDashboardMode("summary"));
bind("#dashboardDetailMode", "click", () => toggleDashboardMode("detail"));
document.querySelector(".topbar")?.addEventListener("pointerenter", (event) => {
  if (!currentUser || isMobileNav()) return;
  event.currentTarget.scrollTo?.({ top: 0, left: 0 });
  setSidebarHoverOpen(true);
});
document.querySelector(".topbar")?.addEventListener("pointerleave", () => {
  setSidebarHoverOpen(false);
});
document.querySelector(".topbar")?.addEventListener("focusin", (event) => {
  if (!currentUser || isMobileNav()) return;
  event.currentTarget.scrollTo?.({ top: 0, left: 0 });
  setSidebarHoverOpen(true);
});
document.querySelector(".topbar")?.addEventListener("focusout", (event) => {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  setSidebarHoverOpen(false);
});
bind("#sidebarToggle", "click", () => {
  if (!currentUser) return;
  if (isMobileNav()) {
    toggleMobileNav();
  } else {
    toggleDesktopNav();
  }
});
bind("#navBackdrop", "click", closeMobileNav);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileNav();
    closeDesktopNav();
  }
});
bind("#resetData", "click", async () => {
  if (currentUser?.role !== "admin") return;
  await api("/api/reset", { method: "POST" });
  await loadState();
});

document.addEventListener("click", async (event) => {
  const selectPanelAction = event.target.closest?.("[data-select-panel-action]");
  if (selectPanelAction) {
    const select = document.getElementById(selectPanelAction.dataset.selectPanelAction);
    if (select?.multiple) {
      const selectAll = selectPanelAction.dataset.selectAction === "all";
      [...select.options].forEach((option) => {
        if (option.value) option.selected = selectAll;
      });
      select.dispatchEvent(new Event("change", { bubbles: true }));
      renderMasterSelectionPanels();
    }
    return;
  }

  const selectPanelOption = event.target.closest?.("[data-select-panel-option]");
  if (selectPanelOption) {
    const select = document.getElementById(selectPanelOption.dataset.selectPanelOption);
    const value = selectPanelOption.dataset.optionValue || "";
    const option = [...(select?.options || [])].find((item) => item.value === value);
    if (select && option) {
      if (select.multiple) {
        option.selected = !option.selected;
      } else {
        select.value = value;
      }
      select.dispatchEvent(new Event("change", { bubbles: true }));
      renderMasterSelectionPanels();
    }
    return;
  }

  const assetDetailButton = event.target.closest?.("[data-asset-detail]");
  if (assetDetailButton) {
    openAssetDetail(assetDetailButton.dataset.assetDetail);
    return;
  }

  if (event.target.closest?.("[data-close-asset-detail]") || event.target.id === "assetDetailOverlay") {
    closeAssetDetail();
    return;
  }

  const editUserAccess = event.target.closest?.("[data-edit-user-access]");
  if (editUserAccess) {
    fillUserAccessForm(editUserAccess.dataset.editUserAccess);
    return;
  }

  const editOutlet = event.target.closest?.("[data-edit-outlet]");
  if (editOutlet) {
    fillOutletForm(editOutlet.dataset.editOutlet);
    return;
  }

  const editAsset = event.target.closest?.("[data-edit-asset]");
  if (editAsset) {
    fillAssetForm(editAsset.dataset.editAsset);
    return;
  }

  const editCategory = event.target.closest?.("[data-edit-category]");
  if (editCategory) {
    fillCategoryForm(editCategory.dataset.editCategory);
    return;
  }

  const editTechnician = event.target.closest?.("[data-edit-technician]");
  if (editTechnician) {
    fillTechnicianForm(editTechnician.dataset.editTechnician);
    return;
  }

  const deleteMaster = event.target.closest?.("[data-delete-master]");
  if (deleteMaster) {
    const [type, id, label] = deleteMaster.dataset.deleteMaster.split(":");
    await deleteMasterRecord(type, id, label || id);
    return;
  }

  const photoButton = event.target.closest?.("[data-photo-open]");
  if (photoButton) {
    const ticket = state.tickets.find((item) => item.id === photoButton.dataset.photoOpen);
    const photos = (ticket?.photoUrls?.length ? ticket.photoUrls : [ticket?.photoUrl]).filter(Boolean);
    openPhotoLightbox(`${ticket?.id || "Ticket"} — issue photos`, photos);
    return;
  }

  const resolutionPhotoButton = event.target.closest?.("[data-resolution-photo-open]");
  if (resolutionPhotoButton) {
    const ticket = state.tickets.find((item) => item.id === resolutionPhotoButton.dataset.resolutionPhotoOpen);
    openPhotoLightbox(`${ticket?.id || "Ticket"} — completion photos`, ticket?.resolutionPhotoUrls || []);
    return;
  }

  const taskPhotoButton = event.target.closest?.("[data-task-photo]");
  if (taskPhotoButton) {
    const task = (state.tasks || []).find((item) => item.id === taskPhotoButton.dataset.taskPhoto);
    openPhotoLightbox(`${task?.id || "Task"} — evidence photo`, [task?.evidencePhotoUrl || task?.photoUrl]);
    return;
  }

  // Tapping anywhere on a ticket card (outside its controls) opens its photos.
  const ticketCardEl = event.target.closest?.(".ticket-card[data-ticket-id]");
  if (ticketCardEl && !event.target.closest("button, select, input, textarea, label, a")) {
    const ticket = (state.tickets || []).find((item) => item.id === ticketCardEl.dataset.ticketId);
    const photos = [
      ...(ticket?.photoUrls?.length ? ticket.photoUrls : [ticket?.photoUrl]),
      ...(ticket?.resolutionPhotoUrls || [])
    ].filter(Boolean);
    if (photos.length) {
      openPhotoLightbox(`${ticket.id} — photos`, photos);
    } else {
      showToast(`${ticketCardEl.dataset.ticketId} has no photos attached yet.`, "info");
    }
    return;
  }

  const menuAction = event.target.closest?.("[data-menu-action]")?.dataset.menuAction;
  if (menuAction === "refresh") {
    await loadState();
    return;
  }
  if (menuAction === "logout") {
    clearUser();
    showLogin();
    return;
  }
  if (menuAction === "reset" && currentUser?.role === "admin") {
    await api("/api/reset", { method: "POST" });
    await loadState();
    return;
  }

  const ruleToggle = event.target.closest?.("[data-rule-toggle]");
  if (ruleToggle) {
    const [ruleId, active] = ruleToggle.dataset.ruleToggle.split(":");
    await toggleMaintenanceRule(ruleId, active === "true");
    return;
  }

  const deleteRule = event.target.closest?.("[data-delete-rule]");
  if (deleteRule) {
    await deleteMaintenanceRule(deleteRule.dataset.deleteRule, deleteRule.dataset.deleteRuleTitle);
    return;
  }

  const editRule = event.target.closest?.("[data-edit-rule]");
  if (editRule) {
    fillMaintenanceRuleForm(editRule.dataset.editRule);
    return;
  }

  const editAssignmentWindow = event.target.closest?.("[data-edit-assignment-window]");
  if (editAssignmentWindow) {
    fillAssignmentWindowForm(editAssignmentWindow.dataset.editAssignmentWindow);
    return;
  }

  const statusButton = event.target.closest?.("[data-status]");
  if (statusButton) {
    const [ticketId, status] = statusButton.dataset.status.split(":");
    const detail = await detailForStatus(status);
    if ((["Blocked", "Resolved", "Reopened"].includes(status) || (status === "Closed" && currentUser?.role === "admin")) && !detail.trim()) return;
    try {
      await setTicketStatus(ticketId, status, detail);
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const assignButton = event.target.closest?.("[data-assign-button]");
  if (assignButton) {
    const assignId = assignButton.dataset.assignButton;
    const select = document.querySelector(`[data-assign="${assignId}"]`);
    try {
      await assignTicket(assignId, select?.value || "");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const editClosePriceButton = event.target.closest?.("[data-edit-close-price]");
  if (editClosePriceButton) {
    try {
      await editClosedTicketPrice(editClosePriceButton.dataset.editClosePrice);
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const scheduleButton = event.target.closest?.("[data-schedule-button]");
  if (scheduleButton) {
    await saveTicketSchedule(scheduleButton.dataset.scheduleButton);
    return;
  }

  const acceptButton = event.target.closest?.("[data-accept-ticket]");
  if (acceptButton) {
    await acceptTicket(acceptButton.dataset.acceptTicket);
    return;
  }

  const rejectButton = event.target.closest?.("[data-reject-ticket]");
  if (rejectButton) {
    await rejectTicket(rejectButton.dataset.rejectTicket);
    return;
  }

  const deleteAssignmentButton = event.target.closest?.("[data-delete-assignment]");
  if (deleteAssignmentButton) {
    await deleteAssignment(deleteAssignmentButton.dataset.deleteAssignment);
    return;
  }

  const exportButton = event.target.closest?.("[data-export-report]");
  if (exportButton) {
    try {
      await downloadReport(exportButton.dataset.exportReport);
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const monthlyBackupButton = event.target.closest?.("[data-monthly-backup]");
  if (monthlyBackupButton) {
    try {
      await downloadMonthlyBackup();
      showToast("Monthly backup file generated. Put this JSON in Google Drive.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const loadBackupButton = event.target.closest?.("[data-load-backup-report]");
  if (loadBackupButton) {
    document.querySelector("#backupReportFile")?.click();
    return;
  }

  const analyticsPeriodBtn = event.target.closest?.("[data-analytics-period]");
  if (analyticsPeriodBtn) {
    const period = analyticsPeriodBtn.dataset.analyticsPeriod;
    const analyticsSection = document.querySelector("#analyticsSection");
    if (analyticsSection) analyticsSection.innerHTML = renderAnalyticsContent(period);
    return;
  }

  if (event.target.id === "ruleAddAssignment") {
    syncCurrentRuleAssignment();
    return;
  }

  const removeRuleAssignment = event.target.closest?.("[data-remove-rule-assignment]");
  if (removeRuleAssignment) {
    editingMaintenanceAssignments.splice(Number(removeRuleAssignment.dataset.removeRuleAssignment), 1);
    renderRuleAssignmentsBoard();
    return;
  }

  const taskDoneButton = event.target.closest?.("[data-task-done]");
  if (taskDoneButton) {
    const task = (state.tasks || []).find((item) => item.id === taskDoneButton.dataset.taskDone);
    const evidence = await collectTaskEvidence(task);
    if (!evidence) return;
    try {
      await updateTaskStatus(taskDoneButton.dataset.taskDone, "Done", evidence);
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const taskNotDoneButton = event.target.closest?.("[data-task-not-done]");
  if (taskNotDoneButton) {
    const task = (state.tasks || []).find((item) => item.id === taskNotDoneButton.dataset.taskNotDone);
    if (!task) return;
    const reason = await showPromptModal("Why is the checkup not done?", "Could not complete this time");
    if (reason === null) return;
    if (!reason.trim()) {
      showToast("Reason is required.", "warning");
      return;
    }
    await updateTaskStatus(task.id, "Not Done", { comment: reason.trim() });
    return;
  }

  const taskDeleteButton = event.target.closest?.("[data-task-delete]");
  if (taskDeleteButton) {
    await deleteTask(taskDeleteButton.dataset.taskDelete);
    return;
  }

  const quickAttendance = event.target.closest?.("[data-quick-attendance]")?.dataset.quickAttendance;
  if (quickAttendance) {
    const technicianId = currentUser?.technicianId || document.querySelector("#activeTechnician").value;
    if (!technicianId) return;

    const presets = {
      today: { status: "Absent", from: todayInputValue(), to: todayInputValue(), reason: "Marked absent for today" },
      "three-days": { status: "On Leave", from: todayInputValue(), to: addDaysInputValue(2), reason: "Planned leave" },
      available: { status: "Present", from: todayInputValue(), to: todayInputValue(), reason: "Available for assignment" }
    };
    await createAttendancePlan(technicianId, presets[quickAttendance]);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAssetDetail();
  if (event.key === "Escape") closeMobileNav();
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "technicianTicketForm") {
    await createTechnicianTicket(event);
    return;
  }

  if (event.target.id !== "attendanceForm") return;
  event.preventDefault();
  const technicianId = currentUser?.technicianId || document.querySelector("#activeTechnician").value;
  if (!technicianId) return;

  const submitButton = event.target.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";
  try {
    await createAttendancePlan(technicianId, {
      status: document.querySelector("#attendanceStatus").value,
      from: document.querySelector("#attendanceFrom").value,
      to: document.querySelector("#attendanceTo").value,
      reason: document.querySelector("#attendanceReason").value
    });
    showToast("Attendance saved.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Save Attendance";
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "passwordChangeForm") return;
  event.preventDefault();

  const status = document.querySelector("#passwordChangeStatus");
  const currentPassword = document.querySelector("#passwordCurrent").value;
  const newPassword = document.querySelector("#passwordNew").value;
  const confirmPassword = document.querySelector("#passwordConfirm").value;
  const submitButton = event.target.querySelector("button[type='submit']");

  status.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Updating...";

  try {
    await api("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });

    clearUser();
    showLogin();
    document.querySelector("#loginError").textContent = "Password updated. Please sign in again.";
  } catch (error) {
    status.textContent = error.message;
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Update Password";
  }
});

document.addEventListener("submit", async (event) => {
  if (!event.target.matches("[data-password-reset-form]")) return;
  event.preventDefault();
  if (currentUser?.role !== "admin") return;

  const form = event.target;
  const shell = form.closest("[data-password-reset-shell]");
  const status = shell?.querySelector("[data-password-reset-status]");
  const submitButton = event.target.querySelector("button[type='submit']");
  const passwordInput = form.querySelector("[data-password-reset-value]");
  const userId = form.querySelector("[data-password-reset-user]").value;
  const requestedPassword = passwordInput.value.trim();

  if (!userId) {
    if (status) status.textContent = "Choose a user first.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Resetting...";
  if (status) status.textContent = "";

  try {
    const result = await api(`/api/admin/users/${encodeURIComponent(userId)}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword: requestedPassword })
    });
    showToast(`${result.username} reset. Temporary password: ${result.temporaryPassword}`, "success", 6000);
    if (status) status.textContent = `${result.username} reset. Temp pass: ${result.temporaryPassword}`;
    passwordInput.value = "";
  } catch (error) {
    showToast(error.message, "error");
    if (status) status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Reset Password";
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "backupReportFile") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await renderBackupReportFromFile(file);
      showToast("Archive report generated from backup file.", "success");
    } catch (error) {
      showToast(error.message || "Could not read backup file.", "error");
    } finally {
      event.target.value = "";
    }
    return;
  }

  if (event.target.id === "assignmentWindowAllDays") {
    [...document.querySelectorAll('input[name="assignmentWindowDays"]')].forEach((input) => {
      input.checked = event.target.checked;
    });
    return;
  }

  if (event.target.id === "ruleFrequency") {
    updateRuleRecurrenceFields();
    return;
  }

  const techId = event.target.dataset.techStatus;
  if (!techId) return;
  try {
    await updateTechnicianStatus(techId, event.target.value);
    showToast(`${event.target.value} status saved.`, "success");
  } catch (error) {
    showToast(error.message, "error");
    await loadState();
  }
});

["pointerdown", "keydown", "touchstart", "input", "change", "submit"].forEach((eventName) => {
  document.addEventListener(eventName, markUserActivity, { passive: true });
});

document.addEventListener("visibilitychange", () => {
  if (!currentUser || document.hidden) return;
  const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) || 0);
  if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
    logoutForInactivity();
    return;
  }
  scheduleInactivityLogout();
});

updateLiveClock();
startWaterDrift();

if (currentUser) {
  enterApp().catch((error) => {
    clearUser();
    showLogin();
    document.querySelector("#loginError").textContent = error.message;
  });
} else {
  showLogin();
}

setInterval(updateLiveClock, 30000);
setInterval(() => {
  if (document.hidden || !currentUser) return;
  loadState().catch((error) => console.warn(error));
}, 1800000);

window.addEventListener("resize", () => {
  if (!isMobileNav()) closeMobileNav();
  if (currentUser) renderAuthChrome();
});
