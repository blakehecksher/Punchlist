/**
 * Multi-project storage layer.
 *
 * Project index lives at localStorage key "pl_index" as JSON array of:
 *   { id, name, projectNum, lastSaved }
 *
 * Each project's text data lives at "pl_proj_[id]".
 * Active project ID lives at "pl_active".
 *
 * On first load we can migrate a legacy single-document key into the new
 * multi-document format.
 */

const INDEX_KEY = "punch_list_index_v2";
const ACTIVE_KEY = "punch_list_active_v2";
const PROJ_KEY = (id) => `punch_list_document_${id}`;
const LEGACY_KEY = "punch_list_legacy_document";

/**
 * Shape version stamped on every saved project record.
 *
 * Saved data outlives any single release: a project written today has to keep
 * opening after the document model changes. Recording which shape a record was
 * written in is what makes a later conversion possible instead of a guess.
 *
 * Bump this only when the stored shape changes in a way that needs converting,
 * and add the conversion at the same time. Records written before versioning
 * existed report version 0.
 */
export const SCHEMA_VERSION = 1;

/** Shape version a stored record was written with. 0 means pre-versioning. */
export function getRecordSchemaVersion(stored) {
  const version = Number(stored?.schemaVersion);
  return Number.isFinite(version) && version > 0 ? version : 0;
}

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Index helpers ──────────────────────────────────────────────

export function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((entry) => ({
        ...entry,
        name:
          entry.name === "Untitled" || entry.name === "Untitled document"
            ? "Untitled punch list"
            : entry.name,
      }));
    }
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
  localStorage.setItem(
    PROJ_KEY(id),
    JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION }),
  );
  // Update lastSaved + name in index
  const index = loadIndex();
  const entry = index.find((e) => e.id === id);
  if (entry) {
    entry.name = data.isExample
      ? `${data.project || "Example punch list"} (Example)`
      : data.project || "Untitled punch list";
    entry.projectNum = data.projectNum || "";
    entry.lastSaved = data.date || "";
    entry.isExample = Boolean(data.isExample);
    saveIndex(index);
  }
}

/**
 * Note that a project was just backed up to a file.
 *
 * Deleting a project is instant and total, so the delete confirmation shows
 * this: whether a recoverable copy exists is the one fact worth having at
 * that moment. Stored on the index rather than in the document so it survives
 * a document reset and never rides along into a backup file.
 */
export function recordBackup(id, when = new Date()) {
  const index = loadIndex();
  const entry = index.find((e) => e.id === id);
  if (!entry) return;
  entry.lastBackupAt = when.toISOString();
  saveIndex(index);
}

/**
 * How long ago a project was last written to a backup file.
 *
 * Deleting a project is instant and unrecoverable, so the confirm step says
 * whether a file exists to load back. Two clicks is enough friction; what was
 * missing is knowing the answer to "can I get this back?".
 */
export function describeBackupAge(lastBackupAt, now = new Date()) {
  if (!lastBackupAt) return "Never backed up";

  const then = new Date(lastBackupAt);
  if (Number.isNaN(then.getTime())) return "Never backed up";

  const minutes = Math.floor((now - then) / 60000);
  if (minutes < 1) return "Backed up just now";
  if (minutes < 60) return `Backed up ${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Backed up ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Backed up yesterday";
  return `Backed up ${days} days ago`;
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
  index.push({
    id,
    name: data.isExample
      ? `${data.project || "Example punch list"} (Example)`
      : data.project || "Untitled punch list",
    projectNum: data.projectNum || "",
    lastSaved: data.date || "",
    isExample: Boolean(data.isExample),
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
