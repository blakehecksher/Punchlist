import test from "node:test";
import assert from "node:assert/strict";

import {
  makeBlankProjectData,
  normalizeStoredData,
  stripPhotos,
} from "../src/projectData.js";

test("opens a minimal record by filling in the blank document shape", () => {
  // Anything already in a tester's browser may predate fields added since.
  const data = normalizeStoredData({ project: "530 Harris Road" });

  assert.equal(data.project, "530 Harris Road");
  assert.deepEqual(data.rooms, []);
  assert.deepEqual(data.generalNotes, []);
  assert.deepEqual(data.siteConditions, []);
  assert.deepEqual(data.endOfPunchListEntries, []);
  assert.equal(data.generalNotesTitle, "General");
  assert.ok(data.layout);
});

test("survives a missing or unreadable record without throwing", () => {
  for (const stored of [null, undefined, {}]) {
    const data = normalizeStoredData(stored);
    assert.deepEqual(data.rooms, []);
    assert.equal(data.project, "");
  }
});

test("keeps fields it does not recognise", () => {
  // A record written by a newer release must not be stripped by an older one.
  const data = normalizeStoredData({ project: "Site", futureField: { keep: true } });

  assert.deepEqual(data.futureField, { keep: true });
});

test("reattaches photos to their items by ID", () => {
  const data = normalizeStoredData(
    {
      project: "Site",
      generalNotes: [{ id: "g1", description: "General note", issueSeq: 1 }],
      rooms: [
        {
          id: "r1",
          name: "Kitchen 102",
          items: [
            { id: "i1", description: "With photo", issueSeq: 1 },
            { id: "i2", description: "Without photo", issueSeq: 2 },
          ],
        },
      ],
    },
    {
      g1: { dataUrl: "data:image/jpeg;base64,GGG", position: { scale: 2, x: 10, y: 20 } },
      i1: { dataUrl: "data:image/jpeg;base64,AAA", position: null },
    },
  );

  assert.equal(data.generalNotes[0].photo, "data:image/jpeg;base64,GGG");
  assert.deepEqual(data.generalNotes[0].photoPosition, { scale: 2, x: 10, y: 20 });
  assert.equal(data.rooms[0].items[0].photo, "data:image/jpeg;base64,AAA");
  assert.equal(data.rooms[0].items[1].photo, null);
  assert.equal(data.rooms[0].items[1].photoPosition, null);
});

test("reads the older bare-string photo entry", () => {
  // Early releases stored the data URL directly instead of { dataUrl, position }.
  const data = normalizeStoredData(
    { rooms: [{ id: "r1", name: "Kitchen 102", items: [{ id: "i1", issueSeq: 1 }] }] },
    { i1: "data:image/jpeg;base64,OLD" },
  );

  assert.equal(data.rooms[0].items[0].photo, "data:image/jpeg;base64,OLD");
  assert.equal(data.rooms[0].items[0].photoPosition, null);
});

test("drops a stored new/revised flag left by an older release", () => {
  // Formatting is the only source of item state; a stored flag would compete.
  const data = normalizeStoredData({
    rooms: [
      {
        id: "r1",
        name: "Kitchen 102",
        items: [{ id: "i1", description: "Item", issueSeq: 1, isNew: true }],
      },
    ],
  });

  assert.ok(!("isNew" in data.rooms[0].items[0]));
});

test("drops the removed issuance workflow state", () => {
  const data = normalizeStoredData({
    project: "Site",
    issuance: { history: [{ issuedAt: "2026-03-11T00:00:00.000Z" }] },
  });

  assert.ok(!("issuance" in data));
});

test("migrates historical issuance dates into the document ending", () => {
  const data = normalizeStoredData({
    project: "Site",
    issuance: { history: [{ issuedAt: "2026-03-11T12:00:00.000Z" }] },
  });

  assert.equal(data.endOfPunchListEntries.length, 1);
  assert.match(data.endOfPunchListEntries[0], /2026/);
});

test("clears placeholder header values that were once saved as real text", () => {
  const data = normalizeStoredData({
    project: "Untitled document",
    projectNum: "Document #",
    firm: "Prepared by",
  });

  assert.equal(data.project, "");
  assert.equal(data.projectNum, "");
  assert.equal(data.firm, "");
});

test("backfills issue sequences that are missing or duplicated", () => {
  // Issue codes are item identity and must stay unique within a section.
  const data = normalizeStoredData({
    rooms: [
      {
        id: "r1",
        name: "Kitchen 102",
        items: [
          { id: "i1", description: "Has one", issueSeq: 1 },
          { id: "i2", description: "Missing" },
          { id: "i3", description: "Duplicate", issueSeq: 1 },
        ],
      },
    ],
  });

  const sequences = data.rooms[0].items.map((item) => item.issueSeq);
  assert.equal(new Set(sequences).size, 3);
  assert.equal(sequences[0], 1);
  assert.ok(data.rooms[0].nextItemIssueSeq > Math.max(...sequences));
});

test("blank project data is a complete document", () => {
  const blank = makeBlankProjectData();

  for (const key of ["project", "title", "date", "layout", "rooms", "generalNotes", "siteConditions"]) {
    assert.ok(key in blank, `missing ${key}`);
  }
});

test("strips photo payloads before writing to localStorage", () => {
  // Photos live in IndexedDB; letting a data URL reach localStorage would blow
  // the quota almost immediately.
  const stripped = stripPhotos({
    layout: {},
    generalNotes: [{ id: "g1", photo: "data:image/jpeg;base64,AAA", photoPosition: { scale: 1 } }],
    rooms: [
      { id: "r1", items: [{ id: "i1", photo: "data:image/jpeg;base64,BBB", photoPosition: { scale: 2 } }] },
    ],
  });

  assert.equal(stripped.generalNotes[0].photo, null);
  assert.equal(stripped.generalNotes[0].photoPosition, null);
  assert.equal(stripped.rooms[0].items[0].photo, null);
  assert.equal(JSON.stringify(stripped).includes("base64"), false);
});
