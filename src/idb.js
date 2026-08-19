const IDB_NAME = "punchlist_photos";
const IDB_STORE = "photos";
// Retain the old store only so deleting a project also removes data created by
// pre-simplification releases. The app no longer reads or writes snapshots.
const LEGACY_ISSUE_STORE = "issue_snapshots";

// One connection is shared by every call. Re-opening per operation leaked a
// new IDBDatabase for each photo write (there is one per pan/zoom step).
let dbPromise = null;

function openPhotoDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
      if (!db.objectStoreNames.contains(LEGACY_ISSUE_STORE)) {
        db.createObjectStore(LEGACY_ISSUE_STORE);
      }
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      // Drop the cached handle if the connection goes away so the next call
      // re-opens instead of failing on a dead database.
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

// Keys are stored as "[projectId]:[itemId]" to namespace per project.
const makeKey = (projectId, itemId) => `${projectId}:${itemId}`;

export async function idbGetAllPhotos(projectId) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const result = {};
    const prefix = projectId ? `${projectId}:` : null;
    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const key = cursor.key;
        if (!prefix || key.startsWith(prefix)) {
          // Strip prefix so callers get bare item IDs as keys
          const itemId = prefix ? key.slice(prefix.length) : key;
          result[itemId] = cursor.value;
        }
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    tx.onerror = (e) => reject(e.target.error);
  });
}

/** Save a photo entry. Value is { dataUrl, position } */
export async function idbSetPhoto(projectId, itemId, value) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, makeKey(projectId, itemId));
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/** Clear all photos for a specific project (or everything if no projectId). */
export async function idbClearAll(projectId) {
  const db = await openPhotoDB();
  if (!projectId) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([IDB_STORE, LEGACY_ISSUE_STORE], "readwrite");
      tx.objectStore(IDB_STORE).clear();
      tx.objectStore(LEGACY_ISSUE_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  }
  // Delete current photos and any legacy snapshots belonging to this project.
  return new Promise((resolve, reject) => {
    const tx = db.transaction([IDB_STORE, LEGACY_ISSUE_STORE], "readwrite");
    const prefix = `${projectId}:`;
    [IDB_STORE, LEGACY_ISSUE_STORE].forEach((storeName) => {
      const store = tx.objectStore(storeName);
      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) return;
        if (String(cursor.key).startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
    });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/** Clear only the photos attached to the current working document. */
export async function idbClearProjectPhotos(projectId) {
  if (!projectId) return;
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const prefix = `${projectId}:`;
    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/** Copy every photo belonging to one project across to another project. */
export async function idbCopyProjectPhotos(fromProjectId, toProjectId) {
  if (!fromProjectId || !toProjectId || fromProjectId === toProjectId) return;

  const photos = await idbGetAllPhotos(fromProjectId);
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    Object.entries(photos).forEach(([itemId, value]) => {
      store.put(value, makeKey(toProjectId, itemId));
    });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

/** Bare item IDs that currently have a photo stored for this project. */
export async function idbListPhotoIds(projectId) {
  if (!projectId) return [];
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const prefix = `${projectId}:`;
    const ids = [];
    tx.objectStore(IDB_STORE).openKeyCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) {
        resolve(ids);
        return;
      }
      const key = String(cursor.key);
      if (key.startsWith(prefix)) ids.push(key.slice(prefix.length));
      cursor.continue();
    };
    tx.onerror = (e) => reject(e.target.error);
  });
}

/** Delete an explicit list of this project's photos in one transaction. */
export async function idbDeletePhotos(projectId, itemIds = []) {
  if (!projectId || itemIds.length === 0) return;
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    itemIds.forEach((itemId) => store.delete(makeKey(projectId, itemId)));
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function idbDeletePhoto(projectId, itemId) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(makeKey(projectId, itemId));
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}
