import test from "node:test";
import assert from "node:assert/strict";

import { parseImportText } from "../src/importParser.js";

test("parses numbered items under named sections", () => {
  const parsed = parseImportText(`
Site Conditions:
1. Protect finished flooring.
2) Maintain dust protection.

General Notes:
1. Confirm the final cleaning scope.
2. Verify the hardware schedule.

Kitchen 102:
1. Adjust the cabinet reveal.
2) Seal the backsplash joint.
`);

  assert.deepEqual(parsed.siteConditions, [
    "Protect finished flooring.",
    "Maintain dust protection.",
  ]);
  assert.deepEqual(
    parsed.generalNotes.map(({ issueCode, description }) => ({
      issueCode,
      description,
    })),
    [
      { issueCode: null, description: "Confirm the final cleaning scope." },
      { issueCode: null, description: "Verify the hardware schedule." },
    ],
  );
  assert.deepEqual(parsed.rooms, [
    {
      name: "Kitchen 102",
      items: [
        { issueCode: null, isNew: true, description: "Adjust the cabinet reveal." },
        { issueCode: null, isNew: true, description: "Seal the backsplash joint." },
      ],
    },
  ]);
});

test("parses a nested outline with numbered room and item markers", () => {
  const parsed = parseImportText(`
1. Kitchen 102
    1. Adjust the cabinet reveal.
    2. Touch up the window return.
2. Study 410
    1. Align the door stop.
`);

  assert.deepEqual(
    parsed.rooms.map((room) => ({
      name: room.name,
      items: room.items.map((item) => item.description),
    })),
    [
      {
        name: "Kitchen 102",
        items: [
          "Adjust the cabinet reveal.",
          "Touch up the window return.",
        ],
      },
      { name: "Study 410", items: ["Align the door stop."] },
    ],
  );
});

test("keeps issue codes when a numbered item is re-imported", () => {
  const parsed = parseImportText(`
General Notes:
1. GEN-05: Confirm the final cleaning scope.

Kitchen 102:
1. 102-03: Adjust the cabinet reveal.
`);

  assert.equal(parsed.generalNotes[0].issueCode, "GEN-05");
  assert.equal(parsed.generalNotes[0].description, "Confirm the final cleaning scope.");
  assert.equal(parsed.rooms[0].items[0].issueCode, "102-03");
  assert.equal(parsed.rooms[0].items[0].description, "Adjust the cabinet reveal.");
});
