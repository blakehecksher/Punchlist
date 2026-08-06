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

/** Rooms without a number still use 000 unless they have a known area code. */
export const UNNUMBERED_ROOM_PREFIX = "000";
export const EXTERIOR_ROOM_PREFIX = "EXT";
export const GENERAL_NOTES_PREFIX = "GEN";

/** The pre-2026-07 fallback, still recognised when re-importing older notes. */
export const LEGACY_UNNUMBERED_ROOM_PREFIX = "RM";
export const LEGACY_GENERAL_NOTES_PREFIX = "GN";

export function isExteriorRoom(roomName = "") {
  return /\bexterior\b/i.test(roomName);
}

export function isUnnumberedRoom(roomName = "") {
  return !ROOM_NUMBER_RE.test(roomName) && !isExteriorRoom(roomName);
}

export function getRoomIssuePrefix(roomName = "") {
  const match = roomName.match(ROOM_NUMBER_RE);
  if (match) return match[0];
  return isExteriorRoom(roomName)
    ? EXTERIOR_ROOM_PREFIX
    : UNNUMBERED_ROOM_PREFIX;
}

export function formatIssueCode(kind, title, issueSeq) {
  const prefix =
    kind === "generalNotes" ? GENERAL_NOTES_PREFIX : getRoomIssuePrefix(title);
  return `${prefix}-${String(issueSeq ?? 0).padStart(2, "0")}`;
}

/**
 * Every older code this item may have carried, so re-importing a previously
 * exported outline still updates the existing item instead of duplicating it.
 */
export function formatLegacyIssueCodes(kind, title, issueSeq) {
  const sequence = String(issueSeq ?? 0).padStart(2, "0");
  if (kind === "generalNotes") {
    return [`${LEGACY_GENERAL_NOTES_PREFIX}-${sequence}`];
  }
  if (isExteriorRoom(title) && !ROOM_NUMBER_RE.test(title)) {
    return [
      `${UNNUMBERED_ROOM_PREFIX}-${sequence}`,
      `${LEGACY_UNNUMBERED_ROOM_PREFIX}-${sequence}`,
    ];
  }
  if (isUnnumberedRoom(title)) {
    return [`${LEGACY_UNNUMBERED_ROOM_PREFIX}-${sequence}`];
  }
  return [];
}
