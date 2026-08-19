// @ts-check
/** @param {Date} date */
const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

/**
 * Dates from the removed issuance workflow, kept so an old project's history
 * migrates into the editable document ending instead of being lost.
 *
 * @param {{ history?: { issuedAt?: string }[] } | null | undefined} issuance
 * @returns {string}
 */
export function getLegacyEndDates(issuance) {
  /** @type {{ issuedAt?: string }[]} */
  const history = Array.isArray(issuance?.history) ? issuance.history : [];
  return [
    ...new Set(
      history
        .map((record) => new Date(record.issuedAt ?? ""))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map(formatDate),
    ),
  ].join(", ");
}

/**
 * @param {{
 *   endOfPunchListEntries?: unknown,
 *   endOfPunchListDates?: unknown,
 *   issuance?: { history?: { issuedAt?: string }[] },
 * } | null | undefined} stored
 * @returns {string[]}
 */
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

/**
 * @param {string} [documentDate]
 * @returns {string}
 */
export function makeDocumentEndEntry(documentDate = "") {
  const date = String(documentDate).trim();
  return date ? `Punch List issued ${date}` : "Punch List issued";
}
