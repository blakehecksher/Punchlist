const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

export function getLegacyEndDates(issuance) {
  const history = Array.isArray(issuance?.history) ? issuance.history : [];
  return [
    ...new Set(
      history
        .map((record) => new Date(record.issuedAt))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map(formatDate),
    ),
  ].join(", ");
}

export function normalizeDocumentEndEntries(stored = {}) {
  if (Array.isArray(stored.endOfPunchListEntries)) {
    return stored.endOfPunchListEntries.map((entry) => String(entry ?? ""));
  }

  if (typeof stored.endOfPunchListDates === "string") {
    const previousText = stored.endOfPunchListDates.trim();
    if (previousText) return [previousText];
  }

  const legacyDates = getLegacyEndDates(stored.issuance);
  return legacyDates ? [legacyDates] : [];
}

export function makeDocumentEndEntry(documentDate = "") {
  const date = String(documentDate).trim();
  return date ? `Punch List issued ${date}` : "Punch List issued";
}
