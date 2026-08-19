// @ts-check
/**
 * Save/load a project as a self-contained JSON file.
 *
 * The file includes all project data (rooms, items, site conditions, layout)
 * plus every photo as a base64 data URL, so it can be moved between machines
 * via OneDrive or any file-sharing method.
 */

import { idbGetAllPhotos, idbSetPhoto } from "./idb.js";
import { SCHEMA_VERSION } from "./projectStore.js";
import { writeToBackupFolder } from "./backupLocation.js";

const FILE_VERSION = 3;

/** @param {number} value */
const pad2 = (value) => String(value).padStart(2, "0");

/**
 * Backup file name: "Project_punchlist YYMMDD.json".
 *
 * The date is when the backup was taken, not the document date, so files sort
 * chronologically in the download folder. Saving twice in one day does not
 * need rotation logic here — the browser appends "(1)", "(2)" itself rather
 * than overwriting, which is the safe behaviour.
 *
 * @param {{ project?: string } | null | undefined} data
 * @param {Date} [when]
 * @returns {string}
 */
export function makeBackupFilename(data, when = new Date()) {
  const name =
    (data?.project || "").replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "Punchlist";
  const stamp = `${pad2(when.getFullYear() % 100)}${pad2(when.getMonth() + 1)}${pad2(when.getDate())}`;
  return `${name}_punchlist ${stamp}.json`;
}

/**
 * Assemble the backup payload.
 *
 * A backup file outlives the release that wrote it by far longer than a
 * localStorage record does, so it records the document's shape version too:
 * `_version` describes the file envelope, `schemaVersion` the document inside.
 *
 * @param {import("./types.js").ProjectData} data
 * @param {import("./types.js").PhotoMap} photos
 * @returns {import("./types.js").BackupPayload}
 */
export function buildBackupPayload(data, photos) {
  return {
    _punchlistFile: true,
    _version: FILE_VERSION,
    data: { ...data, schemaVersion: SCHEMA_VERSION },
    photos,
  };
}

/**
 * Hand the file to the browser's download folder.
 * @param {string} filename
 * @param {string} json
 */
function downloadFile(filename, json) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gather project data + all photos into one JSON file and write it out.
 *
 * Goes to the user's chosen backup folder when one is set and still writable,
 * and to the browser's download folder otherwise — including when the chosen
 * folder has gone away. Falling back is always right: a backup written
 * somewhere unexpected is recoverable, one never written is not.
 *
 * Resolves with the photo map that was serialized into the file. Callers use
 * that to prove a given photo's bytes are in the saved file before deleting
 * it from IndexedDB.
 *
 * @param {string} projectId
 * @param {import("./types.js").ProjectData} data
 * @param {Date} [when]
 * @returns {Promise<{ filename: string, photos: import("./types.js").PhotoMap, toFolder: boolean }>}
 */
export async function saveProjectToFile(projectId, data, when = new Date()) {
  const photos = await idbGetAllPhotos(projectId);
  const json = JSON.stringify(buildBackupPayload(data, photos));
  const filename = makeBackupFilename(data, when);

  const writtenToFolder = await writeToBackupFolder(filename, json);
  if (!writtenToFolder) downloadFile(filename, json);

  return {
    filename: writtenToFolder || filename,
    photos,
    toFolder: Boolean(writtenToFolder),
  };
}

/**
 * Read a .json file and return project data and photos.
 * Throws if the file is not a valid punchlist export.
 *
 * @param {File} file
 * @returns {Promise<{ data: import("./types.js").ProjectData, photos: import("./types.js").PhotoMap }>}
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
  };
}

/**
 * Restore photos from a loaded file into IndexedDB for a given project.
 *
 * @param {string} projectId
 * @param {import("./types.js").PhotoMap} photos
 */
export async function restorePhotosToIdb(projectId, photos) {
  const entries = Object.entries(photos);
  for (const [itemId, value] of entries) {
    await idbSetPhoto(projectId, itemId, value);
  }
}
