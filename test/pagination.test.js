import test from "node:test";
import assert from "node:assert/strict";

import {
  FIRST_PAGE_ROWS_WITH_SITE_CONDITIONS,
  MAX_SITE_CONDITIONS_WITH_FIRST_PAGE_ITEMS,
  getFirstPageItemRows,
  paginateDetail,
} from "../src/pagination.js";

function makeData({ siteConditions = [], itemCount = 4 } = {}) {
  return {
    siteConditions,
    generalNotes: [],
    rooms: [
      {
        id: "room-1",
        name: "Kitchen 102",
        items: Array.from({ length: itemCount }, (_, index) => ({
          id: `item-${index + 1}`,
          issueSeq: index + 1,
          description: `Item ${index + 1}`,
        })),
      },
    ],
  };
}

function rowGroups(page) {
  return page.filter((segment) => segment.type === "rowGroup");
}

function rowItemIds(page) {
  return rowGroups(page).flatMap((group) =>
    group.sections.flatMap((section) => section.items.map((item) => item.id)),
  );
}

test("limits a short site-condition page to one punch-list row", () => {
  const pages = paginateDetail(
    makeData({ siteConditions: ["Protect finished flooring."], itemCount: 4 }),
    { density: "2x2" },
    { includeSiteConditions: true },
  );

  assert.equal(rowGroups(pages[0]).length, 1);
  assert.deepEqual(rowItemIds(pages[0]), ["item-1", "item-2"]);
  assert.deepEqual(rowItemIds(pages[1]), ["item-3", "item-4"]);
});

test("starts punch-list items on page two when site conditions are long", () => {
  const pages = paginateDetail(
    makeData({
      siteConditions: Array.from(
        { length: MAX_SITE_CONDITIONS_WITH_FIRST_PAGE_ITEMS + 1 },
        (_, index) => `Condition ${index + 1}`,
      ),
      itemCount: 4,
    }),
    { density: "2x2" },
    { includeSiteConditions: true },
  );

  assert.equal(rowGroups(pages[0]).length, 0);
  assert.deepEqual(rowItemIds(pages[0]), []);
  assert.deepEqual(rowItemIds(pages[1]), ["item-1", "item-2", "item-3", "item-4"]);
});

test("keeps the original two-row capacity when site conditions are omitted", () => {
  const pages = paginateDetail(
    makeData({ itemCount: 4 }),
    { density: "2x2" },
    { includeSiteConditions: false },
  );

  assert.equal(rowGroups(pages[0]).length, 2);
  assert.deepEqual(rowItemIds(pages[0]), ["item-1", "item-2", "item-3", "item-4"]);
});

test("uses the documented first-page thresholds", () => {
  assert.equal(
    getFirstPageItemRows(
      Array.from({ length: MAX_SITE_CONDITIONS_WITH_FIRST_PAGE_ITEMS }, () => "condition"),
      2,
    ),
    FIRST_PAGE_ROWS_WITH_SITE_CONDITIONS,
  );
  assert.equal(
    getFirstPageItemRows(
      Array.from({ length: MAX_SITE_CONDITIONS_WITH_FIRST_PAGE_ITEMS + 1 }, () => "condition"),
      2,
    ),
    0,
  );
});

test("places the End of Punch List field in the next available document row", () => {
  const pagesWithSpace = paginateDetail(
    makeData({ itemCount: 2 }),
    { density: "2x2" },
    { includeSiteConditions: false, includeDocumentEnd: true },
  );
  assert.equal(pagesWithSpace.length, 1);
  assert.equal(pagesWithSpace[0].at(-1).type, "documentEnd");

  const fullPages = paginateDetail(
    makeData({ itemCount: 4 }),
    { density: "2x2" },
    { includeSiteConditions: false, includeDocumentEnd: true },
  );
  assert.equal(fullPages.length, 2);
  assert.deepEqual(fullPages[1].map((segment) => segment.type), [
    "header",
    "documentEnd",
  ]);
});
