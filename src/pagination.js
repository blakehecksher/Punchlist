import { getLayoutMetrics } from "./layout.js";

export const GENERAL_NOTES_SECTION_ID = "__general_notes__";
export const SUMMARY_ROWS_FIRST = 20;
export const SUMMARY_ROWS_OTHER = 32;
const SUMMARY_DESC_CHARS_PER_LINE = 125;
const MAX_SUMMARY_LINE_SPAN = 3;

function buildSections(data) {
  return [
    {
      sectionId: GENERAL_NOTES_SECTION_ID,
      kind: "generalNotes",
      title: data.generalNotesTitle || "General",
      items: data.generalNotes,
    },
    ...data.rooms.map((room) => ({
      sectionId: room.id,
      kind: "room",
      title: room.name,
      items: room.items,
    })),
  ];
}

function createRowGroup() {
  return {
    type: "rowGroup",
    sections: [],
    usedCols: 0,
  };
}

export function paginate(data, layout) {
  return paginateDetail(data, layout);
}

function estimateSummaryEntryRows(entry) {
  const description = `${entry.description ?? ""}`.trim();
  if (!description) return 1;

  const estimatedRows = description
    .split(/\n+/)
    .reduce(
      (total, line) =>
        total + Math.max(1, Math.ceil(line.trim().length / SUMMARY_DESC_CHARS_PER_LINE)),
      0,
    );

  return Math.max(1, Math.min(estimatedRows, MAX_SUMMARY_LINE_SPAN));
}

export function paginateSummary(entries) {
  if (entries.length === 0) return [];

  const pages = [];
  let index = 0;
  let isFirstPage = true;

  while (index < entries.length) {
    const rows = isFirstPage ? SUMMARY_ROWS_FIRST : SUMMARY_ROWS_OTHER;
    const page = [{ type: "header" }];
    const summaryEntries = [];
    let usedRows = 0;

    if (isFirstPage) page.push({ type: "siteConditions" });

    while (index < entries.length) {
      const lineSpan = Math.min(estimateSummaryEntryRows(entries[index]), rows);
      if (summaryEntries.length > 0 && usedRows + lineSpan > rows) break;

      summaryEntries.push({
        ...entries[index],
        lineSpan,
      });
      usedRows += lineSpan;
      index += 1;
    }

    page.push({
      type: "summary",
      entries: summaryEntries,
      rows,
      usedRows,
    });
    pages.push(page);
    isFirstPage = false;
  }

  return pages;
}

export function paginateDetail(data, layout, options = {}) {
  const { columns, firstPageRows, otherPageRows } = getLayoutMetrics(layout);
  const { includeSiteConditions = true } = options;
  const pages = [];
  const sections = buildSections(data);

  let isFirstPage = true;
  let rowsUsed = 0;
  let currentPage = [{ type: "header" }];
  if (includeSiteConditions) currentPage.push({ type: "siteConditions" });
  let openRowGroup = null;

  const rowsForPage = () =>
    includeSiteConditions && isFirstPage ? firstPageRows : otherPageRows;

  const flushPage = () => {
    pages.push(currentPage);
    currentPage = [{ type: "header" }];
    rowsUsed = 0;
    isFirstPage = false;
  };

  const flushRowGroup = () => {
    if (!openRowGroup) return;
    if (rowsUsed >= rowsForPage()) flushPage();
    currentPage.push({
      type: "rowGroup",
      sections: openRowGroup.sections,
      columns,
    });
    rowsUsed += 1;
    openRowGroup = null;
  };

  sections.forEach((section) => {
    if (section.items.length === 0) {
      flushRowGroup();
      currentPage.push({
        type: "sectionEmpty",
        section: {
          ...section,
          cont: false,
          span: columns,
        },
        columns,
      });
      return;
    }

    let startIndex = 0;
    let cont = false;

    while (startIndex < section.items.length) {
      if (!openRowGroup) {
        if (rowsUsed >= rowsForPage()) flushPage();
        openRowGroup = createRowGroup();
      }

      const available = columns - openRowGroup.usedCols;
      if (available === 0) {
        flushRowGroup();
        continue;
      }

      const span = Math.min(available, section.items.length - startIndex);
      openRowGroup.sections.push({
        ...section,
        cont,
        span,
        items: section.items.slice(startIndex, startIndex + span),
      });
      openRowGroup.usedCols += span;
      startIndex += span;
      cont = true;

      if (openRowGroup.usedCols === columns) flushRowGroup();
    }
  });

  flushRowGroup();
  if (currentPage.length > 1) pages.push(currentPage);

  return pages;
}
