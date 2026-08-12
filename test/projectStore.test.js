import test from "node:test";
import assert from "node:assert/strict";

import {
  createProject,
  getActiveId,
  loadIndex,
  loadProjectData,
  migrateLegacy,
  saveProjectData,
  setActiveId,
} from "../src/projectStore.js";

function installStorage() {
  const values = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
  return values;
}

test("saves and reloads the complete project payload without rewriting it", () => {
  installStorage();
  const project = {
    project: "530 Harris Road",
    projectNum: "2512",
    rooms: [],
    generalNotes: [],
    siteConditions: [],
    futureField: { preserved: true },
  };

  const id = createProject(project);

  assert.deepEqual(loadProjectData(id), project);
  assert.equal(loadIndex()[0].name, "530 Harris Road");

  saveProjectData(id, { ...project, project: "530 Harris Road — revised" });
  assert.equal(loadProjectData(id).futureField.preserved, true);
});

test("does not overwrite an existing project index during legacy migration", () => {
  const storage = installStorage();
  storage.set("punch_list_index_v2", JSON.stringify([{ id: "existing" }]));
  storage.set(
    "punch_list_legacy_document",
    JSON.stringify({ project: "Old project", rooms: [] }),
  );

  assert.equal(migrateLegacy(), null);
  assert.equal(loadIndex()[0].id, "existing");
});

test("keeps the active project selection in browser storage", () => {
  installStorage();
  setActiveId("project-123");
  assert.equal(getActiveId(), "project-123");
});
