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

let dbPromise = null;

function openSettingsDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        dbPromise = null;
        db.close();
      };
      resolve(db);
    };
    req.onerror = (e) => reject(e.target.error);
  }).catch((error) => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

function readSetting(key) {
  return openSettingsDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        tx.onerror = (e) => reject(e.target.error);
      }),
  );
}

function writeSetting(key, value) {
  return openSettingsDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        if (value === null) store.delete(key);
        else store.put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
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
 * Returns the chosen folder's name, or null if the user cancelled.
 */
export async function chooseBackupFolder() {
  if (!isFolderChoiceSupported()) return null;

  let handle;
  try {
    handle = await window.showDirectoryPicker({
      id: "punchlist-backups",
      mode: "readwrite",
      startIn: "documents",
    });
  } catch {
    // AbortError when the user closes the picker; nothing to report.
    return null;
  }

  if (!(await requestWritePermission(handle))) return null;

  await writeSetting(DIRECTORY_KEY, handle);
  return handle.name;
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

/** The stored folder's name for display, whether or not it is still granted. */
export async function getBackupFolderName() {
  try {
    const handle = await readSetting(DIRECTORY_KEY);
    return handle?.name ?? null;
  } catch {
    return null;
  }
}

/** Ask for write permission on a handle. Must be called from a user gesture. */
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
export async function writeIntoDirectory(directory, filename, contents) {
  if (!directory?.getFileHandle) return null;

  try {
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
export async function writeToBackupFolder(filename, contents) {
  return writeIntoDirectory(await getWritableBackupFolder(), filename, contents);
}
