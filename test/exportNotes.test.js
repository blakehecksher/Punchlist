import test from "node:test";
import assert from "node:assert/strict";

import { buildExportMarkdown } from "../src/exportNotes.js";

const documentWith = (description) => ({
  generalNotesTitle: "General",
  generalNotes: [],
  siteConditions: [],
  rooms: [
    {
      id: "room-1",
      name: "Kitchen 102",
      nextItemIssueSeq: 2,
      items: [{ id: "item-1", issueSeq: 1, description }],
    },
  ],
});

test("marks an underlined item as new in the copied outline", () => {
  // The copied outline used to read new-ness from a stored flag that never
  // survived a reload, so it disagreed with the printed document.
  const markdown = buildExportMarkdown(documentWith("<u>Caulk the baseboard.</u>"));

  assert.match(markdown, /__102-01__/);
});

test("marks a struck item as complete in the copied outline", () => {
  const markdown = buildExportMarkdown(documentWith("<s>Install door stop.</s>"));

  assert.match(markdown, /~~102-01~~/);
});

test("leaves a plain item's code unmarked", () => {
  const markdown = buildExportMarkdown(documentWith("Adjust cabinet reveal."));

  assert.match(markdown, /- 102-01: Adjust cabinet reveal\./);
  assert.doesNotMatch(markdown, /__102-01__/);
  assert.doesNotMatch(markdown, /~~102-01~~/);
});

test("ignores a stale stored flag left by an older release", () => {
  const data = documentWith("Adjust cabinet reveal.");
  data.rooms[0].items[0].isNew = true;

  assert.doesNotMatch(buildExportMarkdown(data), /__102-01__/);
});
