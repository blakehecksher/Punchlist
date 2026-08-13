import test from "node:test";
import assert from "node:assert/strict";

import { parseImportText } from "../src/importParser.js";
import { syncOutlineData } from "../src/outlineModel.js";

function baseState() {
  return {
    siteConditions: ["Protect finished flooring."],
    generalNotesTitle: "General",
    nextGeneralIssueSeq: 3,
    generalNotes: [
      {
        id: "general-1",
        issueSeq: 1,
        description: "Remove construction debris.",
        photo: "data:image/png;base64,general",
        photoPosition: { x: 42, y: 50 },
      },
      {
        id: "general-2",
        issueSeq: 2,
        description: "Old note to remove.",
        photo: null,
        photoPosition: null,
      },
    ],
    rooms: [
      {
        id: "kitchen-room",
        name: "Kitchen 102",
        nextItemIssueSeq: 4,
        items: [
          {
            id: "kitchen-1",
            issueSeq: 1,
            description: "Adjust cabinet reveal.",
            photo: "data:image/png;base64,kitchen-one",
            photoPosition: { x: 55, y: 47 },
          },
          {
            id: "kitchen-2",
            issueSeq: 2,
            description: "Old item to remove.",
            photo: null,
            photoPosition: null,
          },
          {
            id: "kitchen-3",
            issueSeq: 3,
            description: "Seal countertop joint.",
            photo: "data:image/png;base64,kitchen-three",
            photoPosition: { x: 50, y: 50 },
          },
        ],
      },
      {
        id: "bath-room",
        name: "Bathroom 302",
        nextItemIssueSeq: 2,
        items: [
          {
            id: "bath-1",
            issueSeq: 1,
            description: "Reset towel bar.",
            photo: "data:image/png;base64,bath-one",
            photoPosition: null,
          },
        ],
      },
    ],
    issuance: { history: [] },
  };
}

function idFactory() {
  let next = 0;
  return () => `new-${++next}`;
}

test("outline order is authoritative while stable codes preserve item IDs and photos", () => {
  const payload = parseImportText(`
- General Notes
    - GEN-01: Remove all construction debris before final review.
- Bathroom 302
    - 302-01: Reset towel bar level.
- Kitchen 102
    - 102-03: Seal countertop-to-backsplash joint.
    - 102-01: Adjust cabinet reveal at sink.
    - Add missing escutcheon.
  `);

  const result = syncOutlineData(baseState(), payload, {
    idFactory: idFactory(),
  });

  assert.deepEqual(result.rooms.map((room) => room.name), [
    "Bathroom 302",
    "Kitchen 102",
  ]);
  assert.equal(result.generalNotes.length, 1);
  assert.equal(result.generalNotes[0].id, "general-1");
  assert.equal(
    result.generalNotes[0].photo,
    "data:image/png;base64,general",
  );

  const kitchen = result.rooms[1];
  assert.deepEqual(kitchen.items.map((item) => item.issueSeq), [3, 1, 4]);
  assert.deepEqual(kitchen.items.map((item) => item.id), [
    "kitchen-3",
    "kitchen-1",
    "new-1",
  ]);
  assert.equal(
    kitchen.items[0].photo,
    "data:image/png;base64,kitchen-three",
  );
  assert.deepEqual(kitchen.items[1].photoPosition, { x: 55, y: 47 });
  assert.equal(kitchen.nextItemIssueSeq, 5);
});

test("renaming a room keeps its identity, item identities, and photos", () => {
  const payload = parseImportText(`
- Galley 102
    - 102-01: Adjust cabinet reveal at sink.
    - 102-03: Seal countertop joint.
  `);

  const result = syncOutlineData(baseState(), payload, {
    idFactory: idFactory(),
  });

  assert.equal(result.rooms.length, 1);
  assert.equal(result.rooms[0].id, "kitchen-room");
  assert.equal(result.rooms[0].name, "Galley 102");
  assert.deepEqual(result.rooms[0].items.map((item) => item.id), [
    "kitchen-1",
    "kitchen-3",
  ]);
  assert.equal(
    result.rooms[0].items[0].photo,
    "data:image/png;base64,kitchen-one",
  );
});

test("moving an item to another room keeps its photo and gives it a local number", () => {
  const payload = parseImportText(`
- Kitchen 102
    - 102-01: Adjust cabinet reveal.
- Bathroom 302
    - 102-03: Seal countertop joint now assigned to bathroom.
    - 302-01: Reset towel bar.
  `);

  const result = syncOutlineData(baseState(), payload, {
    idFactory: idFactory(),
  });
  const bathroom = result.rooms[1];

  assert.equal(bathroom.items[0].id, "kitchen-3");
  assert.equal(bathroom.items[0].issueSeq, 2);
  assert.equal(
    bathroom.items[0].photo,
    "data:image/png;base64,kitchen-three",
  );
  assert.equal(bathroom.nextItemIssueSeq, 3);
});

test("new items after an issuance are marked new but existing items are not", () => {
  const state = baseState();
  state.issuance.history.push({ id: "issue-1" });
  const payload = parseImportText(`
- Kitchen 102
    - 102-01: Adjust cabinet reveal.
    - Add missing escutcheon.
  `);

  const result = syncOutlineData(state, payload, { idFactory: idFactory() });

  assert.equal(result.rooms[0].items[0].isNew, false);
  assert.equal(result.rooms[0].items[1].isNew, true);
});
