import test from "node:test";
import assert from "node:assert/strict";

import { mergeImportedNotes, summarizeMerge } from "../src/mergeNotes.js";
import { parseImportText } from "../src/importParser.js";

function makeState(overrides = {}) {
  return {
    generalNotesTitle: "General",
    nextGeneralIssueSeq: 1,
    generalNotes: [],
    siteConditions: [],
    rooms: [],
    ...overrides,
  };
}

function roomWith(name, items) {
  return {
    id: `room-${name}`,
    name,
    nextItemIssueSeq: items.length + 1,
    items: items.map((description, index) => ({
      id: `item-${name}-${index + 1}`,
      description,
      issueSeq: index + 1,
      photo: null,
      photoPosition: null,
    })),
  };
}

test("keeps item identity when re-importing a numbered outline", () => {
  // Photos are stored against the item ID, so a re-import that mints a new ID
  // for an existing item silently detaches its photo.
  const state = makeState({
    rooms: [roomWith("Kitchen 102", ["Adjust cabinet reveal.", "Touch up paint."])],
  });

  const parsed = parseImportText(
    [
      "- Kitchen 102",
      "    - 102-01: Adjust cabinet reveal to a consistent gap.",
      "    - 102-02: Touch up paint.",
    ].join("\n"),
  );

  const { data, counts } = mergeImportedNotes(state, parsed);
  const merged = data.rooms[0].items;

  assert.deepEqual(
    merged.map((item) => item.id),
    ["item-Kitchen 102-1", "item-Kitchen 102-2"],
  );
  assert.deepEqual(
    merged.map((item) => item.issueSeq),
    [1, 2],
  );
  assert.equal(merged[0].description, "Adjust cabinet reveal to a consistent gap.");
  assert.equal(counts.updatedCount, 2);
  assert.equal(counts.removedCount, 0);
});

test("gives an inserted item an unused sequence instead of renumbering", () => {
  const state = makeState({
    rooms: [roomWith("Kitchen 102", ["First item.", "Second item."])],
  });

  const parsed = parseImportText(
    [
      "- Kitchen 102",
      "    - 102-01: First item.",
      "    - Brand new item.",
      "    - 102-02: Second item.",
    ].join("\n"),
  );

  const { data } = mergeImportedNotes(state, parsed);
  const sequences = data.rooms[0].items.map((item) => item.issueSeq);

  assert.equal(new Set(sequences).size, sequences.length);
  assert.ok(Math.max(...sequences) >= 3);
  // The pre-existing items keep the codes already printed on a handed-out PDF.
  assert.equal(data.rooms[0].items[0].issueSeq, 1);
});

test("reports how many working items an import drops", () => {
  const state = makeState({
    rooms: [roomWith("Kitchen 102", ["Kept item.", "Dropped item."])],
  });

  const parsed = parseImportText(
    ["- Kitchen 102", "    - 102-01: Kept item."].join("\n"),
  );

  const { data, counts } = mergeImportedNotes(state, parsed);

  assert.equal(data.rooms[0].items.length, 1);
  assert.equal(counts.removedCount, 1);
  assert.match(summarizeMerge(parsed, state), /1 removed/);
});

test("leaves rooms the import does not mention untouched", () => {
  const state = makeState({
    rooms: [
      roomWith("Kitchen 102", ["Kitchen item."]),
      roomWith("Study 410", ["Study item."]),
    ],
  });

  const parsed = parseImportText(
    ["- Kitchen 102", "    - 102-01: Kitchen item, revised."].join("\n"),
  );

  const { data } = mergeImportedNotes(state, parsed);
  const study = data.rooms.find((room) => room.name === "Study 410");

  assert.equal(study.items.length, 1);
  assert.equal(study.items[0].id, "item-Study 410-1");
});

test("keeps site conditions when the import omits that section", () => {
  const state = makeState({
    siteConditions: ["Protect finished flooring."],
    rooms: [roomWith("Kitchen 102", ["Kitchen item."])],
  });

  const parsed = parseImportText(
    ["- Kitchen 102", "    - 102-01: Kitchen item."].join("\n"),
  );

  const { data, counts } = mergeImportedNotes(state, parsed);

  assert.deepEqual(data.siteConditions, ["Protect finished flooring."]);
  assert.equal(counts.replacedSiteConditions, false);
});

test("does not store a new/revised flag on merged items", () => {
  // State is read from the description's formatting. A stored flag would be a
  // second source of truth that disagrees with the printed document.
  const state = makeState();
  const parsed = parseImportText(
    ["- Kitchen 102", "    - Fresh item."].join("\n"),
  );

  const { data } = mergeImportedNotes(state, parsed);

  assert.ok(!("isNew" in data.rooms[0].items[0]));
});
