import { getLayoutMetrics } from "./layout.js";

export const GENERAL_NOTES_SECTION_ID = "__general_notes__";

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
  const { columns, firstPageRows, otherPageRows } = getLayoutMetrics(layout);
  const pages = [];
  const sections = buildSections(data);

  let isFirstPage = true;
  let rowsUsed = 0;
  let currentPage = [{ type: "header" }, { type: "siteConditions" }];
  let openRowGroup = null;

  const rowsForPage = () => (isFirstPage ? firstPageRows : otherPageRows);

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
