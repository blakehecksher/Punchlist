const IDB_NAME = "punchlist_photos";
const IDB_STORE = "photos";

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
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
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  }
  // Delete only keys belonging to this project
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const prefix = `${projectId}:`;
    const keysToDelete = [];
    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (String(cursor.key).startsWith(prefix)) keysToDelete.push(cursor.key);
        cursor.continue();
      } else {
        keysToDelete.forEach((k) => store.delete(k));
      }
    };
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
