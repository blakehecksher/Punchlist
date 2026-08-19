import test from "node:test";
import assert from "node:assert/strict";

import {
  EXAMPLE_PROJECT,
  EXAMPLE_VERSION,
  refreshExampleFixture,
} from "../src/exampleProject.js";

const describedItems = (data) => [
  ...data.generalNotes,
  ...data.rooms.flatMap((room) => room.items),
];

test("the example is flagged and stamped with the current fixture version", () => {
  assert.equal(EXAMPLE_PROJECT.isExample, true);
  assert.equal(EXAMPLE_PROJECT.exampleVersion, EXAMPLE_VERSION);
});

test("the example demonstrates each formatting convention in its own markup", () => {
  // State is read from the description, so the conventions have to live in the
  // text or they stop being demonstrated the moment the page reloads.
  const descriptions = describedItems(EXAMPLE_PROJECT).map((item) => item.description);
  const joined = descriptions.join(" ");

  assert.match(joined, /<u>/, "expected an underlined (new) item");
  assert.match(joined, /<b>/, "expected a bold (revised) item");
  assert.match(joined, /<s>/, "expected a struck (complete) item");
});

test("no example item carries a stored state flag", () => {
  for (const item of describedItems(EXAMPLE_PROJECT)) {
    assert.ok(!("isNew" in item), `${item.id} still carries isNew`);
  }
});

test("example item IDs are unique so photos cannot collide", () => {
  const ids = describedItems(EXAMPLE_PROJECT).map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("leaves a real project untouched", () => {
  const real = { project: "530 Harris Road", rooms: [] };
  assert.equal(refreshExampleFixture(real), real);
  assert.equal(refreshExampleFixture(null), null);
});

test("leaves a current-version example untouched", () => {
  const current = { isExample: true, exampleVersion: EXAMPLE_VERSION, project: "Edited" };
  assert.equal(refreshExampleFixture(current), current);
});

test("replaces a stale example so it does not show an old fixture", () => {
  const stale = { isExample: true, exampleVersion: EXAMPLE_VERSION - 1, project: "Old" };
  const refreshed = refreshExampleFixture(stale);

  assert.notEqual(refreshed, stale);
  assert.equal(refreshed.exampleVersion, EXAMPLE_VERSION);
  assert.equal(refreshed.project, EXAMPLE_PROJECT.project);
});
