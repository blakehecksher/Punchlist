/**
 * Shared punch-item helpers.
 *
 * Item state (new / revised / complete) is deliberately absent here: it is
 * read from the inline formatting of the description rather than stored, so
 * there is only ever one source of truth for it.
 */

export const uid = () => Math.random().toString(36).slice(2, 9);

export const normalizeRoomKey = (name) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

export const makeItem = (description = "", issueSeq = 1) => ({
  id: uid(),
  description,
  issueSeq,
  photo: null,
  photoPosition: null,
});
