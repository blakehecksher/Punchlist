// @ts-check
/**
 * Where backup files get written.
 *
 * The default is the browser's own download folder, which needs no permission
 * and no setup. A user who wants their punch list backups somewhere specific
 * can pick a folder once; the directory handle is kept in IndexedDB (handles
 * are structured-cloneable but not JSON-serialisable, so localStorage cannot
 * hold one) and reused for every later backup.
 *
 * Every path here degrades to the download folder rather than failing: a
 * backup that lands somewhere unexpected is recoverable, one that never gets
 * written is not.
 */

const DB_NAME = "punchlist_settings";
const STORE = "settings";
const DIRECTORY_KEY = "backupDirectory";

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

function openSettingsDB() {
  if (dbPromise) return dbPromise;

  // Reading `req.result` directly rather than off the event target: it is the
  // same value, and the event's target is typed as a bare EventTarget.
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        dbPromise = null;
        db.close();
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  }).catch((error) => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

/**
 * @param {string} key
 * @returns {Promise<any>}
 */
function readSetting(key) {
  return openSettingsDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

/**
 * @param {string} key
 * @param {unknown} value
 * @returns {Promise<void>}
 */
function writeSetting(key, value) {
  return openSettingsDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        if (value === null) store.delete(key);
        else store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

/** Whether this browser can offer a folder choice at all. */
export function isFolderChoiceSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.showDirectoryPicker === "function"
  );
}

/**
 * Pick a backup folder. Must be called from a user gesture.
 *
 * Reports which of four things happened, because they need different
 * responses: a cancel is deliberate and needs no message, while a refused
 * permission leaves the user thinking they set something up when they did not.
 *
 * Returns { status, name } where status is one of:
 *   "chosen"      the folder is stored and writable
 *   "cancelled"   the picker was dismissed, or the browser refused the folder
 *                 (both surface as an abort, so they cannot be told apart)
 *   "denied"      a folder was picked but permission to write was refused
 *   "unsupported" this browser has no directory picker
 */
/** @returns {Promise<{ status: string, name: string | null }>} */
export async function chooseBackupFolder() {
  if (!isFolderChoiceSupported()) return { status: "unsupported", name: null };

  const picker = window.showDirectoryPicker;
  if (!picker) return { status: "unsupported", name: null };

  /** @type {FileSystemDirectoryHandle} */
  let handle;
  try {
    handle = await picker.call(window, {
      id: "punchlist-backups",
      mode: "readwrite",
      startIn: "documents",
    });
  } catch {
    // AbortError when the picker is dismissed. The browser also blocks folders
    // holding system files; declining that prompt aborts the picker the same
    // way, so the two are indistinguishable here.
    return { status: "cancelled", name: null };
  }

  if (!(await requestWritePermission(handle))) {
    return { status: "denied", name: handle.name };
  }

  await writeSetting(DIRECTORY_KEY, handle);
  return { status: "chosen", name: handle.name };
}

/**
 * Re-request permission on the folder already chosen. Needs a user gesture.
 *
 * Browsers drop write permission between sessions, which leaves a folder
 * configured but unusable. Rather than silently writing somewhere else
 * forever, the user gets one click to restore it.
 */
/** @returns {Promise<boolean>} */
export async function reconnectBackupFolder() {
  try {
    const handle = await readSetting(DIRECTORY_KEY);
    if (!handle) return false;
    return await requestWritePermission(handle);
  } catch {
    return false;
  }
}

/** Forget the chosen folder and go back to the download folder. */
export async function clearBackupFolder() {
  await writeSetting(DIRECTORY_KEY, null);
}

/**
 * The stored folder handle, or null.
 *
 * Only returns a handle that is already writable. Re-prompting for permission
 * needs a user gesture, and this is called from the backup path, so a handle
 * whose permission has lapsed is reported as absent and the caller falls back
 * to the download folder.
 */
/** @returns {Promise<FileSystemDirectoryHandle | null>} */
export async function getWritableBackupFolder() {
  let handle;
  try {
    handle = await readSetting(DIRECTORY_KEY);
  } catch {
    return null;
  }
  if (!handle?.queryPermission) return null;

  try {
    const state = await handle.queryPermission({ mode: "readwrite" });
    return state === "granted" ? handle : null;
  } catch {
    return null;
  }
}

/**
 * The chosen folder's name and whether it can actually be written to.
 *
 * The name alone is not enough to display: a folder whose permission has
 * lapsed still has a name, and showing it on its own tells the user their
 * backups are going somewhere they are not. The permission state is what the
 * UI needs in order to be honest about where the next backup will land.
 *
 * Returns { name, permission } where permission is "granted", "prompt",
 * "denied", or "none" when no folder is configured.
 */
/** @returns {Promise<{ name: string | null, permission: string }>} */
export async function getBackupFolderStatus() {
  let handle;
  try {
    handle = await readSetting(DIRECTORY_KEY);
  } catch {
    return { name: null, permission: "none" };
  }

  if (!handle) return { name: null, permission: "none" };
  if (!handle.queryPermission) return { name: handle.name ?? null, permission: "denied" };

  try {
    const state = await handle.queryPermission({ mode: "readwrite" });
    return { name: handle.name ?? null, permission: state };
  } catch {
    return { name: handle.name ?? null, permission: "denied" };
  }
}

/**
 * Ask for write permission on a handle. Must be called from a user gesture.
 * @param {FileSystemHandle | null | undefined} handle
 * @returns {Promise<boolean>}
 */
export async function requestWritePermission(handle) {
  if (!handle?.queryPermission) return false;
  try {
    if ((await handle.queryPermission({ mode: "readwrite" })) === "granted") {
      return true;
    }
    return (await handle.requestPermission({ mode: "readwrite" })) === "granted";
  } catch {
    return false;
  }
}

/**
 * Pick a name that is not already taken, matching how the browser handles a
 * repeat download: "name.json", then "name (1).json", and so on.
 *
 * Overwriting would be tidier but risks replacing a good backup with a worse
 * one, so a repeat backup on the same day gets its own file instead.
 */
/**
 * @param {string} filename
 * @param {(name: string) => Promise<boolean>} exists
 * @param {number} [limit]
 * @returns {Promise<string>}
 */
export async function findAvailableName(filename, exists, limit = 50) {
  if (!(await exists(filename))) return filename;

  const dot = filename.lastIndexOf(".");
  const stem = dot === -1 ? filename : filename.slice(0, dot);
  const ext = dot === -1 ? "" : filename.slice(dot);

  for (let n = 1; n <= limit; n += 1) {
    const candidate = `${stem} (${n})${ext}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${stem} (${Date.now()})${ext}`;
}

/**
 * Write one file into a directory handle, without overwriting.
 *
 * Takes the handle rather than looking it up so the write logic can be tested
 * without a browser. Resolves with the file name actually used, or null if the
 * write failed for any reason — folder deleted, drive unplugged, quota,
 * permission revoked mid-write — so the caller can fall back.
 */
/**
 * @param {FileSystemDirectoryHandle | null | undefined} directory
 * @param {string} filename
 * @param {string} contents
 * @returns {Promise<string | null>} the name written, or null on any failure
 */
export async function writeIntoDirectory(directory, filename, contents) {
  if (!directory?.getFileHandle) return null;

  try {
    /** @param {string} name */
    const exists = async (name) => {
      try {
        await directory.getFileHandle(name);
        return true;
      } catch {
        return false;
      }
    };

    const name = await findAvailableName(filename, exists);
    const fileHandle = await directory.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
    return name;
  } catch {
    return null;
  }
}

/**
 * Write into the chosen folder. Resolves with the file name actually used, or
 * null when there is no usable folder and the caller should fall back.
 */
/**
 * @param {string} filename
 * @param {string} contents
 * @returns {Promise<string | null>}
 */
export async function writeToBackupFolder(filename, contents) {
  return writeIntoDirectory(await getWritableBackupFolder(), filename, contents);
}
