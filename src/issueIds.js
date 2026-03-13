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

export function getRoomIssuePrefix(roomName = "") {
  const match = roomName.match(/\b\d{2,4}\b/);
  return match ? match[0] : "RM";
}

export function formatIssueCode(kind, title, issueSeq) {
  const prefix = kind === "generalNotes" ? "GN" : getRoomIssuePrefix(title);
  return `${prefix}-${String(issueSeq ?? 0).padStart(2, "0")}`;
}
