const NATIVE_DEFAULT_API = location.protocol === "capacitor:" ? "http://10.0.2.2:3000" : "";
const CONFIG_API_BASE = window.TICKETOPS_CONFIG?.apiBase || window.TICKETOPS_API_BASE || "";
const API_BASE = localStorage.getItem("ticketops-api-base") || CONFIG_API_BASE || NATIVE_DEFAULT_API;
const AUTH_STORAGE_KEY = "ticketops-auth-user-v2";
const MAX_TICKET_PHOTOS = 5;
const MAX_IMAGE_EDGE = 1600;
const IMAGE_QUALITY = 0.72;
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
  assignmentTimeWindows: [],
  reports: {}
};

let currentUser = readStoredUser();
let directoryUsers = [];
let editingUserAccessId = "";
let editingCategoryId = "";
let editingTechnicianId = "";
let editingOutletName = "";
let editingAssetId = "";
let activeMasterTab = "outlets";
let editingAssignmentWindowId = "";
let editingMaintenanceRuleId = "";
let mobileNavOpen = false;

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
}

function clearUser() {
  currentUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
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
  document.body.classList.toggle("mobile-nav-open", open);
  const toggle = document.querySelector("#sidebarToggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.textContent = open ? "\u00d7" : "\u2630";
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

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img), { once: true });
      img.addEventListener("error", () => reject(new Error("Photo could not be read.")), { once: true });
      img.src = sourceUrl;
    });
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function readTicketPhotos() {
  const input = document.querySelector("#ticketPhoto");
  const files = [...(input?.files || [])];
  if (!files.length) return [];
  if (files.length > MAX_TICKET_PHOTOS) {
    throw new Error(`Attach up to ${MAX_TICKET_PHOTOS} images only.`);
  }
  return Promise.all(files.map(compressImageFile));
}

function readTicketPhoto() {
  return readTicketPhotos().then((photos) => photos[0] || "");
}

async function readPhotosFromInput(input) {
  const files = [...(input?.files || [])];
  if (files.length > MAX_TICKET_PHOTOS) throw new Error(`Attach up to ${MAX_TICKET_PHOTOS} images only.`);
  return Promise.all(files.map(compressImageFile));
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
  return (state.tickets || []).filter((ticket) =>
    ticket.assignedTo === technicianId && !["Closed", "Cancelled"].includes(ticket.status)
  ).length;
}

function technicianPendingTasks(technicianId) {
  const today = todayInputValue();
  return (state.tasks || []).filter((task) =>
    task.assignedTo === technicianId && task.date === today && task.status === "Pending"
  ).length;
}

function technicianSkillLabel() {
  return "All skills";
}

function maintenanceRuleTechnicianLabel(rule) {
  if (!rule?.assignedTechnicianId) return "Balanced";
  return technicianById(rule.assignedTechnicianId)?.name || "Assigned technician";
}

function maintenanceRuleForTask(task) {
  if (!task?.ruleId) return null;
  return (state.maintenanceRules || []).find((rule) => rule.id === task.ruleId) || null;
}

function technicianAssignmentSummary(tech, ticket) {
  const serviceOutlets = tech?.serviceOutlets || [];
  const servesOutlet = serviceOutlets.includes(ticket.outlet);
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
  return (state.assets || []).find((asset) => asset.id === id);
}

function tasksForAsset(assetId) {
  return (state.tasks || []).filter((task) => task.assetId === assetId);
}

function ticketsForAsset(assetId) {
  return (state.tickets || []).filter((ticket) => ticket.assetId === assetId);
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

function userOutletLabel(user) {
  if (user.accessAllOutlets) return "All outlets";
  const outlets = Array.isArray(user.allowedOutlets) && user.allowedOutlets.length ? user.allowedOutlets : user.outlet ? [user.outlet] : [];
  return outlets.length ? outlets.join(", ") : "No outlet access";
}

async function api(path, options = {}) {
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
  return response.json();
}

async function loginWithCredentials(username, password) {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  saveUser(result.user);
  await enterApp();
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
  document.querySelector("#appShell").classList.remove("is-hidden");
  renderAuthChrome();
  await loadState();
  switchView(roleHomeView());
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
  document.querySelector("#sidebarToggle")?.classList.toggle("is-hidden", !currentUser || !isMobileNav() || singleRole);
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
  state = await api("/api/bootstrap");
  await loadDirectoryUsers();
  renderSelects();
  render();
  updateLiveIntel();
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
  const resultBox = document.querySelector("#ticketCreateResult");
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";
  resultBox.textContent = "";

  try {
    const photoUrls = await readTicketPhotos();
    const photoUrl = photoUrls[0] || "";
    const impact = document.querySelector("#ticketImpact").value;
    const category = document.querySelector("#ticketCategory").value;
    const note = document.querySelector("#ticketNote").value.trim();
    const assetValue = document.querySelector("#ticketAsset").value;
    const photoRequired = ticketRequiresPhoto({ impact, category, note });
    if (photoRequired && !photoUrl) {
      throw new Error("Photo is required for critical, food-safety, gas, electrical, leak, or temperature issues.");
    }

    const created = await api("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        outlet: document.querySelector("#ticketOutlet").value,
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
    updateTicketPriorityPreview();
    resultBox.innerHTML = `
      <strong>${escapeHtml(created.id)} / ${escapeHtml(PRIORITY_LABELS[created.priority] || created.priority)}</strong>
      <span>Created in admin queue for assignment.</span>
      ${created.suggestedTechnician?.name ? `<span>Suggestion: ${escapeHtml(created.suggestedTechnician.name)}${created.suggestedTechnician.dispatchReason ? ` / ${escapeHtml(created.suggestedTechnician.dispatchReason)}` : ""}</span>` : ""}
      ${(created.photoUrls?.length || created.photoUrl) ? `<span>${created.photoUrls?.length || 1} issue photo${(created.photoUrls?.length || 1) === 1 ? "" : "s"} attached.</span>` : ""}
    `;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Ticket";
  }
}

async function createTechnicianTicket(event) {
  event.preventDefault();
  if (currentUser?.role !== "technician") return;

  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const resultBox = document.querySelector("#technicianTicketResult");
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";
  resultBox.textContent = "";

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
        assignedTo: "",
        photoUrl: photoUrls[0] || "",
        photoUrls
      })
    });
    document.querySelector("#technicianTicketNote").value = "";
    document.querySelector("#technicianTicketPhotos").value = "";
    resultBox.textContent = `${created.id} created for admin assignment.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
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
      window.alert("Completion photo is required before marking the ticket resolved.");
      return;
    }
    payload.evidencePhotoUrls = [photoUrl];
    payload.evidencePhotoUrl = photoUrl;
  }
  await api(`/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  await loadState();
}

