// @ts-check
/**
 * Shared punch-item helpers.
 *
 * Item state (new / revised / complete) is deliberately absent here: it is
 * read from the inline formatting of the description rather than stored, so
 * there is only ever one source of truth for it.
 */

export const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * Key a room name is matched by on re-import: case and spacing insensitive.
 * @param {string} name
 * @returns {string}
 */
export const normalizeRoomKey = (name) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * @param {string} [description]
 * @param {number} [issueSeq]
 * @returns {import("./types.js").Item}
 */
export const makeItem = (description = "", issueSeq = 1) => ({
  id: uid(),
  description,
  issueSeq,
  photo: null,
  photoPosition: null,
});
