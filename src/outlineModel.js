import {
  formatIssueCode,
  formatLegacyIssueCodes,
  getNextIssueSeq,
} from "./issueIds.js";

const normalizeRoomKey = (name = "") =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const defaultIdFactory = () => Math.random().toString(36).slice(2, 9);

function itemCodes(kind, title, item) {
  return [
    formatIssueCode(kind, title, item.issueSeq),
    ...formatLegacyIssueCodes(kind, title, item.issueSeq),
  ].map((code) => code.toUpperCase());
}

function buildRecords(state) {
  const records = [];

  state.generalNotes.forEach((item) => {
    records.push({
      item,
      sectionId: "generalNotes",
      codes: itemCodes(
        "generalNotes",
        state.generalNotesTitle || "General",
        item,
      ),
    });
  });

  state.rooms.forEach((room) => {
    room.items.forEach((item) => {
      records.push({
        item,
        sectionId: room.id,
        codes: itemCodes("room", room.name, item),
      });
    });
  });

  return records;
}

function findRecord(records, issueCode, sectionId, usedIds) {
  if (!issueCode) return null;
  const normalizedCode = issueCode.toUpperCase();
  return (
    records.find(
      (record) =>
        record.sectionId === sectionId &&
        !usedIds.has(record.item.id) &&
        record.codes.includes(normalizedCode),
    ) ?? null
  );
}

function findRecordAnywhere(records, issueCode, usedIds) {
  if (!issueCode) return null;
  const normalizedCode = issueCode.toUpperCase();
  return (
    records.find(
      (record) =>
        !usedIds.has(record.item.id) && record.codes.includes(normalizedCode),
    ) ?? null
  );
}

function findRoomForOutlineRoom(state, importedRoom, usedRoomIds) {
  const exact = state.rooms.find(
    (room) =>
      !usedRoomIds.has(room.id) &&
      normalizeRoomKey(room.name) === normalizeRoomKey(importedRoom.name),
  );
  if (exact) return exact;

  // Renaming a room in the outline should not detach its items or photos. If
  // the heading changed but its stable item codes remain, use those codes to
  // identify the room that is being renamed.
  let bestRoom = null;
  let bestScore = 0;
  state.rooms.forEach((room) => {
    if (usedRoomIds.has(room.id)) return;
    const knownCodes = new Set(
      room.items.flatMap((item) => itemCodes("room", room.name, item)),
    );
    const score = importedRoom.items.reduce(
      (total, item) =>
        total +
        (item.issueCode && knownCodes.has(item.issueCode.toUpperCase()) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestRoom = room;
      bestScore = score;
    }
  });

  return bestScore > 0 ? bestRoom : null;
}

function nextItem(existing, description, issueSeq, isNew, idFactory) {
  if (existing) {
    return {
      ...existing,
      description,
      issueSeq,
      isNew,
    };
  }

  return {
    id: idFactory(),
    description,
    issueSeq,
    isNew,
    photo: null,
    photoPosition: null,
  };
}

/**
 * Make a parsed outline the structural source of truth for a project.
 *
 * Stable issue codes reconnect existing records, so reordering or editing a
 * line preserves the hidden item ID and its IndexedDB photo. New unnumbered
 * lines receive the next never-used number in their section.
 */
export function syncOutlineData(state, payload, options = {}) {
  const idFactory = options.idFactory ?? defaultIdFactory;
  const allowNewMarkers = (state.issuance?.history?.length ?? 0) > 0;
  const importedIsNew = (item) => allowNewMarkers && Boolean(item.isNew);
  const records = buildRecords(state);
  const usedItemIds = new Set();
  const usedRoomIds = new Set();

  let nextGeneralIssueSeq = getNextIssueSeq(
    state.generalNotes,
    state.nextGeneralIssueSeq,
  );
  const generalNotes = payload.generalNotes.map((imported) => {
    const local = findRecord(
      records,
      imported.issueCode,
      "generalNotes",
      usedItemIds,
    );
    const anywhere =
      local ?? findRecordAnywhere(records, imported.issueCode, usedItemIds);
    const moved = anywhere && anywhere.sectionId !== "generalNotes";
    const issueSeq = anywhere && !moved ? anywhere.item.issueSeq : nextGeneralIssueSeq++;
    if (anywhere) usedItemIds.add(anywhere.item.id);
    return nextItem(
      anywhere?.item,
      imported.description,
      issueSeq,
      importedIsNew(imported),
      idFactory,
    );
  });

  const rooms = payload.rooms.map((importedRoom) => {
    const existingRoom = findRoomForOutlineRoom(
      state,
      importedRoom,
      usedRoomIds,
    );
    const roomId = existingRoom?.id ?? idFactory();
    if (existingRoom) usedRoomIds.add(existingRoom.id);

    let nextIssueSeq = getNextIssueSeq(
      existingRoom?.items ?? [],
      existingRoom?.nextItemIssueSeq ?? 1,
    );

    const items = importedRoom.items.map((imported) => {
      const local = findRecord(
        records,
        imported.issueCode,
        existingRoom?.id ?? roomId,
        usedItemIds,
      );
      const anywhere =
        local ?? findRecordAnywhere(records, imported.issueCode, usedItemIds);
      const moved = Boolean(
        anywhere && anywhere.sectionId !== (existingRoom?.id ?? roomId),
      );
      const issueSeq = anywhere && !moved ? anywhere.item.issueSeq : nextIssueSeq++;
      if (anywhere) usedItemIds.add(anywhere.item.id);
      return nextItem(
        anywhere?.item,
        imported.description,
        issueSeq,
        importedIsNew(imported),
        idFactory,
      );
    });

    return {
      ...(existingRoom ?? {}),
      id: roomId,
      name: importedRoom.name,
      nextItemIssueSeq: nextIssueSeq,
      items,
    };
  });

  return {
    ...state,
    siteConditions: [...payload.siteConditions],
    nextGeneralIssueSeq,
    generalNotes,
    rooms,
  };
}
