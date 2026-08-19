// @ts-check
/**
 * Merging an imported outline into the working punch list.
 *
 * This is the most destructive path in the app: it rewrites descriptions in
 * place and drops working items the incoming outline no longer mentions.
 * Photos are keyed by item ID, so a mismatch here detaches a photo from its
 * item. It lives in its own module so that behaviour can be tested directly.
 *
 * Matching is by issue code, not by position or text, so a resolved item can
 * be removed without renumbering the ones around it.
 */

import { formatIssueCode, formatLegacyIssueCodes, getNextIssueSeq } from "./issueIds.js";
import { makeItem, normalizeRoomKey, uid } from "./items.js";

/**
 * Map every code an item may be recognised by — current and legacy — to its
 * position, so a re-import matches by identity rather than by position.
 *
 * @param {readonly import("./types.js").Item[]} items
 * @param {"generalNotes" | "room"} kind
 * @param {string | undefined} title
 * @returns {Map<string, number>}
 */
export function buildIssueCodeIndex(items, kind, title) {
  /** @type {Map<string, number>} */
  const index = new Map();

  items.forEach((item, position) => {
    index.set(formatIssueCode(kind, title, item.issueSeq).toUpperCase(), position);

    formatLegacyIssueCodes(kind, title, item.issueSeq).forEach((legacyCode) => {
      if (!index.has(legacyCode)) index.set(legacyCode, position);
    });
  });

  return index;
}

/**
 * @param {import("./types.js").ProjectData} state
 * @param {import("./types.js").ParsedImport} payload
 * @returns {{
 *   data: import("./types.js").ProjectData,
 *   counts: {
 *     updatedCount: number, newCount: number, removedCount: number,
 *     affectedRoomCount: number, replacedSiteConditions: boolean,
 *   },
 * }}
 */
export function mergeImportedNotes(state, payload) {
  const rooms = state.rooms.map((room) => ({
    ...room,
    items: [...room.items],
  }));
  const roomIndexByKey = new Map(
    rooms.map((room, index) => [normalizeRoomKey(room.name), index]),
  );
  const nextGeneralNotes = [...state.generalNotes];
  const generalNoteIndexByCode = buildIssueCodeIndex(
    nextGeneralNotes,
    "generalNotes",
    state.generalNotesTitle,
  );
  let nextGeneralIssueSeq = getNextIssueSeq(
    nextGeneralNotes,
    state.nextGeneralIssueSeq,
  );
  let updatedCount = 0;
  let newCount = 0;
  let removedCount = 0;
  const touchedGeneralIndices = new Set();

  payload.generalNotes.forEach((imported) => {
    const existingIndex =
      imported.issueCode && generalNoteIndexByCode.has(imported.issueCode)
        ? generalNoteIndexByCode.get(imported.issueCode)
        : undefined;

    if (existingIndex !== undefined) {
      touchedGeneralIndices.add(existingIndex);
      nextGeneralNotes[existingIndex] = {
        ...nextGeneralNotes[existingIndex],
        description: imported.description,
      };
      updatedCount += 1;
      return;
    }

    touchedGeneralIndices.add(nextGeneralNotes.length);
    nextGeneralNotes.push(makeItem(imported.description, nextGeneralIssueSeq));
    nextGeneralIssueSeq += 1;
    newCount += 1;
  });

  // Remove general notes absent from the import
  let finalGeneralNotes = nextGeneralNotes;
  if (payload.generalNotes.length > 0) {
    finalGeneralNotes = nextGeneralNotes.filter((_, i) =>
      touchedGeneralIndices.has(i),
    );
    removedCount += nextGeneralNotes.length - finalGeneralNotes.length;
  }

  payload.rooms.forEach((room) => {
    const key = normalizeRoomKey(room.name);
    const existingIndex = roomIndexByKey.get(key);

    if (existingIndex !== undefined) {
      const existingRoom = rooms[existingIndex];
      const nextItems = [...existingRoom.items];
      const roomItemIndexByCode = buildIssueCodeIndex(
        nextItems,
        "room",
        existingRoom.name,
      );
      let nextRoomIssueSeq = getNextIssueSeq(
        nextItems,
        existingRoom.nextItemIssueSeq,
      );

      const touchedRoomIndices = new Set();

      room.items.forEach((imported) => {
        const matchedIndex =
          imported.issueCode && roomItemIndexByCode.has(imported.issueCode)
            ? roomItemIndexByCode.get(imported.issueCode)
            : undefined;

        if (matchedIndex !== undefined) {
          touchedRoomIndices.add(matchedIndex);
          nextItems[matchedIndex] = {
            ...nextItems[matchedIndex],
            description: imported.description,
          };
          updatedCount += 1;
          return;
        }

        touchedRoomIndices.add(nextItems.length);
        nextItems.push(makeItem(imported.description, nextRoomIssueSeq));
        nextRoomIssueSeq += 1;
        newCount += 1;
      });

      // Remove room items absent from the import
      const filteredItems = nextItems.filter((_, i) =>
        touchedRoomIndices.has(i),
      );
      removedCount += nextItems.length - filteredItems.length;

      rooms[existingIndex] = {
        ...existingRoom,
        nextItemIssueSeq: nextRoomIssueSeq,
        items: filteredItems,
      };
      return;
    }

    let nextRoomIssueSeq = 1;
    const importedItems = room.items.map((imported) => {
      const item = makeItem(imported.description, nextRoomIssueSeq);
      nextRoomIssueSeq += 1;
      newCount += 1;
      return item;
    });
    roomIndexByKey.set(key, rooms.length);
    rooms.push({
      id: uid(),
      name: room.name,
      nextItemIssueSeq: nextRoomIssueSeq,
      items: importedItems,
    });
  });

  // Only replace site conditions when the import actually carries some.
  // Otherwise an import that simply omits the section wiped them out.
  const replacedSiteConditions = payload.siteConditions.length > 0;

  return {
    data: {
      ...state,
      nextGeneralIssueSeq,
      siteConditions: replacedSiteConditions
        ? [...payload.siteConditions]
        : state.siteConditions,
      generalNotes: finalGeneralNotes,
      rooms,
    },
    counts: {
      updatedCount,
      newCount,
      removedCount,
      affectedRoomCount: payload.rooms.length,
      replacedSiteConditions,
    },
  };
}

/**
 * @param {import("./types.js").ParsedImport} parsed
 * @param {import("./types.js").ProjectData} state
 * @returns {string}
 */
export function summarizeMerge(parsed, state) {
  const { counts } = mergeImportedNotes(state, parsed);
  const totalTouched =
    counts.updatedCount + counts.newCount + counts.removedCount;

  if (totalTouched === 0) {
    return counts.replacedSiteConditions
      ? "Merged: site conditions replaced."
      : "Nothing merged.";
  }

  const roomPart =
    counts.affectedRoomCount > 0
      ? ` across ${counts.affectedRoomCount} room${counts.affectedRoomCount === 1 ? "" : "s"}`
      : "";
  const siteConditionsPart = counts.replacedSiteConditions
    ? " Site conditions replaced."
    : "";
  const removedPart =
    counts.removedCount > 0
      ? `, ${counts.removedCount} removed`
      : "";

  return `Merged: ${counts.updatedCount} updated, ${counts.newCount} new item${counts.newCount === 1 ? "" : "s"}${removedPart}${roomPart}.${siteConditionsPart}`;
}
