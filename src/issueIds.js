function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export function normalizeItemIssueSeqs(items = []) {
  const used = new Set();
  let nextCandidate = 1;
  const normalizedItems = items.map((item) => {
    if (isPositiveInteger(item.issueSeq) && !used.has(item.issueSeq)) {
      used.add(item.issueSeq);
      nextCandidate = Math.max(nextCandidate, item.issueSeq + 1);
      return item;
    }
    while (used.has(nextCandidate)) nextCandidate += 1;
    const issueSeq = nextCandidate;
    used.add(issueSeq);
    nextCandidate += 1;
    return { ...item, issueSeq };
  });

  const maxIssueSeq = normalizedItems.reduce(
    (max, item) => Math.max(max, item.issueSeq ?? 0),
    0,
  );

  return {
    items: normalizedItems,
    nextIssueSeq: maxIssueSeq + 1,
  };
}

export function getNextIssueSeq(items = [], nextIssueSeq = 1) {
  const normalizedNext = isPositiveInteger(nextIssueSeq) ? nextIssueSeq : 1;
  const maxIssueSeq = items.reduce(
    (max, item) =>
      isPositiveInteger(item.issueSeq) ? Math.max(max, item.issueSeq) : max,
    0,
  );
  return Math.max(normalizedNext, maxIssueSeq + 1);
}

const ROOM_NUMBER_RE = /\b\d{2,4}\b/;

/**
 * Rooms with no number in their name fall back to "000" rather than a letter
 * code. It sorts to the top of the document and reads as an obvious blank,
 * so the missing room number gets noticed and filled in.
 */
export const UNNUMBERED_ROOM_PREFIX = "000";

/** The pre-2026-07 fallback, still recognised when re-importing older notes. */
export const LEGACY_UNNUMBERED_ROOM_PREFIX = "RM";

export function isUnnumberedRoom(roomName = "") {
  return !ROOM_NUMBER_RE.test(roomName);
}

export function getRoomIssuePrefix(roomName = "") {
  const match = roomName.match(ROOM_NUMBER_RE);
  return match ? match[0] : UNNUMBERED_ROOM_PREFIX;
}

export function formatIssueCode(kind, title, issueSeq) {
  const prefix = kind === "generalNotes" ? "GN" : getRoomIssuePrefix(title);
  return `${prefix}-${String(issueSeq ?? 0).padStart(2, "0")}`;
}

/**
 * The code this item would have carried under the old "RM" fallback, so a
 * merge re-import of notes copied before the change still matches the
 * existing item instead of duplicating it. Null when there is no old form.
 */
export function formatLegacyIssueCode(kind, title, issueSeq) {
  if (kind === "generalNotes" || !isUnnumberedRoom(title)) return null;
  return `${LEGACY_UNNUMBERED_ROOM_PREFIX}-${String(issueSeq ?? 0).padStart(2, "0")}`;
}