function detailForStatus(status) {
  if (status === "Blocked") {
    return window.prompt("Blocked reason", "Spare part required") || "";
  }
  if (status === "Resolved") {
    return window.prompt("Resolution note", "Fixed permanently") || "";
  }
  if (status === "Reopened") {
    return window.prompt("Reopen / rejection reason", "Issue not fixed") || "";
  }
  if (status === "Closed") {
    return "Manager approved resolution";
  }
  return "";
}

async function assignTicket(ticketId, technicianId) {
  if (!["admin", "manager"].includes(currentUser?.role)) return;
  if (!technicianId) {
    window.alert("No technician is selected. Add outlet coverage to a technician first, then assign again.");
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
    window.alert("This technician is not registered for this outlet. Add the outlet to the technician service area first.");
    return;
  }

  if (currentUser?.role === "manager" && hardRisk.length) {
    window.alert("Manager can only assign technicians who are available and serve this outlet.");
    return;
  }

  if (currentUser?.role === "admin" && hardRisk.length) {
    const overrideReason = window.prompt(
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
  const reason = window.prompt("Reject job reason", "I cannot take this job because ");
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

async function saveAssetMaster(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;

  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const resultBox = document.querySelector("#masterCreateResult");
  submitButton.disabled = true;
  submitButton.textContent = editingAssetId ? "Updating..." : "Adding...";
  resultBox.textContent = "";

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
    resultBox.textContent = `${asset.id} ${wasEditing ? "updated" : "added"} for ${asset.outlet}.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
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
  const resultBox = document.querySelector("#masterCreateResult");
  submitButton.disabled = true;
  submitButton.textContent = editingOutletName ? "Updating..." : "Adding...";
  resultBox.textContent = "";
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
    resultBox.textContent = `${outlet.name} outlet ${wasEditing ? "updated" : "added"}${outlet.address ? ` at ${outlet.address}` : ""}.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
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
  const resultBox = document.querySelector("#masterCreateResult");
  submitButton.disabled = true;
  submitButton.textContent = editingCategoryId ? "Updating..." : "Adding...";
  resultBox.textContent = "";
  try {
    const category = await api(editingCategoryId ? `/api/categories/${editingCategoryId}` : "/api/categories", {
      method: editingCategoryId ? "PATCH" : "POST",
      body: JSON.stringify({ name: document.querySelector("#categoryName").value })
    });
    const wasEditing = Boolean(editingCategoryId);
    resetCategoryForm();
    resultBox.textContent = `${category.name} category ${wasEditing ? "updated" : "added"}.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingCategoryId ? "Update Category" : "Add Category";
  }
}

function resetCategoryForm() {
  editingCategoryId = "";
  document.querySelector("#categoryName").value = "";
  document.querySelector("#categorySubmit").textContent = "Add Category";
}

function fillCategoryForm(categoryId) {
  const category = (state.categories || []).find((item) => item.id === categoryId);
  if (!category) return;
  editingCategoryId = category.id;
  document.querySelector("#categoryName").value = category.name || "";
  document.querySelector("#categorySubmit").textContent = "Update Category";
}

async function saveTechnicianMaster(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const resultBox = document.querySelector("#masterCreateResult");
  submitButton.disabled = true;
  submitButton.textContent = editingTechnicianId ? "Updating..." : "Adding...";
  resultBox.textContent = "";
  try {
    const serviceOutlets = selectedOptionValues(document.querySelector("#technicianOutlet"));
    const technician = await api(editingTechnicianId ? `/api/technicians/${editingTechnicianId}` : "/api/technicians", {
      method: editingTechnicianId ? "PATCH" : "POST",
      body: JSON.stringify({
        name: document.querySelector("#technicianName").value,
        skill: document.querySelector("#technicianSkill").value,
        outlet: serviceOutlets[0] || "",
        serviceOutlets
      })
    });
    const wasEditing = Boolean(editingTechnicianId);
    resetTechnicianForm();
    resultBox.textContent = technician.login
      ? `${technician.name} added. Login: ${technician.login.username} / ${technician.temporaryPassword}`
      : `${technician.name} technician ${wasEditing ? "updated" : "added"}.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingTechnicianId ? "Update Technician" : "Add Technician";
  }
}

function resetTechnicianForm() {
  editingTechnicianId = "";
  document.querySelector("#technicianForm")?.reset();
  [...(document.querySelector("#technicianOutlet")?.options || [])].forEach((option) => { option.selected = false; });
  document.querySelector("#technicianSubmit").textContent = "Add Technician";
}

function fillTechnicianForm(technicianId) {
  const tech = state.technicians.find((item) => item.id === technicianId);
  if (!tech) return;
  editingTechnicianId = tech.id;
  document.querySelector("#technicianName").value = tech.name || "";
  document.querySelector("#technicianSkill").value = tech.skill || "";
  [...(document.querySelector("#technicianOutlet")?.options || [])].forEach((option) => {
    option.selected = (tech.serviceOutlets || []).includes(option.value);
  });
  document.querySelector("#technicianSubmit").textContent = "Update Technician";
}

function resetUserAccessForm() {
  editingUserAccessId = "";
  document.querySelector("#userAccessForm")?.reset();
  document.querySelector("#accessUsername").disabled = false;
  document.querySelector("#accessPassword").required = true;
  document.querySelector("#userAccessSubmit").textContent = "Add User";
  [...(document.querySelector("#accessOutlets")?.options || [])].forEach((option) => { option.selected = false; });
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
  if (tech && document.querySelector("#accessSkill")) document.querySelector("#accessSkill").value = tech.skill;
  const outlets = Array.isArray(user.allowedOutlets) && user.allowedOutlets.length ? user.allowedOutlets : user.outlet ? [user.outlet] : [];
  [...(document.querySelector("#accessOutlets")?.options || [])].forEach((option) => {
    option.selected = outlets.includes(option.value);
  });
  document.querySelector("#userAccessSubmit").textContent = "Update User";
}

async function saveUserAccess(event) {
  event.preventDefault();
  if (!canUseView("masters")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const resultBox = document.querySelector("#masterCreateResult");
  submitButton.disabled = true;
  resultBox.textContent = "";
  try {
    const payload = {
      role: document.querySelector("#accessRole").value,
      name: document.querySelector("#accessName").value,
      username: document.querySelector("#accessUsername").value,
      password: document.querySelector("#accessPassword").value,
      post: document.querySelector("#accessPost").value,
      skill: document.querySelector("#accessSkill").value,
      accessAllOutlets: document.querySelector("#accessAllOutlets").checked,
      allowedOutlets: selectedOptionValues(document.querySelector("#accessOutlets")),
      address: document.querySelector("#accessAddress").value,
      latitude: "",
      longitude: ""
    };
    const path = editingUserAccessId ? `/api/admin/users/${editingUserAccessId}` : "/api/admin/users";
    const method = editingUserAccessId ? "PATCH" : "POST";
    await api(path, { method, body: JSON.stringify(payload) });
    resultBox.textContent = editingUserAccessId ? "User access updated." : "User created.";
    resetUserAccessForm();
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteMasterRecord(type, id, label) {
  if (!canUseView("masters")) return;
  if (!window.confirm(`Delete ${label}?`)) return;
  const resultBox = document.querySelector("#masterCreateResult");
  try {
    await api(`/api/${type}/${encodeURIComponent(id)}`, { method: "DELETE" });
    resultBox.textContent = `${label} deleted.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
    window.alert(error.message);
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

async function createMaintenanceRule(event) {
  event.preventDefault();
  if (!canUseView("scheduler")) return;
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const resultBox = document.querySelector("#ruleCreateResult");
  const isEditing = Boolean(editingMaintenanceRuleId);
  submitButton.disabled = true;
  submitButton.textContent = isEditing ? "Updating..." : "Adding...";
  resultBox.textContent = "";
  try {
    const rule = await api(isEditing ? `/api/maintenance-rules/${editingMaintenanceRuleId}` : "/api/maintenance-rules", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify({
        category: document.querySelector("#ruleCategory").value,
        title: document.querySelector("#ruleTitle").value,
        phase: document.querySelector("#rulePhase").value,
        frequency: document.querySelector("#ruleFrequency").value,
        assignedTechnicianId: document.querySelector("#ruleTechnician").value,
        allowOutsideWindow: document.querySelector("#ruleAllowOutsideWindow").checked
      })
    });
    resetMaintenanceRuleForm();
    resultBox.textContent = `${rule.frequency} rule ${isEditing ? "updated" : "added"} for ${rule.category}.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = isEditing ? "Update Rule" : "Add Rule";
  }
}

function resetMaintenanceRuleForm() {
  editingMaintenanceRuleId = "";
  document.querySelector("#maintenanceRuleForm")?.reset();
  document.querySelector("#ruleSubmit").textContent = "Add Rule";
}

function fillMaintenanceRuleForm(ruleId) {
  const rule = (state.maintenanceRules || []).find((item) => item.id === ruleId);
  if (!rule) return;
  editingMaintenanceRuleId = rule.id;
  document.querySelector("#ruleCategory").value = rule.category || "";
  document.querySelector("#ruleTitle").value = rule.title || "";
  document.querySelector("#rulePhase").value = rule.phase || "Checklist";
  document.querySelector("#ruleFrequency").value = rule.frequency || "daily";
  document.querySelector("#ruleTechnician").value = rule.assignedTechnicianId || "";
  document.querySelector("#ruleAllowOutsideWindow").checked = Boolean(rule.allowOutsideWindow);
  document.querySelector("#ruleSubmit").textContent = "Update Rule";
}

async function toggleMaintenanceRule(ruleId, active) {
  if (!canUseView("scheduler")) return;

  await api(`/api/maintenance-rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify({ active })
  });
  await loadState();
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
  const required = true;
  const comment = window.prompt(
    taskRequiresEvidence(task) ? "Safety evidence note (photo required)" : "Completion note (photo required)",
    taskRequiresEvidence(task) ? "Checked and verified on site" : "Completed on site"
  );
  if (comment === null) return null;

  const photoUrl = await chooseEvidencePhoto();

  if (!photoUrl) {
    window.alert("Photo evidence is required to complete this task.");
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
  if (!window.confirm("Delete this task?")) return;
  await api(`/api/tasks/${taskId}`, { method: "DELETE" });
  await loadState();
}

async function downloadReport(type) {
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

function technicianById(id) {
  return state.technicians.find((tech) => tech.id === id);
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
  const ruleCategory = document.querySelector("#ruleCategory");
  const ruleTechnician = document.querySelector("#ruleTechnician");
  const activeTechnician = document.querySelector("#activeTechnician");
  const activeTechnicianControl = document.querySelector("#activeTechnicianControl");
  const selectedTechnician = activeTechnician.value;
  const selectedTicketOutlet = outletSelect?.value;
  const selectedTicketAsset = ticketAsset?.value;
  const selectedAssetOutlet = assetOutlet?.value;
  const selectedAssetCategory = assetCategory?.value;
  const selectedTechnicianSkill = technicianSkill?.value;
  const selectedTechnicianOutlet = technicianOutlet?.value;
  const selectedTechnicianOutlets = selectedOptionValues(technicianOutlet);
  const selectedAccessSkill = accessSkill?.value;
  const selectedAccessOutlets = selectedOptionValues(accessOutlets);
  const selectedTicketCategory = ticketCategory?.value;
  const selectedRuleTechnician = ruleTechnician?.value;
  const categories = state.categories?.length
    ? state.categories
    : ["AC", "Refrigeration", "Electrical", "Plumbing", "Kitchen Equipment", "Gas", "POS / IT", "Civil"].map((name) => ({ name }));

  const managerOutlets = currentUser?.role === "manager" ? outletAccessForUser(currentUser) : state.outlets;
  const ticketOutlets = managerOutlets.length ? managerOutlets : state.outlets;

  outletSelect.innerHTML = ticketOutlets
    .map((outlet) => `<option value="${escapeHtml(outlet)}">${escapeHtml(outlet)}</option>`)
    .join("");

  function renderTicketAssets() {
    if (!ticketAsset) return;
    const outlet = outletSelect.value || currentUser?.outlet || state.outlets[0];
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
    if (selectedTechnicianSkill && categories.some((category) => category.name === selectedTechnicianSkill)) {
      technicianSkill.value = selectedTechnicianSkill;
    }
  }

  if (accessSkill) {
    accessSkill.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    if (selectedAccessSkill && categories.some((category) => category.name === selectedAccessSkill)) {
      accessSkill.value = selectedAccessSkill;
    }
  }

  if (ticketCategory) {
    ticketCategory.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
      .join("");
    if (selectedTicketCategory && categories.some((category) => category.name === selectedTicketCategory)) {
      ticketCategory.value = selectedTicketCategory;
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
    ruleTechnician.innerHTML = [
      `<option value="">Balanced / auto assign</option>`,
      ...(state.technicians || []).map((tech) => `<option value="${escapeHtml(tech.id)}">${escapeHtml(tech.name)}</option>`)
    ].join("");
    if (selectedRuleTechnician && (state.technicians || []).some((tech) => tech.id === selectedRuleTechnician)) {
      ruleTechnician.value = selectedRuleTechnician;
    }
  }

  if (currentUser?.role === "manager") {
    if (ticketOutlets.includes(selectedTicketOutlet)) outletSelect.value = selectedTicketOutlet;
    if (currentUser.outlet && ticketOutlets.includes(currentUser.outlet)) outletSelect.value = currentUser.outlet;
    outletSelect.disabled = ticketOutlets.length <= 1;
    document.querySelector("#managerScope").textContent = `${userOutletLabel(currentUser)} auto dispatch`;
  } else {
    outletSelect.disabled = false;
    document.querySelector("#managerScope").textContent = "Coverage + time auto dispatch";
  }

  renderTicketAssets();
  syncTicketCategoryToAsset();
  updateTicketPriorityPreview();
  outletSelect.onchange = () => {
    renderTicketAssets();
    syncTicketCategoryToAsset();
    updateTicketPriorityPreview();
  };
  if (ticketAsset) {
    ticketAsset.onchange = () => {
      syncTicketCategoryToAsset();
      updateTicketPriorityPreview();
    };
  }

  activeTechnician.innerHTML = state.technicians
    .map((tech) => `<option value="${escapeHtml(tech.id)}">${escapeHtml(tech.name)}</option>`)
    .join("");

  if (currentUser?.technicianId) {
    activeTechnician.value = currentUser.technicianId;
    activeTechnician.disabled = true;
    activeTechnicianControl.hidden = true;
  } else {
    activeTechnician.disabled = false;
    activeTechnicianControl.hidden = false;
    if (selectedTechnician && state.technicians.some((tech) => tech.id === selectedTechnician)) {
      activeTechnician.value = selectedTechnician;
    }
  }
}

function renderActionButtons(ticket, mode, canVerify, canWork) {
  const canDeleteAssignment = Boolean(ticket.assignedTo) && (currentUser?.role === "admin" || ticket.createdBy === currentUser?.id);
  const assignableForRole = state.technicians
    .filter((tech) => ["Present", "Busy", "Emergency Available"].includes(tech.status));
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
      <div class="action-group-title">Dispatch</div>
      <select data-assign="${escapeHtml(ticket.id)}" aria-label="Assign ${escapeHtml(ticket.id)}">${assignmentOptions}</select>
      <button class="small-button primary" data-assign-button="${escapeHtml(ticket.id)}">Assign Job</button>
      ${canDeleteAssignment ? `<button class="small-button danger" data-delete-assignment="${escapeHtml(ticket.id)}">Delete</button>` : ""}
      <button class="small-button warning" data-status="${escapeHtml(ticket.id)}:Blocked">Blocked</button>
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
    <article class="ticket-card ${priorityClass}">
      <div class="ticket-top">
        <div>
          <h3 class="ticket-title"><span class="ticket-id">${escapeHtml(ticket.id)}</span> ${escapeHtml(ticket.note || "Maintenance request")}</h3>
          <p class="ticket-meta">${escapeHtml(ticket.outlet)}${ticket.area ? ` / ${escapeHtml(ticket.area)}` : ""} / ${escapeHtml(asset?.name || ticket.category)} / ${escapeHtml(ticket.impact)}</p>
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

function outletHealthCards() {
  const tickets = ticketsForCurrentUser(state.tickets);
  const outlets = currentUser?.role === "manager" && currentUser.outlet ? [currentUser.outlet] : state.outlets;
  return outlets.map((outlet) => {
    const outletTickets = tickets.filter((ticket) => ticket.outlet === outlet && ticket.status !== "Closed");
    const critical = outletTickets.filter((ticket) => ticket.priority === "P1").length;
    const blocked = outletTickets.filter((ticket) => ticket.status === "Blocked").length;
    const unassigned = outletTickets.filter((ticket) => !ticket.assignedTo).length;
    const health = critical ? "Critical" : blocked ? "Blocked" : unassigned ? "Dispatch" : outletTickets.length ? "Active" : "Healthy";
    const expanded = health !== "Healthy";
    return `
      <article class="outlet-card status-${token(health)} ${expanded ? "is-expanded" : "is-healthy"}">
        <div class="outlet-card-main">
          <span class="health-dot" aria-hidden="true"></span>
          <strong>${escapeHtml(outlet)}</strong>
          <span>${escapeHtml(health)}</span>
        </div>
        ${expanded ? `
          <div class="outlet-stats">
            <span>${outletTickets.length}<small>open</small></span>
            <span>${critical}<small>critical</small></span>
            <span>${blocked}<small>blocked</small></span>
            <span>${unassigned}<small>unassigned</small></span>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

function renderDashboard() {
  const reports = state.reports || {};
  const scopedTickets = ticketsForCurrentUser(state.tickets).filter((ticket) => ticket.status !== "Closed");
  const readyTechs = state.technicians.filter((tech) => ["Present", "Emergency Available"].includes(tech.status)).length;
  const actions = actionItems();
  const activities = latestActivities();
  const closedTickets = ticketsForCurrentUser(state.tickets).filter((ticket) => ticket.status === "Closed").length;
  const blocked = scopedTickets.filter((ticket) => ticket.status === "Blocked").length;
  const unassigned = scopedTickets.filter((ticket) => !ticket.assignedTo).length;
  const assigned = scopedTickets.filter((ticket) => ticket.assignedTo).length;
  const critical = scopedTickets.filter((ticket) => ticket.priority === "P1").length;
  const totalForCharts = Math.max(scopedTickets.length, 1);
  const readyPercent = state.technicians.length ? Math.round((readyTechs / state.technicians.length) * 100) : 0;

  document.querySelector("#dashboardTitle").textContent = dashboardTitle();
  document.querySelector("#dashboardSubtitle").textContent = dashboardSubtitle();
  document.querySelector("#dashOpen").textContent = reports.open ?? scopedTickets.length;
  document.querySelector("#dashCritical").textContent = reports.critical || 0;
  document.querySelector("#dashReady").textContent = `${readyTechs}/${state.technicians.length || 0}`;
  document.querySelector("#dashboardCharts").innerHTML = `
    ${donutChart("Ticket Mix", scopedTickets.length, totalForCharts + closedTickets, "Open vs closed work", "teal")}
    ${donutChart("Dispatch", assigned, totalForCharts, `${unassigned} waiting for admin`, "blue")}
    ${donutChart("SLA Risk", critical + blocked, totalForCharts, `${critical} critical / ${blocked} blocked`, "coral")}
    ${donutChart("Ready Techs", readyTechs, Math.max(state.technicians.length, 1), `${readyPercent}% available now`, "green")}
  `;

  document.querySelector("#outletHealthBoard").innerHTML = outletHealthCards() || `<div class="empty mini">No outlet data yet.</div>`;

  document.querySelector("#needsActionBoard").innerHTML = actions.length
    ? actions.map((item) => `
        <article class="action-item ${item.tone === "urgent" ? "urgent" : ""}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>
      `).join("")
    : `<div class="empty mini">No urgent action right now.</div>`;

  document.querySelector("#dispatchBrainBoard").innerHTML = state.technicians.map((tech) => {
    const activeJobs = scopedTickets.filter((ticket) => ticket.assignedTo === tech.id).length;
    return `
      <article class="dispatch-card status-${token(tech.status)}">
        <div>
          <strong>${escapeHtml(tech.name)}</strong>
          <span>${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(tech.status)}</span>
        </div>
        <span>${escapeHtml(serviceAreaLabel(tech))}</span>
        <div class="dispatch-score">
          <span>${activeJobs} active</span>
        </div>
      </article>
    `;
  }).join("");

  document.querySelector("#dashboardActivityBoard").innerHTML = activities.length
    ? activities.map((item) => `
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
  return `
    <article class="ops-chart chart-${escapeHtml(tone)}">
      <div class="chart-ring" style="--value: ${percent}">
        <strong>${escapeHtml(percent)}%</strong>
      </div>
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(cleanValue)} / ${escapeHtml(cleanTotal)}</strong>
        <p>${escapeHtml(detail)}</p>
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
  const resultBox = document.querySelector("#masterCreateResult");
  submitButton.disabled = true;
  submitButton.textContent = editingAssignmentWindowId ? "Updating..." : "Adding...";
  resultBox.textContent = "";
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
    resultBox.textContent = `${window.name} dispatch window ${wasEditing ? "updated" : "added"}.`;
    await loadState();
  } catch (error) {
    resultBox.textContent = error.message;
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
  switchMasterTab(activeMasterTab);
  document.querySelector("#outletBoard").innerHTML = state.outlets.length
    ? state.outlets.map((outlet) => {
      const location = state.outletLocations?.[outlet] || {};
      const coordinates = location.latitude !== null && location.latitude !== undefined && location.longitude !== null && location.longitude !== undefined
        ? `${location.latitude}, ${location.longitude}`
        : "";
      return masterEntry({
        editAttr: `data-edit-outlet="${escapeHtml(outlet)}"`,
        title: escapeHtml(outlet),
        detail: escapeHtml(location.address || coordinates || "Location pending"),
        deleteValue: `outlets:${escapeHtml(outlet)}:${escapeHtml(outlet)}`
      });
    }).join("")
    : `<div class="empty mini">No outlets yet.</div>`;

  document.querySelector("#categoryBoard").innerHTML = (state.categories || []).length
    ? state.categories.map((category) => masterEntry({
      editAttr: `data-edit-category="${escapeHtml(category.id)}"`,
      title: escapeHtml(category.name),
      detail: escapeHtml(category.description || "Category"),
      deleteValue: `categories:${escapeHtml(category.id)}:${escapeHtml(category.name)}`
    })).join("")
    : `<div class="empty mini">No categories yet.</div>`;

  document.querySelector("#assetBoard").innerHTML = (state.assets || []).length
    ? state.assets.map((asset) => masterEntry({
      className: `asset-row status-${token(asset.status)}`,
      editAttr: `data-edit-asset="${escapeHtml(asset.id)}"`,
      title: escapeHtml(asset.name),
      detail: `${escapeHtml(asset.outlet)} / ${escapeHtml(asset.category)} / ${escapeHtml(asset.code || "No code")}`,
      deleteValue: `assets:${escapeHtml(asset.id)}:${escapeHtml(asset.name)}`
    })).join("")
    : `<div class="empty mini">No assets yet.</div>`;

  document.querySelector("#technicianMasterBoard").innerHTML = state.technicians.length
    ? state.technicians.map((tech) => masterEntry({
      className: `status-${token(tech.status)}`,
      editAttr: `data-edit-technician="${escapeHtml(tech.id)}"`,
      title: escapeHtml(tech.name),
      detail: `${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(serviceAreaLabel(tech))}`,
      deleteValue: `technicians:${escapeHtml(tech.id)}:${escapeHtml(tech.name)}`
    })).join("")
    : `<div class="empty mini">No technicians yet.</div>`;

  const peopleBoard = document.querySelector("#peopleAccessBoard");
  if (peopleBoard) {
    peopleBoard.innerHTML = directoryUsers.length
      ? directoryUsers.map((user) => masterEntry({
        editAttr: `data-edit-user-access="${escapeHtml(user.id)}"`,
        title: `${escapeHtml(user.name)} / ${escapeHtml(user.role)}`,
        detail: `${escapeHtml(user.username)} / ${escapeHtml(userOutletLabel(user))}${user.address ? ` / ${escapeHtml(user.address)}` : ""}`,
        deleteValue: `admin/users:${escapeHtml(user.id)}:${escapeHtml(user.username)}`
      })).join("")
      : `<div class="empty mini">No users yet.</div>`;
  }

  const assignmentTimeBoard = document.querySelector("#assignmentTimeBoard");
  if (assignmentTimeBoard) {
    const windows = [...(state.assignmentTimeWindows || [])]
      .sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")) || String(a.name || "").localeCompare(String(b.name || "")));
    assignmentTimeBoard.innerHTML = windows.length
      ? windows.map(renderAssignmentTimeRow).join("")
      : `<div class="empty mini">No dispatch time windows yet. Until a window is added, assignment is open all day.</div>`;
  }
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
  document.querySelector("#attendanceBoard").innerHTML = state.technicians.map((tech) => {
    const techLoad = workload.find((item) => item.id === tech.id)?.openTickets || 0;
    const statusClass = `status-${token(tech.status)}`;
    const activePlan = tech.activeAttendancePlan;
    const nextPlan = (tech.attendancePlans || []).find((plan) => plan.id !== activePlan?.id);
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
        <select class="status-select" data-tech-status="${escapeHtml(tech.id)}" aria-label="Status for ${escapeHtml(tech.name)}">
          ${["Present", "Busy", "Break", "On Leave", "Absent", "Off Duty", "Emergency Available"].map((status) => (
            `<option ${tech.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`
          )).join("")}
        </select>
      </article>
    `;
  }).join("");

  document.querySelector("#adminTechnicianDashboard").innerHTML = state.technicians.length
    ? state.technicians.map((tech) => {
      const techTickets = state.tickets.filter((ticket) => ticket.assignedTo === tech.id && ticket.status !== "Closed");
      const techTasks = (state.tasks || []).filter((task) => task.assignedTo === tech.id);
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

      return `
        <article class="admin-tech-card status-${token(tech.status)}">
          <div class="admin-tech-top">
            <div>
              <strong>${escapeHtml(tech.name)}</strong>
              <span>${escapeHtml(technicianSkillLabel(tech))} / ${escapeHtml(tech.status)}</span>
            </div>
            <span class="badge">${completion}% checklist</span>
          </div>
          <div class="admin-tech-stats">
            <span><strong>${doneTasks}</strong><small>done</small></span>
            <span><strong>${pendingTasks}</strong><small>pending</small></span>
            <span><strong>${notDoneTasks}</strong><small>not done</small></span>
            <span><strong>${techTickets.length}</strong><small>tickets</small></span>
            <span><strong>${blockedTickets}</strong><small>blocked</small></span>
          </div>
          <p>${escapeHtml(nextWork)}</p>
          <div class="mini-progress" aria-label="Checklist progress">
            <span style="width: ${completion}%"></span>
          </div>
        </article>
      `;
    }).join("")
    : `<div class="empty">No technicians found.</div>`;

  document.querySelector("#adminTickets").innerHTML = openTickets.length
    ? renderAdminTicketQueue(openTickets)
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
  const tomorrowIsMonday = new Date(`${tomorrow}T00:00:00`).getDay() === 1;
  const previewRules = activeRules.filter((rule) => rule.frequency === "daily" || (rule.frequency === "weekly" && tomorrowIsMonday));

  document.querySelector("#maintenanceRulesBoard").innerHTML = rules.length
    ? rules.map((rule) => `
      <article class="rule-row ${rule.active === false ? "is-paused" : ""}">
        <div>
          <strong>${escapeHtml(rule.title)}</strong>
          <span>${escapeHtml(rule.category)} / ${escapeHtml(rule.phase || "Checklist")} / ${escapeHtml(rule.frequency)} / ${escapeHtml(maintenanceRuleTechnicianLabel(rule))}${rule.allowOutsideWindow ? " / outside window allowed" : ""}</span>
        </div>
        <div class="rule-actions">
          <button class="small-button" data-edit-rule="${escapeHtml(rule.id)}">Edit</button>
          <button class="small-button ${rule.active === false ? "success" : "warning"}" data-rule-toggle="${escapeHtml(rule.id)}:${rule.active === false ? "true" : "false"}">
            ${rule.active === false ? "Enable" : "Pause"}
          </button>
        </div>
      </article>
    `).join("")
    : `<div class="empty mini">No scheduler rules yet.</div>`;

  const preview = [];
  const previewLoad = new Map((state.technicians || []).map((tech) => [tech.id, 0]));
  const previewTechnicians = [...(state.technicians || [])].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const pickPreviewTechnician = () => previewTechnicians.reduce((selected, tech) => {
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
      const technician = rule.assignedTechnicianId
        ? previewTechnicians.find((tech) => tech.id === rule.assignedTechnicianId) || pickPreviewTechnician()
        : pickPreviewTechnician();
      if (!asset || !technician) return;
      preview.push({ rule, outlet, asset, technician });
      previewLoad.set(technician.id, (previewLoad.get(technician.id) || 0) + 1);
    });
  });

  document.querySelector("#maintenancePreviewBoard").innerHTML = preview.length
    ? preview.slice(0, 12).map((item) => `
      <article class="rule-row">
        <div>
          <strong>${escapeHtml(item.rule.phase || "Checklist")}: ${escapeHtml(item.rule.title)}</strong>
          <span>${escapeHtml(item.outlet)} / ${escapeHtml(item.asset.name)} / ${escapeHtml(item.technician.name)}${item.rule.allowOutsideWindow ? " / outside window allowed" : ""}</span>
        </div>
      </article>
    `).join("") + (preview.length > 12 ? `<div class="empty mini">${preview.length - 12} more tasks will generate.</div>` : "")
    : `<div class="empty mini">No task will generate tomorrow from active rules.</div>`;
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

function renderClosedHistory() {
  const closedTickets = ticketsForCurrentUser(state.tickets)
    .filter((ticket) => ticket.status === "Closed")
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
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
    ? closedTickets.map((ticket) => ticketCard(ticket, "archive")).join("")
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

  dashboard.innerHTML = activeTech ? `
    <div class="technician-simple-dashboard">
      ${[
        ["Active", activeTickets.length],
        ["Running", runningTickets.length],
        ["Blocked", blockedTickets.length],
        ["Done", doneTickets.length]
      ].map(([label, count]) => `
        <article class="technician-simple-stat status-${token(label)}">
          <span>${escapeHtml(label)}</span>
          <strong>${count}</strong>
        </article>
      `).join("")}
    </div>
  ` : `<div class="empty">No technician selected.</div>`;

  ticketTools.innerHTML = activeTech ? `
    <details class="technician-raise-ticket technician-ticket-tools">
      <summary>Create field ticket</summary>
      <form id="technicianTicketForm" class="ticket-form compact-ticket-form technician-ticket-form">
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
          Details
          <input id="technicianTicketNote" required placeholder="What needs to be done">
        </label>
        <label class="photo-upload">
          Photos
          <input id="technicianTicketPhotos" type="file" accept="image/*" capture="environment" multiple>
        </label>
        <button type="submit" class="primary-button">Create Ticket</button>
        <p id="technicianTicketResult" class="form-hint" aria-live="polite"></p>
      </form>
    </details>
  ` : "";

  ticketBoard.innerHTML = activeTech
    ? tickets.length
      ? tickets.map((ticket) => ticketCard(ticket, "technician")).join("")
      : `<div class="empty">No assigned tickets right now.</div>`
    : "";
}

function ticketsByStatus(status) {
  return state.tickets.filter((ticket) => ticket.status === status).length;
}

function ticketsByStatuses(statuses) {
  return state.tickets.filter((ticket) => statuses.includes(ticket.status)).length;
}

function scopedTasks() {
  if (currentUser?.role === "manager" && currentUser.outlet) {
    return (state.tasks || []).filter((task) => task.outlet === currentUser.outlet);
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

function renderReports() {
  const config = roleReportConfig();
  document.querySelector("#reportsTitle").textContent = config.title;
  document.querySelector("#reportsScope").textContent = config.scope;
  document.querySelector("#reportExportActions").innerHTML = currentUser?.role === "admin" ? `
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
    ${renderAlerts()}
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
        <select data-password-reset-user required>
          <option value="">Choose user</option>
          ${directoryUsers.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} / ${escapeHtml(user.role)} / ${escapeHtml(user.username)}</option>`).join("")}
        </select>
        <input data-password-reset-value type="text" placeholder="New password, min 8 characters" minlength="8">
        <button class="small-button warning" type="submit">Reset Password</button>
      </form>
      <p class="password-feedback" data-password-reset-status>Leave the password field blank to auto-generate a temporary password.</p>
    </div>
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
  document.querySelector("#systemBoard").innerHTML = `
    <article class="system-card">
      <span>API Target</span>
      <strong>${escapeHtml(apiLabel)}</strong>
      <p>Frontend requests are routed through the TicketOps REST API.</p>
    </article>
    <article class="system-card">
      <span>Storage</span>
      <strong>${escapeHtml(state.storage === "supabase" ? "Supabase" : "Local JSON")}</strong>
      <p>${state.storage === "supabase" ? "Persistent cloud database active." : "Local fallback active for desktop testing."}</p>
    </article>
    <article class="system-card">
      <span>Render Ready</span>
      <strong>${state.storage === "supabase" ? "Yes" : "Needs Supabase env"}</strong>
      <p>Production should run with REQUIRE_SUPABASE=true.</p>
    </article>
    <article class="system-card">
      <span>App URL</span>
      <strong>${escapeHtml(currentUrl)}</strong>
      <p>Use deployed Render URL for mobile API configuration.</p>
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
  const verificationPending = state.tickets.filter((ticket) => ["Resolved", "Verification Pending"].includes(ticket.status)).length;

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

  document.querySelector("#storageMode").textContent = state.storage === "supabase" ? "Supabase live store" : "Local demo store";
  document.querySelector("#syncStatus").textContent = `Synced ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function render() {
  renderAuthChrome();
  renderDashboard();
  renderStagePulse();

  if (canUseView("manager")) {
    renderManager();
  } else {
    document.querySelector("#managerTickets").innerHTML = "";
  }

  if (canUseView("admin")) {
    renderAdmin();
  } else {
    document.querySelector("#adminTechnicianDashboard").innerHTML = "";
    document.querySelector("#adminTickets").innerHTML = "";
    document.querySelector("#attendanceBoard").innerHTML = "";
  }

  if (canUseView("scheduler")) {
    renderMaintenanceScheduler();
  } else {
    document.querySelector("#maintenanceRulesBoard").innerHTML = "";
    document.querySelector("#maintenancePreviewBoard").innerHTML = "";
  }

  if (canUseView("masters")) {
    renderMasters();
  } else {
    document.querySelector("#outletBoard").innerHTML = "";
    document.querySelector("#categoryBoard").innerHTML = "";
    document.querySelector("#assetBoard").innerHTML = "";
    document.querySelector("#technicianMasterBoard").innerHTML = "";
    document.querySelector("#peopleAccessBoard").innerHTML = "";
  }

  if (canUseView("technician")) {
    renderTechnician();
  } else {
    document.querySelector("#technicianDashboard").innerHTML = "";
    document.querySelector("#technicianTickets").innerHTML = "";
    document.querySelector("#technicianAttendanceTools").innerHTML = "";
  }

  if (canUseView("reports")) {
    renderReports();
  } else {
    document.querySelector("#reportExportActions").innerHTML = "";
    document.querySelector("#reportsBoard").innerHTML = "";
  }

  if (canUseView("history")) {
    renderClosedHistory();
  } else {
    document.querySelector("#historyStats").innerHTML = "";
    document.querySelector("#closedTicketHistory").innerHTML = "";
  }

  renderUtilityViews();
}

function switchView(viewName) {
  const nextView = canOpenView(viewName) ? viewName : allowedViews()[0];
  if (!nextView) return;

  document.body.dataset.view = nextView;
  document.querySelectorAll(".tab[data-view]").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === nextView));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === nextView));
  closeMobileNav();
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
  document.querySelector("#saveApiBase").addEventListener("click", () => {
    localStorage.setItem("ticketops-api-base", document.querySelector("#apiBaseInput").value.trim());
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

document.querySelector("#loginForm").addEventListener("submit", handleLogin);

document.querySelectorAll(".tab[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelector("#ticketForm").addEventListener("submit", createTicket);
document.querySelector("#ticketImpact").addEventListener("change", updateTicketPriorityPreview);
document.querySelector("#ticketCategory").addEventListener("change", updateTicketPriorityPreview);
document.querySelector("#ticketNote").addEventListener("input", updateTicketPriorityPreview);
document.querySelector("#assetForm").addEventListener("submit", saveAssetMaster);
document.querySelector("#assetCancel").addEventListener("click", resetAssetForm);
document.querySelector("#outletForm").addEventListener("submit", createOutlet);
document.querySelector("#outletCancel").addEventListener("click", resetOutletForm);
document.querySelector("#categoryForm").addEventListener("submit", createCategory);
document.querySelector("#categoryCancel").addEventListener("click", resetCategoryForm);
document.querySelector("#technicianForm").addEventListener("submit", saveTechnicianMaster);
document.querySelector("#technicianCancel").addEventListener("click", resetTechnicianForm);
document.querySelector("#userAccessForm").addEventListener("submit", saveUserAccess);
document.querySelector("#userAccessCancel").addEventListener("click", resetUserAccessForm);
document.querySelector("#assignmentWindowForm").addEventListener("submit", saveAssignmentWindow);
document.querySelector("#assignmentWindowCancel").addEventListener("click", resetAssignmentWindowForm);
document.querySelector("#maintenanceRuleForm").addEventListener("submit", createMaintenanceRule);
document.querySelector("#ruleCancel").addEventListener("click", resetMaintenanceRuleForm);
document.querySelector("#activeTechnician").addEventListener("change", renderTechnician);
document.querySelectorAll("[data-master-tab]").forEach((button) => {
  button.addEventListener("click", () => switchMasterTab(button.dataset.masterTab));
});
document.querySelector("#logoutButton").addEventListener("click", () => {
  clearUser();
  showLogin();
});
document.querySelector("#sidebarToggle").addEventListener("click", () => {
  if (!currentUser) return;
  toggleMobileNav();
});
document.querySelector("#navBackdrop").addEventListener("click", closeMobileNav);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileNav();
});
document.querySelector("#resetData").addEventListener("click", async () => {
  if (currentUser?.role !== "admin") return;
  await api("/api/reset", { method: "POST" });
  await loadState();
});

document.addEventListener("click", async (event) => {
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
    if (photos.length) {
      const viewer = window.open("", "_blank");
      if (viewer) {
        viewer.document.write(`<title>${escapeHtml(ticket.id)} issue photos</title>${photos.map((photo, index) => `<img src="${escapeHtml(photo)}" alt="Issue photo ${index + 1}" style="max-width:100%;height:auto;display:block;margin:0 auto 16px;">`).join("")}`);
        viewer.document.close();
      }
    }
    return;
  }

  const resolutionPhotoButton = event.target.closest?.("[data-resolution-photo-open]");
  if (resolutionPhotoButton) {
    const ticket = state.tickets.find((item) => item.id === resolutionPhotoButton.dataset.resolutionPhotoOpen);
    const photos = (ticket?.resolutionPhotoUrls || []).filter(Boolean);
    if (photos.length) {
      const viewer = window.open("", "_blank");
      if (viewer) {
        viewer.document.write(`<title>${escapeHtml(ticket.id)} completion photos</title>${photos.map((photo, index) => `<img src="${escapeHtml(photo)}" alt="Completion photo ${index + 1}" style="max-width:100%;height:auto;display:block;margin:0 auto 16px;">`).join("")}`);
        viewer.document.close();
      }
    }
    return;
  }

  const taskPhotoButton = event.target.closest?.("[data-task-photo]");
  if (taskPhotoButton) {
    const task = (state.tasks || []).find((item) => item.id === taskPhotoButton.dataset.taskPhoto);
    if (task?.evidencePhotoUrl) {
      const viewer = window.open("", "_blank");
      if (viewer) {
        viewer.document.write(`<title>${escapeHtml(task.id)} evidence</title><img src="${escapeHtml(task.evidencePhotoUrl)}" alt="Checklist evidence" style="max-width:100%;height:auto;display:block;margin:0 auto;">`);
        viewer.document.close();
      }
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
    const detail = detailForStatus(status);
    if (["Blocked", "Resolved", "Reopened"].includes(status) && !detail.trim()) return;
    try {
      await setTicketStatus(ticketId, status, detail);
    } catch (error) {
      window.alert(error.message);
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
      window.alert(error.message);
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
      window.alert(error.message);
    }
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
      window.alert(error.message);
    }
    return;
  }

  const taskNotDoneButton = event.target.closest?.("[data-task-not-done]");
  if (taskNotDoneButton) {
    const task = (state.tasks || []).find((item) => item.id === taskNotDoneButton.dataset.taskNotDone);
    if (!task) return;
    const reason = window.prompt("Why is the checkup not done?", "Could not complete this time");
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert("Reason is required.");
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
    if (status) status.textContent = `${result.username} reset. Temporary password: ${result.temporaryPassword}`;
    passwordInput.value = "";
  } catch (error) {
    if (status) status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Reset Password";
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "assignmentWindowAllDays") {
    [...document.querySelectorAll('input[name="assignmentWindowDays"]')].forEach((input) => {
      input.checked = event.target.checked;
    });
    return;
  }

  const techId = event.target.dataset.techStatus;
  if (!techId) return;
  await updateTechnicianStatus(techId, event.target.value);
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
}, 15000);

window.addEventListener("resize", () => {
  if (!isMobileNav()) closeMobileNav();
  if (currentUser) renderAuthChrome();
});
