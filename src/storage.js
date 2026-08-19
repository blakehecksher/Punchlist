// @ts-check
/**
 * Browser storage durability helpers.
 *
 * Project data lives only in this browser. By default an origin's storage is
 * "best-effort": the browser is allowed to evict IndexedDB and localStorage
 * without warning when the disk gets tight, which would take every project
 * and every photo with it. Asking for persistent storage removes that class
 * of silent loss.
 */

/**
 * Ask the browser to make this origin's storage persistent.
 *
 * Chrome grants this automatically for installed or frequently used sites and
 * otherwise declines silently, so this is a request rather than a guarantee.
 * Returns { supported, persisted } and never throws.
 */
export async function requestPersistentStorage() {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return { supported: false, persisted: false };
  }

  try {
    // Already-granted origins should not be re-prompted.
    if (navigator.storage.persisted) {
      const already = await navigator.storage.persisted();
      if (already) return { supported: true, persisted: true };
    }
    const persisted = await navigator.storage.persist();
    return { supported: true, persisted: Boolean(persisted) };
  } catch {
    return { supported: true, persisted: false };
  }
}

/**
 * Report how much of the origin's storage budget is in use.
 *
 * Returns { supported, usage, quota, ratio } with byte counts, or a
 * supported: false result where the API is missing. Never throws.
 */
export async function getStorageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { supported: false, usage: 0, quota: 0, ratio: 0 };
  }

  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return {
      supported: true,
      usage,
      quota,
      ratio: quota > 0 ? usage / quota : 0,
    };
  } catch {
    return { supported: false, usage: 0, quota: 0, ratio: 0 };
  }
}
