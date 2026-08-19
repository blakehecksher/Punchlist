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

export function normalizeDocumentEndEntries(stored) {
  // A default parameter only covers undefined. A missing or corrupt project
  // record reads back as null, which has to land on the same empty result.
  const record = stored ?? {};

  if (Array.isArray(record.endOfPunchListEntries)) {
    return record.endOfPunchListEntries.map((entry) => String(entry ?? ""));
  }

  if (typeof record.endOfPunchListDates === "string") {
    const previousText = record.endOfPunchListDates.trim();
    if (previousText) return [previousText];
  }

  const legacyDates = getLegacyEndDates(record.issuance);
  return legacyDates ? [legacyDates] : [];
}

export function makeDocumentEndEntry(documentDate = "") {
  const date = String(documentDate).trim();
  return date ? `Punch List issued ${date}` : "Punch List issued";
}
