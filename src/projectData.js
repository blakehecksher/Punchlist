// @ts-check
/**
 * The stored project shape, and the read path that turns a saved record back
 * into a document.
 *
 * `normalizeStoredData` runs on every project open, so it is the code that
 * decides whether a record written by an older release still works. It is
 * separated from the component so that behaviour can be tested directly
 * rather than only through the browser.
 */

import { DEFAULT_LAYOUT, normalizeLayout } from "./layout.js";
import { normalizeDocumentEndEntries } from "./endOfPunchList.js";
import { getNextIssueSeq, normalizeItemIssueSeqs } from "./issueIds.js";
import { makeItem, uid } from "./items.js";

export const getCurrentDateLabel = (date = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

export const DEFAULT_HEADER_NOTE =
  "Items shown <u>underlined</u> are new as of this walkthrough.<br>Items shown in <b>bold</b> type indicate revisions.<br>Items shown with <s>strikethrough</s> type are complete as of this walkthrough and will be removed from subsequent punch list.";

export function makeBlankProjectData() {
  return {
    project: "",
    projectNum: "",
    title: "Punch List",
    date: getCurrentDateLabel(),
    firm: "",
    punchlistDate: "",
    generalNotesTitle: "General",
    headerNote: DEFAULT_HEADER_NOTE,
    layout: { ...DEFAULT_LAYOUT },
    endOfPunchListEntries: [],
    nextGeneralIssueSeq: 1,
    siteConditions: [],
    generalNotes: [],
    rooms: [],
  };
}

export function makeRoom(name = "Room Name", firstDescription = "") {
  return {
    id: uid(),
    name,
    nextItemIssueSeq: 2,
    items: [makeItem(firstDescription, 1)],
  };
}

/**
 * Turn a saved record back into a document.
 *
 * Runs on every project open, so it is what decides whether a record written
 * by an older release still works. It must accept anything that was ever
 * written — including null for a missing or corrupt record.
 *
 * @param {Record<string, any> | null | undefined} stored
 * @param {import("./types.js").PhotoMap} [photos]
 * @returns {import("./types.js").ProjectData}
 */
export function normalizeStoredData(stored, photos = {}) {
  const {
    issuance: _unusedIssuance,
    endOfPunchListDates: _unusedEndDates,
    ...storedWithoutLegacyEndData
  } = stored ?? {};
  /** @param {readonly import("./types.js").StoredItem[]} [items] */
  const mergePhotos = (items = []) =>
    items.map((item) => {
      // A stored new/revised/complete flag would be a second source of truth
      // competing with the inline formatting. Drop any left by older releases.
      const { isNew: _legacyIsNew, ...normalizedItem } = item;
      const entry = photos[item.id];
      if (!entry) return { ...normalizedItem, photo: null, photoPosition: null };
      if (typeof entry === "string")
        return { ...normalizedItem, photo: entry, photoPosition: null };
      return {
        ...normalizedItem,
        photo: entry.dataUrl,
        photoPosition: entry.position ?? null,
      };
    });

  /** @param {Record<string, any>} data */
  const withIssueSequences = (data) => {
    const general = normalizeItemIssueSeqs(data.generalNotes || []);
    const rooms = (data.rooms || []).map(
      /** @param {import("./types.js").Room} room */
      (room) => {
        const normalized = normalizeItemIssueSeqs(room.items || []);
        return {
          ...room,
          nextItemIssueSeq: getNextIssueSeq(
            normalized.items,
            room.nextItemIssueSeq ?? normalized.nextIssueSeq,
          ),
          items: normalized.items,
        };
      },
    );

    return {
      ...data,
      nextGeneralIssueSeq: getNextIssueSeq(
        general.items,
        data.nextGeneralIssueSeq ?? general.nextIssueSeq,
      ),
      generalNotes: general.items,
      rooms,
    };
  };

  const project = ["Untitled document", "Untitled punch list"].includes(
    stored?.project,
  )
    ? ""
    : (stored?.project ?? "");
  const projectNum = stored?.projectNum === "Document #" ? "" : (stored?.projectNum ?? "");
  const firm = ["Prepared by", "Firm Name"].includes(stored?.firm)
    ? ""
    : (stored?.firm ?? "");

  const normalized = withIssueSequences({
    ...makeBlankProjectData(),
    ...storedWithoutLegacyEndData,
    project,
    projectNum,
    firm,
    layout: normalizeLayout(stored?.layout),
    endOfPunchListEntries: normalizeDocumentEndEntries(stored),
    punchlistDate: stored?.punchlistDate ?? "",
    generalNotesTitle: stored?.generalNotesTitle ?? "General",
    siteConditions: stored?.siteConditions || [],
    generalNotes: mergePhotos(stored?.generalNotes || []),
    rooms: (stored?.rooms || []).map(
      /** @param {import("./types.js").Room} room */
      (room) => ({
        ...room,
        items: mergePhotos(room.items || []),
      }),
    ),
  });

  // The trust boundary: everything above works on whatever was actually in
  // storage, and what comes out is a document the rest of the app can rely on.
  return /** @type {import("./types.js").ProjectData} */ (normalized);
}

/**
 * Photos live in IndexedDB. Letting a data URL reach localStorage would blow
 * the quota almost immediately, so they are removed before every write.
 *
 * @param {import("./types.js").ProjectData} data
 * @returns {import("./types.js").ProjectData}
 */
export const stripPhotos = (data) => {
  const { issuance: _unusedIssuance, ...dataWithoutIssuance } = data;
  return {
    ...dataWithoutIssuance,
    layout: normalizeLayout(data.layout),
    generalNotes: data.generalNotes.map((item) => ({
      ...item,
      photo: null,
      photoPosition: null,
    })),
    rooms: data.rooms.map((room) => ({
      ...room,
      items: room.items.map((item) => ({
        ...item,
        photo: null,
        photoPosition: null,
      })),
    })),
  };
};
