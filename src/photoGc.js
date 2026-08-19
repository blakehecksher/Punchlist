// @ts-check
/**
 * Orphaned photo detection.
 *
 * Removing an item or a room no longer deletes its photo from IndexedDB, so
 * undo can put the item back with its photo intact. The cost is that photos
 * whose items are really gone linger. This module finds them.
 *
 * Deleting a photo is irreversible, so nothing here deletes anything on its
 * own. The caller sweeps only after a backup file containing those exact
 * photos has been written, which makes the delete recoverable from that file.
 */

/**
 * Every item ID referenced by a project's working document.
 * @param {Pick<import("./types.js").ProjectData, "generalNotes" | "rooms"> | null | undefined} data
 * @returns {Set<string>}
 */
export function collectItemIds(data) {
  const ids = new Set();
  (data?.generalNotes ?? []).forEach((item) => {
    if (item?.id) ids.add(item.id);
  });
  (data?.rooms ?? []).forEach((room) => {
    (room?.items ?? []).forEach((item) => {
      if (item?.id) ids.add(item.id);
    });
  });
  return ids;
}

/**
 * Photo IDs with no matching item in the document.
 *
 * Guarded deliberately: a document with no items at all looks identical to a
 * document that failed to load, and in that case every photo would appear
 * orphaned. Refusing to report orphans there means a corrupt or half-loaded
 * read can never trigger a mass delete.
 */
/**
 * @param {Pick<import("./types.js").ProjectData, "generalNotes" | "rooms"> | null | undefined} data
 * @param {readonly string[]} [photoIds]
 * @returns {string[]}
 */
export function findOrphanPhotoIds(data, photoIds = []) {
  const itemIds = collectItemIds(data);
  if (itemIds.size === 0) return [];
  return [...photoIds].filter((photoId) => !itemIds.has(photoId));
}

/**
 * Narrow a set of candidate orphans to the ones that are provably inside a
 * backup payload. Only these are safe to delete: their bytes exist in the
 * file the user just saved, so the delete can be undone by reloading it.
 */
/**
 * @param {readonly string[]} [orphanIds]
 * @param {import("./types.js").PhotoMap | undefined} [backedUpPhotos]
 * @returns {string[]}
 */
export function selectRecoverableOrphans(orphanIds = [], backedUpPhotos = {}) {
  return orphanIds.filter((id) => Object.hasOwn(backedUpPhotos, id));
}
