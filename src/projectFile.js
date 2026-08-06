/**
 * Save/load a project as a self-contained JSON file.
 *
 * The file includes all project data (rooms, items, site conditions, layout)
 * plus every photo as a base64 data URL, so it can be moved between machines
 * via OneDrive or any file-sharing method.
 */

import {
  idbGetAllPhotos,
  idbGetAllIssueSnapshots,
  idbSetIssueSnapshot,
  idbSetPhoto,
} from "./idb.js";

const FILE_VERSION = 2;

/**
 * Gather project data + all photos into a single JSON object
 * and trigger a browser file download.
 */
export async function saveProjectToFile(projectId, data) {
  const photos = await idbGetAllPhotos(projectId);
  const issueSnapshots = await idbGetAllIssueSnapshots(projectId);

  const payload = {
    _punchlistFile: true,
    _version: FILE_VERSION,
    data,
    photos,
    issueSnapshots,
  };

  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const filename = `${(data.project || "Punchlist").replace(/[^a-zA-Z0-9 _-]/g, "")} - ${(data.date || "export").replace(/[^a-zA-Z0-9 _,-]/g, "")}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read a .json file and return project data, photos, and issued snapshots.
 * Throws if the file is not a valid punchlist export.
 */
export async function loadProjectFromFile(file) {
  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  if (!payload._punchlistFile || !payload.data) {
    throw new Error("That file is not a punchlist project export.");
  }

  return {
    data: payload.data,
    photos: payload.photos || {},
    issueSnapshots: payload.issueSnapshots || {},
  };
}

/**
 * Restore photos from a loaded file into IndexedDB for a given project.
 */
export async function restorePhotosToIdb(projectId, photos) {
  const entries = Object.entries(photos);
  for (const [itemId, value] of entries) {
    await idbSetPhoto(projectId, itemId, value);
  }
}

export async function restoreIssueSnapshotsToIdb(projectId, snapshots) {
  const entries = Object.entries(snapshots);
  for (const [issueId, value] of entries) {
    await idbSetIssueSnapshot(projectId, issueId, value);
  }
}
