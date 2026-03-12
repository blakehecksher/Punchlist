/**
 * Multi-project storage layer.
 *
 * Project index lives at localStorage key "pl_index" as JSON array of:
 *   { id, name, projectNum, lastSaved }
 *
 * Each project's text data lives at "pl_proj_[id]".
 * Active project ID lives at "pl_active".
 *
 * On first load we auto-migrate the legacy single-project key
 * "jbma_punchlist_925park" into the new format.
 */

const INDEX_KEY = "pl_index";
const ACTIVE_KEY = "pl_active";
const PROJ_KEY = (id) => `pl_proj_${id}`;
const LEGACY_KEY = "jbma_punchlist_925park";

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Index helpers ──────────────────────────────────────────────

export function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt */
  }
  return [];
}

function saveIndex(index) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

// ── Single project ─────────────────────────────────────────────

export function loadProjectData(id) {
  try {
    const raw = localStorage.getItem(PROJ_KEY(id));
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt */
  }
  return null;
}

export function saveProjectData(id, data) {
  localStorage.setItem(PROJ_KEY(id), JSON.stringify(data));
  // Update lastSaved + name in index
  const index = loadIndex();
  const entry = index.find((e) => e.id === id);
  const now = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (entry) {
    entry.name = data.project || "Untitled";
    entry.projectNum = data.projectNum || "";
    entry.lastSaved = now;
    saveIndex(index);
  }
}

export function deleteProject(id) {
  localStorage.removeItem(PROJ_KEY(id));
  const index = loadIndex().filter((e) => e.id !== id);
  saveIndex(index);
}

// ── Active project ─────────────────────────────────────────────

export function getActiveId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

// ── Create / duplicate ─────────────────────────────────────────

export function createProject(data) {
  const id = uid();
  const index = loadIndex();
  const now = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  index.push({
    id,
    name: data.project || "Untitled",
    projectNum: data.projectNum || "",
    lastSaved: now,
  });
  saveIndex(index);
  saveProjectData(id, data);
  return id;
}

// ── Legacy migration ───────────────────────────────────────────

/**
 * If the old single-project key exists and there is no pl_index yet,
 * migrate it into a new project entry. Returns the migrated project id
 * (or null if nothing to migrate).
 */
export function migrateLegacy() {
  // Only migrate if no index exists yet
  if (localStorage.getItem(INDEX_KEY)) return null;

  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    const id = createProject(data);
    setActiveId(id);
    localStorage.removeItem(LEGACY_KEY);
    return id;
  } catch {
    return null;
  }
}
