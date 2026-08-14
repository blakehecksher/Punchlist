import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import {
  idbGetAllPhotos,
  idbSetPhoto,
  idbClearAll,
  idbClearProjectPhotos,
  idbDeletePhoto,
  idbCopyProjectPhotos,
} from "./idb.js";
import {
  convertHtmlToImportText,
  hasStructuredImportHtml,
} from "./importHtml.js";
import { readImportFile } from "./importFile.js";
import { parseImportText } from "./importParser.js";
import { copyNotesToClipboard } from "./exportNotes.js";
import {
  saveProjectToFile,
  loadProjectFromFile,
  restorePhotosToIdb,
} from "./projectFile.js";
import {
  formatIssueCode,
  formatLegacyIssueCodes,
  getNextIssueSeq,
  getRoomIssuePrefix,
  isUnnumberedRoom,
  normalizeItemIssueSeqs,
} from "./issueIds.js";
import { DEFAULT_LAYOUT, getLayoutMetrics, normalizeLayout } from "./layout.js";
import {
  makeDocumentEndEntry,
  normalizeDocumentEndEntries,
} from "./endOfPunchList.js";
import {
  GENERAL_NOTES_SECTION_ID,
  paginateDetail,
  paginateSummary,
} from "./pagination.js";
import ItemCard from "./ItemCard.jsx";
import RichText from "./RichText.jsx";
import OutlineEditor from "./OutlineEditor.jsx";
import ProjectSidebar from "./ProjectSidebar.jsx";
import {
  loadIndex,
  loadProjectData,
  saveProjectData,
  deleteProject,
  createProject,
  getActiveId,
  setActiveId,
  migrateLegacy,
} from "./projectStore.js";
import "./styles.css";

const uid = () => Math.random().toString(36).slice(2, 9);
const normalizeRoomKey = (name) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();
// Named prefixes such as EXT and the 000 missing-number fallback sort before
// numbered rooms. Keep the fallback finite so the name tiebreak remains valid.
const getRoomSortNumber = (roomName) => {
  const numeric = Number.parseInt(getRoomIssuePrefix(roomName), 10);
  return Number.isFinite(numeric) ? numeric : 0;
};
const compareRoomNames = (left, right) => {
  const roomNumberDiff =
    getRoomSortNumber(left.name) - getRoomSortNumber(right.name);
  if (roomNumberDiff !== 0) return roomNumberDiff;
  return left.name.trim().localeCompare(right.name.trim(), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};
const makeItem = (description = "", issueSeq = 1, isNew = false) => ({
  id: uid(),
  description,
  issueSeq,
  isNew,
  photo: null,
  photoPosition: null,
});
const getCurrentDateLabel = (date = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
const PUNCH_LIST_TEMPLATE = `- Site Conditions
    - Site condition 1
    - Site condition 2
- General
    - General item 1
    - General item 2
- Room Name 101
    - Item 1
    - Item 2`;
const EXAMPLE_VERSION = 2;
const STARTER_OUTLINE = `- Site Conditions
    - Protect finished flooring through the final walkthrough
    - Maintain dust protection at occupied areas
- General Notes
    - Clean work areas and remove construction debris
    - Match adjacent paint sheen at touch-up locations
- Kitchen 102
    - Adjust cabinet reveal
    - Touch up paint at window return
- Study 410
    - Install door stop
    - Tighten hinge screws
- Living Room 201
    - Caulk baseboard at east wall
    - Touch up paint at built-in
- Primary Bedroom 301
    - Adjust closet door alignment
    - Reinstall towel bar
- Bathroom 302
    - Replace cracked tile at niche
    - Clean grout at shower floor
- Hall 2nd Floor
    - Patch and paint wall at railing
- Exterior
    - Seal around window trim
    - Touch up siding at south corner`;
const DEFAULT_HEADER_NOTE =
  "Items shown <u>underlined</u> are new as of this walkthrough.<br>Items shown in <b>bold</b> type indicate revisions.<br>Items shown with <s>strikethrough</s> type are complete as of this walkthrough and will be removed from subsequent punch list.";

function containsInlineTag(html, tagName) {
  const patterns = {
    b: [
      /<(?:b|strong)(?:\s|>)/i,
      /font-weight\s*:\s*(?:bold|[5-9]00)/i,
    ],
    s: [
      /<(?:s|del|strike|x)(?:\s|>)/i,
      /text-decoration[^>"]*line-through/i,
    ],
    u: [
      /<u(?:\s|>)/i,
      /text-decoration[^>"]*underline/i,
    ],
  };

  return (patterns[tagName] || []).some((pattern) => pattern.test(html ?? ""));
}

function getIssueCodeStyle({ isNew = false, isCompleted = false } = {}) {
  const textDecorationLine = [
    isNew ? "underline" : null,
    isCompleted ? "line-through" : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (!textDecorationLine) return undefined;

  return {
    textDecorationLine,
    textUnderlineOffset: isNew ? "1px" : undefined,
  };
}

function summarizeEntries(entries) {
  return entries.reduce(
    (counts, entry) => ({
      total: counts.total + 1,
      new: counts.new + (entry.isNew ? 1 : 0),
      revised: counts.revised + (entry.isRevised ? 1 : 0),
      completed: counts.completed + (entry.isCompleted ? 1 : 0),
    }),
    { total: 0, new: 0, revised: 0, completed: 0 },
  );
}

function buildIssueCodeIndex(items, kind, title) {
  const index = new Map();

  items.forEach((item, position) => {
    index.set(formatIssueCode(kind, title, item.issueSeq).toUpperCase(), position);

    formatLegacyIssueCodes(kind, title, item.issueSeq).forEach((legacyCode) => {
      if (!index.has(legacyCode)) index.set(legacyCode, position);
    });
  });

  return index;
}

function mergeImportedNotes(state, payload) {
  const importedIsNew = () => false;
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
        isNew: importedIsNew(imported),
      };
      updatedCount += 1;
      return;
    }

    touchedGeneralIndices.add(nextGeneralNotes.length);
    nextGeneralNotes.push(
      makeItem(imported.description, nextGeneralIssueSeq, importedIsNew(imported)),
    );
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
            isNew: importedIsNew(imported),
          };
          updatedCount += 1;
          return;
        }

        touchedRoomIndices.add(nextItems.length);
        nextItems.push(
          makeItem(imported.description, nextRoomIssueSeq, importedIsNew(imported)),
        );
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
      const item = makeItem(
        imported.description,
        nextRoomIssueSeq,
        importedIsNew(imported),
      );
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

function summarizeMerge(parsed, state) {
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

function makeBlankProjectData() {
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

function makeRoom(name = "Room Name", firstDescription = "", isNew = false) {
  return {
    id: uid(),
    name,
    nextItemIssueSeq: 2,
    items: [makeItem(firstDescription, 1, isNew)],
  };
}

function makeExampleEntries(prefix, entries) {
  return entries.map((entry, index) => {
    const details = typeof entry === "string" ? { description: entry } : entry;
    return {
      id: `${prefix}-${index + 1}`,
      issueSeq: index + 1,
      isNew: details.isNew ?? true,
      description: details.description,
      photo: null,
      photoPosition: null,
    };
  });
}

function makeExampleRoom(id, name, entries) {
  return {
    id,
    name,
    nextItemIssueSeq: entries.length + 1,
    items: makeExampleEntries(id, entries),
  };
}

const INITIAL_DATA = {
  ...makeBlankProjectData(),
  nextGeneralIssueSeq: 5,
  siteConditions: [
    "Example condition: final painting touch-ups are in progress",
    "Example condition: flooring protection remains in place in main hall",
    "Example condition: millwork adjustments are ongoing",
    "Example condition: electrical trim-out is still underway",
  ],
  generalNotes: [
    {
      id: "gn1",
      issueSeq: 1,
      description:
        "Example note 01: verify final paint touch-up at all visible corners.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn2",
      issueSeq: 2,
      description:
        "Example note 02: confirm hardware finish is consistent throughout.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn3",
      issueSeq: 3,
      description:
        "Example note 03: clean glass, mirrors, and adjacent trim before turnover.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn4",
      issueSeq: 4,
      description:
        "Example note 04: review all control locations for alignment and labeling.",
      photo: null,
      photoPosition: null,
    },
  ],
  rooms: [
    {
      id: "r101",
      name: "101  Entry Hall",
      nextItemIssueSeq: 3,
      items: [
        {
          id: "r101_1",
          issueSeq: 1,
          description: "Example item: touch up paint at door frame corners.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r101_2",
          issueSeq: 2,
          description:
            "Example item: align cover plates vertically with adjacent trim.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r102",
      name: "102  Kitchen",
      nextItemIssueSeq: 4,
      items: [
        {
          id: "r102_1",
          issueSeq: 1,
          description:
            "Example item: adjust cabinet reveal for consistent gap.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r102_2",
          issueSeq: 2,
          description:
            "Example item: clean stone backsplash and sealant joints.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r102_3",
          issueSeq: 3,
          description:
            "Example item: verify appliance panel alignment after final install.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r103",
      name: "103  Pantry",
      nextItemIssueSeq: 2,
      items: [
        {
          id: "r103_1",
          issueSeq: 1,
          description:
            "Example item: patch and paint shelf support touch-up locations.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r104",
      name: "104  Living Room",
      nextItemIssueSeq: 3,
      items: [
        {
          id: "r104_1",
          issueSeq: 1,
          description:
            "Example item: repair minor wall blemish at window return.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r104_2",
          issueSeq: 2,
          description:
            "Example item: confirm grille finish matches adjacent ceiling paint.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r105",
      name: "105  Bedroom",
      nextItemIssueSeq: 2,
      items: [
        {
          id: "r105_1",
          issueSeq: 1,
          description: "Example item: adjust closet doors for even spacing.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r106",
      name: "106  Bath",
      nextItemIssueSeq: 3,
      items: [
        {
          id: "r106_1",
          issueSeq: 1,
          description: "Example item: verify fixture trim is installed level.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r106_2",
          issueSeq: 2,
          description: "Example item: clean mirror edges and adjacent sealant.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
  ],
  // Keep the historical sample above as a development reference. The final
  // overrides below are the polished practice project shown to first-time
  // users, with enough sections and rooms to demonstrate a real document.
  ...{
    ...makeBlankProjectData(),
    isExample: true,
    exampleVersion: EXAMPLE_VERSION,
    project: "184 Cedar Avenue",
    projectNum: "PL-001",
    firm: "Northline Studio",
    punchlistDate: "August 5, 2026 · 9:00 AM",
    layout: { ...DEFAULT_LAYOUT, showSummary: false },
    siteConditions: [
      "Protect finished flooring through the final walkthrough.",
      "Maintain dust protection at occupied areas.",
      "Coordinate access with the superintendent before 8:00 AM.",
    ],
    nextGeneralIssueSeq: 4,
    generalNotes: makeExampleEntries("example-general", [
      "Clean work areas and remove construction debris before final review.",
      {
        isNew: false,
        description:
          "<b>Match adjacent paint sheen at all touch-up locations.</b>",
      },
      "Verify hardware operation after all adjustments are complete.",
    ]),
    rooms: [
      makeExampleRoom("example-kitchen", "Kitchen 102", [
        "Adjust cabinet reveal for a consistent gap.",
        "Touch up paint at the window return.",
        "Seal the countertop-to-backsplash joint.",
      ]),
      makeExampleRoom("example-study", "Study 410", [
        {
          isNew: false,
          description: "<s>Install door stop.</s>",
        },
        "Tighten hinge screws at the entry door.",
      ]),
      makeExampleRoom("example-living", "Living Room 201", [
        "Caulk the baseboard joint at the east wall.",
        "Touch up paint at the built-in shelves.",
      ]),
      makeExampleRoom("example-bedroom", "Primary Bedroom 301", [
        "Adjust closet doors for even alignment.",
        "Reinstall the towel bar at the dressing area.",
      ]),
      makeExampleRoom("example-bathroom", "Bathroom 302", [
        "Replace the cracked tile at the shower niche.",
        "Clean grout haze at the shower floor.",
      ]),
      makeExampleRoom("example-exterior", "Exterior", [
        "Seal around the south window trim.",
        "Touch up siding at the southeast corner.",
      ]),
    ],
  },
};

function refreshExampleFixture(stored) {
  if (!stored?.isExample || stored.exampleVersion === EXAMPLE_VERSION) {
    return stored;
  }

  return {
    ...INITIAL_DATA,
    date: getCurrentDateLabel(),
  };
}

function normalizeStoredData(stored, photos = {}) {
  const {
    issuance: _unusedIssuance,
    endOfPunchListDates: _unusedEndDates,
    ...storedWithoutLegacyEndData
  } = stored ?? {};
  const mergePhotos = (items = []) =>
    items.map((item) => {
      const normalizedItem = {
        ...item,
        isNew: false,
      };
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

  const withIssueSequences = (data) => {
    const general = normalizeItemIssueSeqs(data.generalNotes || []);
    const rooms = (data.rooms || []).map((room) => {
      const normalized = normalizeItemIssueSeqs(room.items || []);
      return {
        ...room,
        nextItemIssueSeq: getNextIssueSeq(
          normalized.items,
          room.nextItemIssueSeq ?? normalized.nextIssueSeq,
        ),
        items: normalized.items,
      };
    });

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
    rooms: (stored?.rooms || []).map((room) => ({
      ...room,
      items: mergePhotos(room.items || []),
    })),
  });

  return normalized;
}

const stripPhotos = (data) => {
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

function mapItem(data, id, fn) {
  const inGN = data.generalNotes.some((item) => item.id === id);
  if (inGN) {
    return {
      ...data,
      generalNotes: data.generalNotes.map((item) =>
        item.id === id ? fn(item) : item,
      ),
    };
  }

  return {
    ...data,
    rooms: data.rooms.map((room) => ({
      ...room,
      items: room.items.map((item) => (item.id === id ? fn(item) : item)),
    })),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "load":
      return action.data;

    case "setField":
      return { ...state, [action.field]: action.value };

    case "setLayout":
      return {
        ...state,
        layout: normalizeLayout({
          ...normalizeLayout(state.layout),
          ...action.layout,
        }),
      };

    case "setSiteCondition": {
      const next = [...state.siteConditions];
      next[action.index] = action.value;
      return { ...state, siteConditions: next };
    }

    case "removeSiteCondition":
      return {
        ...state,
        siteConditions: state.siteConditions.filter(
          (_, index) => index !== action.index,
        ),
      };

    case "addSiteCondition":
      return { ...state, siteConditions: [...state.siteConditions, ""] };

    case "setDocumentEndEntry": {
      const next = [...state.endOfPunchListEntries];
      next[action.index] = action.value;
      return { ...state, endOfPunchListEntries: next };
    }

    case "removeDocumentEndEntry":
      return {
        ...state,
        endOfPunchListEntries: state.endOfPunchListEntries.filter(
          (_, index) => index !== action.index,
        ),
      };

    case "addDocumentEndEntry":
      return {
        ...state,
        endOfPunchListEntries: [
          ...state.endOfPunchListEntries,
          makeDocumentEndEntry(state.date),
        ],
      };

    case "updateItem":
      return mapItem(state, action.id, (item) => ({
        ...item,
        [action.field]: action.value,
      }));

    case "setPhoto":
      return mapItem(state, action.id, (item) => ({
        ...item,
        photo: action.dataUrl,
        photoPosition: action.position,
      }));

    case "setPhotoPosition":
      return mapItem(state, action.id, (item) => ({
        ...item,
        photoPosition: action.position,
      }));

    case "addGeneralNote": {
      const nextIssueSeq = getNextIssueSeq(
        state.generalNotes,
        state.nextGeneralIssueSeq,
      );
      return {
        ...state,
        nextGeneralIssueSeq: nextIssueSeq + 1,
        generalNotes: [
          ...state.generalNotes,
          makeItem("", nextIssueSeq),
        ],
      };
    }

    case "removeGeneralNote":
      return {
        ...state,
        generalNotes: state.generalNotes.filter(
          (item) => item.id !== action.id,
        ),
      };

    case "mergeNotes":
      return mergeImportedNotes(state, action.payload).data;

    case "addRoomItem":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id !== action.roomId
            ? room
            : (() => {
                const nextIssueSeq = getNextIssueSeq(
                  room.items,
                  room.nextItemIssueSeq,
                );
                return {
                  ...room,
                  nextItemIssueSeq: nextIssueSeq + 1,
                  items: [
                    ...room.items,
                    makeItem("", nextIssueSeq),
                  ],
                };
              })(),
        ),
      };

    case "removeRoomItem":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id !== action.roomId
            ? room
            : {
                ...room,
                items: room.items.filter((item) => item.id !== action.itemId),
              },
        ),
      };

    case "setRoomName":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id !== action.roomId ? room : { ...room, name: action.name },
        ),
      };

    case "addRoom":
      return {
        ...state,
        rooms: [
          ...state.rooms,
          makeRoom("Room Name"),
        ],
      };

    case "removeRoom":
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.roomId),
      };

    case "sortRooms":
      return {
        ...state,
        rooms: [...state.rooms].sort(compareRoomNames),
      };

    case "clearAll":
      return {
        ...makeBlankProjectData(),
        project: state.project,
        projectNum: state.projectNum,
        title: state.title,
        date: state.date,
        firm: state.firm,
        // Density / summary / photo toggles are view preferences, not punch
        // list content, so clearing the body should not reset them.
        layout: normalizeLayout(state.layout),
      };

    default:
      return state;
  }
}

function DocumentIcon() {
  return (
    <svg
      className="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  );
}
function ImportIcon() {
  return (
    <svg
      className="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg
      className="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function PunchListApp() {
  const [data, dispatch] = useReducer(reducer, INITIAL_DATA);
  const [saveStatus, setSaveStatus] = useReducer((_, value) => value, "");
  const saveTimer = useRef(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const outlineEditorRef = useRef(null);
  const [importStatus, setImportStatus] = useState("");
  const [templateCopyStatus, setTemplateCopyStatus] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearTimer = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [activeId, setActiveIdState] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem("punch_list_sidebar_open");
      return stored === null ? false : stored === "true";
    } catch {
      return false;
    }
  });
  const activeIdRef = useRef(null);

  const refreshIndex = () => setProjects(loadIndex());

  useEffect(() => {
    (async () => {
      try {
        migrateLegacy();

        let id = getActiveId();
        const index = loadIndex();

        if (!id || !index.find((entry) => entry.id === id)) {
          if (index.length > 0) {
            id = index[index.length - 1].id;
          } else {
            id = createProject(INITIAL_DATA);
          }
          setActiveId(id);
        }

        activeIdRef.current = id;
        setActiveIdState(id);
        setProjects(loadIndex());

        const stored = loadProjectData(id);
        if (stored) {
          const loadable = refreshExampleFixture(stored);
          if (loadable !== stored) saveProjectData(id, stripPhotos(loadable));
          const photos = await idbGetAllPhotos(id);
          const normalized = normalizeStoredData(loadable, photos);
          dispatch({ type: "load", data: normalized });
          if (normalized.isExample) {
            setImportText(STARTER_OUTLINE);
            setImportOpen(true);
          }
          setSaveStatus("Loaded");
          setTimeout(() => setSaveStatus(""), 1500);
        }
      } catch {
        // Corrupt storage: keep the in-memory defaults.
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeIdRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        saveProjectData(activeIdRef.current, stripPhotos(data));
        refreshIndex();
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 1500);
      } catch {
        // Quota exceeded.
      }
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem("punch_list_sidebar_open", sidebarOpen);
    } catch {
      // Ignore storage failures for sidebar state.
    }
  }, [sidebarOpen]);

  /**
   * Write the current project straight away and drop the debounced save.
   *
   * Every project switch repoints activeIdRef, so a queued save from the
   * outgoing project would otherwise land under the incoming project's key.
   */
  const persistActiveProject = useCallback((snapshot) => {
    clearTimeout(saveTimer.current);
    if (!activeIdRef.current) return;
    saveProjectData(activeIdRef.current, stripPhotos(snapshot));
  }, []);

  const discardPhotos = useCallback((items = []) => {
    const projectId = activeIdRef.current;
    if (!projectId) return;
    items.forEach((item) => {
      if (item?.id) idbDeletePhoto(projectId, item.id).catch(() => {});
    });
  }, []);

  const handlePositionChange = useCallback(
    (itemId, position) => {
      dispatch({ type: "setPhotoPosition", id: itemId, position });

      const findPhoto = () => {
        for (const note of data.generalNotes) {
          if (note.id === itemId) return note.photo;
        }
        for (const room of data.rooms) {
          for (const item of room.items) {
            if (item.id === itemId) return item.photo;
          }
        }
        return null;
      };

      const dataUrl = findPhoto();
      if (dataUrl && activeIdRef.current) {
        idbSetPhoto(activeIdRef.current, itemId, { dataUrl, position }).catch(
          () => {},
        );
      }
    },
    [data],
  );

  const switchToProject = useCallback(
    async (id) => {
      persistActiveProject(data);

      activeIdRef.current = id;
      setActiveIdState(id);
      setActiveId(id);

      try {
        const stored = loadProjectData(id);
        if (stored) {
          const loadable = refreshExampleFixture(stored);
          if (loadable !== stored) saveProjectData(id, stripPhotos(loadable));
          const photos = await idbGetAllPhotos(id);
          const normalized = normalizeStoredData(loadable, photos);
          dispatch({
            type: "load",
            data: normalized,
          });
          setImportOpen(Boolean(normalized.isExample));
          setImportText(normalized.isExample ? STARTER_OUTLINE : "");
          setImportStatus("");
          setHelpOpen(false);
        }
      } catch {
        // Ignore corrupt storage.
      }

      refreshIndex();
      setSidebarOpen(false);
    },
    [data, persistActiveProject],
  );

  const handleNewProject = useCallback(() => {
    persistActiveProject(data);

    const blankData = makeBlankProjectData();
    const id = createProject(blankData);
    activeIdRef.current = id;
    setActiveIdState(id);
    setActiveId(id);
    dispatch({ type: "load", data: blankData });
    refreshIndex();
    setSidebarOpen(false);
    setImportText("");
    setImportStatus("");
    setImportOpen(true);
    setHelpOpen(false);
  }, [data, persistActiveProject]);

  const handleDuplicate = useCallback(async () => {
    const sourceData = data;
    persistActiveProject(sourceData);

    const sourceId = activeIdRef.current;
    const copy = {
      ...stripPhotos(sourceData),
      project: sourceData.project
        ? `${sourceData.project} (copy)`
        : "Untitled punch list (copy)",
      date: getCurrentDateLabel(),
    };
    const id = createProject(copy);

    // Item IDs carry over, so the photos have to be copied under the new
    // project's key namespace or the duplicate comes out with none.
    await idbCopyProjectPhotos(sourceId, id).catch(() => {});

    activeIdRef.current = id;
    setActiveIdState(id);
    setActiveId(id);
    dispatch({
      type: "load",
      data: { ...sourceData, project: copy.project, date: copy.date },
    });
    refreshIndex();
    setSidebarOpen(false);
  }, [data, persistActiveProject]);

  const handleDeleteProject = useCallback(async (id) => {
    const wasActive = activeIdRef.current === id;
    if (wasActive) clearTimeout(saveTimer.current);

    deleteProject(id);
    idbClearAll(id).catch(() => {});

    if (!wasActive) {
      refreshIndex();
      return;
    }

    const remaining = loadIndex();
    const next = remaining[remaining.length - 1];

    if (!next) {
      const exampleData = {
        ...INITIAL_DATA,
        date: getCurrentDateLabel(),
      };
      const nextId = createProject(exampleData);
      activeIdRef.current = nextId;
      setActiveIdState(nextId);
      setActiveId(nextId);
      dispatch({ type: "load", data: exampleData });
      refreshIndex();
      setImportText(STARTER_OUTLINE);
      setImportStatus("");
      setImportOpen(true);
      return;
    }

    activeIdRef.current = next.id;
    setActiveIdState(next.id);
    setActiveId(next.id);
    try {
      const stored = loadProjectData(next.id);
      const photos = await idbGetAllPhotos(next.id);
      dispatch({
        type: "load",
        data: normalizeStoredData(stored || makeBlankProjectData(), photos),
      });
    } catch {
      dispatch({ type: "load", data: makeBlankProjectData() });
    }
    refreshIndex();
  }, []);

  const handleImportFile = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await readImportFile(file);
      setImportText(text);
      setImportStatus(
        `${file.name} loaded. Review the punch list, then import.`,
      );
    } catch (error) {
      setImportStatus(
        error instanceof Error
          ? error.message
          : "That file could not be read. Use .docx, .md, or .txt.",
      );
    } finally {
      event.target.value = "";
    }
  }, []);

  const handleImportSubmit = useCallback(() => {
    try {
      const parsed = parseImportText(importText);

      if (data.isExample) {
        persistActiveProject(data);
        const blankData = makeBlankProjectData();
        const importedData = mergeImportedNotes(blankData, parsed).data;
        const id = createProject(importedData);

        activeIdRef.current = id;
        setActiveIdState(id);
        setActiveId(id);
        dispatch({ type: "load", data: importedData });
        refreshIndex();
        setImportText("");
        setImportStatus("");
        setImportOpen(false);
        setSaveStatus("Punch list created");
        setTimeout(() => setSaveStatus(""), 1800);
        return;
      }

      dispatch({ type: "mergeNotes", payload: parsed });
      setImportStatus(summarizeMerge(parsed, data));
      // The panel stays open: the status it just set is rendered inside it,
      // so closing here threw away the only report of what was imported.
      setImportText("");
    } catch (error) {
      setImportStatus(
        error instanceof Error ? error.message : "Import failed.",
      );
    }
  }, [data, importText, persistActiveProject]);

  const handleOpenImport = useCallback(() => {
    setImportOpen(true);
    setHelpOpen(false);
    setImportStatus("");
    if (data.isExample && !importText.trim()) {
      setImportText(STARTER_OUTLINE);
    }
  }, [data.isExample, importText]);

  const applyImportFormatting = useCallback((command, label) => {
    const result = outlineEditorRef.current?.applyFormat(command, label);
    if (!result) return;
    setImportStatus(
      result.ok
        ? `${label} applied. The styling will carry into the punch list.`
        : result.reason,
    );
  }, []);

  const handleImportShortcut = useCallback((label, result) => {
    setImportStatus(
      result.ok
        ? `${label} applied. The styling will carry into the punch list.`
        : result.reason,
    );
  }, []);

  const handleStructuredImportPaste = useCallback((html) => {
    if (!html || !hasStructuredImportHtml(html)) return null;
    const converted = convertHtmlToImportText(html);
    if (!converted) return null;
    setImportStatus(
      "Rich paste converted to an editable outline. Review it, then import.",
    );
    return converted;
  }, []);

  const handleCopyTemplate = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PUNCH_LIST_TEMPLATE);
      setTemplateCopyStatus("Template copied");
      setTimeout(() => setTemplateCopyStatus(""), 1500);
    } catch {
      setTemplateCopyStatus("Copy failed");
      setTimeout(() => setTemplateCopyStatus(""), 1500);
    }
  }, []);

  const handleSortRooms = useCallback(() => {
    dispatch({ type: "sortRooms" });
    setSaveStatus("Rooms sorted");
    setTimeout(() => setSaveStatus(""), 1500);
  }, []);

  const handleCopyNotes = useCallback(async () => {
    try {
      await copyNotesToClipboard(data);
      setSaveStatus("Punch list text copied");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch {
      setSaveStatus("Copy failed");
      setTimeout(() => setSaveStatus(""), 1500);
    }
  }, [data]);

  const handleSaveToFile = useCallback(async () => {
    try {
      // Without an active project, idbGetAllPhotos would sweep up every
      // project's photos into the export.
      if (!activeIdRef.current) throw new Error("No active project");
      await saveProjectToFile(activeIdRef.current, stripPhotos(data));
      setSaveStatus("File saved");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch {
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(""), 1500);
    }
  }, [data]);

  const handleLoadFromFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = "";

      try {
        const { data: fileData, photos } = await loadProjectFromFile(file);

        // Save current project first
        persistActiveProject(data);

        // Create a new project from the file
        const id = createProject(fileData);
        activeIdRef.current = id;
        setActiveIdState(id);
        setActiveId(id);

        // Restore photos into IndexedDB
        await restorePhotosToIdb(id, photos);

        // Load with photos merged in
        const normalizedPhotos = await idbGetAllPhotos(id);
        dispatch({
          type: "load",
          data: normalizeStoredData(fileData, normalizedPhotos),
        });

        refreshIndex();
        setSaveStatus("File loaded");
        setTimeout(() => setSaveStatus(""), 1500);
      } catch (error) {
        setSaveStatus(
          error instanceof Error ? error.message : "Load failed",
        );
        setTimeout(() => setSaveStatus(""), 3000);
      }
    },
    [data, persistActiveProject],
  );

  const handlePreviewAndPrint = useCallback(() => {
    setImportOpen(false);
    setHelpOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }, []);

  const handleClearAll = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      clearTimer.current = setTimeout(() => setClearConfirm(false), 3000);
      return;
    }

    clearTimeout(clearTimer.current);
    setClearConfirm(false);
    if (activeIdRef.current) {
      idbClearProjectPhotos(activeIdRef.current).catch(() => {});
    }
    dispatch({ type: "clearAll" });
  };

  const handleAddRoom = useCallback(() => {
    dispatch({ type: "addRoom" });
    setImportOpen(false);
    setHelpOpen(false);

    // Adding a room can create another fixed-size document page. Take the user
    // straight to the new room instead of leaving them on a summary page.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const roomInputs = document.querySelectorAll(".room-name-input");
        const roomInput = roomInputs[roomInputs.length - 1];
        roomInput?.scrollIntoView({ behavior: "smooth", block: "center" });
        roomInput?.focus();
        roomInput?.select();
      });
    });
  }, []);

  const layout = normalizeLayout(data.layout);
  const layoutMetrics = getLayoutMetrics(layout);
  const summaryEntries = [
    ...data.generalNotes.map((item) => ({
      id: item.id,
      location: data.generalNotesTitle || "General",
      issueCode: formatIssueCode(
        "generalNotes",
        data.generalNotesTitle,
        item.issueSeq,
      ),
      description: item.description,
      isNew:
        Boolean(item.isNew) || containsInlineTag(item.description, "u"),
      isRevised: containsInlineTag(item.description, "b"),
      isCompleted: containsInlineTag(item.description, "s"),
    })),
    ...data.rooms.flatMap((room) =>
      room.items.map((item) => ({
        id: item.id,
        location: room.name,
        issueCode: formatIssueCode("room", room.name, item.issueSeq),
        description: item.description,
        isNew:
          Boolean(item.isNew) || containsInlineTag(item.description, "u"),
        isRevised: containsInlineTag(item.description, "b"),
        isCompleted: containsInlineTag(item.description, "s"),
      })),
    ),
  ];
  const summaryStats = summarizeEntries(summaryEntries);
  const summaryPages = layout.showSummary
    ? paginateSummary(summaryEntries)
    : [];
  const detailPages = paginateDetail(data, layout, {
    includeSiteConditions: summaryPages.length === 0,
    includeDocumentEnd: true,
  });
  const pages = [
    ...summaryPages.map((segments) => ({ kind: "summary", segments })),
    ...detailPages.map((segments) => ({ kind: "detail", segments })),
  ];
  const firstSectionChunk = {};
  const lastSectionChunk = {};
  pages
    .flatMap((page) => page.segments)
    .forEach((seg) => {
      const chunks =
        seg.type === "rowGroup"
          ? seg.sections
          : seg.type === "sectionEmpty"
            ? [seg.section]
            : [];
      chunks.forEach((chunk) => {
        lastSectionChunk[chunk.sectionId] = chunk;
        if (!firstSectionChunk[chunk.sectionId]) {
          firstSectionChunk[chunk.sectionId] = chunk;
        }
      });
    });

  const getSectionIssueCode = (section, item) =>
    formatIssueCode(section.kind, section.title, item.issueSeq);

  const renderHeaderCell = (section, key) => {
    const headerClass = [
      "section-header-cell",
      section.kind === "generalNotes"
        ? "section-header-cell--general"
        : "section-header-cell--room",
      section.items.length === 0 ? "section-header-cell--empty" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (section.kind === "generalNotes") {
      return (
        <div
          key={key}
          className={headerClass}
          style={{ gridColumn: `span ${section.span}` }}
        >
          {section.cont ? (
            <span className="section-header-title">
              {data.generalNotesTitle || "General"} (cont&apos;d)
            </span>
          ) : (
            <input
              className="gn-title-input"
              value={data.generalNotesTitle ?? "General"}
              onChange={(event) =>
                dispatch({
                  type: "setField",
                  field: "generalNotesTitle",
                  value: event.target.value,
                })
              }
            />
          )}
        </div>
      );
    }

    const showRemove = firstSectionChunk[section.sectionId] === section;
    // Flag it where the user can act on it: next to the input they need to
    // edit, on the room's first chunk only. Screen-only — see the print rules.
    const needsRoomNumber = showRemove && isUnnumberedRoom(section.title);
    return (
      <div
        key={key}
        className={headerClass}
        style={{ gridColumn: `span ${section.span}` }}
      >
        <input
          className="room-name-input"
          value={section.cont ? `${section.title}  (cont'd)` : section.title}
          readOnly={section.cont}
          onChange={(event) =>
            !section.cont &&
            dispatch({
              type: "setRoomName",
              roomId: section.sectionId,
              name: event.target.value,
            })
          }
          placeholder="Room name..."
        />
        {needsRoomNumber && (
          <span
            className="room-number-warning"
            title="This room has no number, so its items are coded 000-NN. Add a 2-4 digit room number to the name."
          >
            Add room no.
          </span>
        )}
        {showRemove && (
          <button
            className="btn-danger"
            onClick={() => {
              const room = data.rooms.find(
                (entry) => entry.id === section.sectionId,
              );
              discardPhotos(room?.items);
              dispatch({ type: "removeRoom", roomId: section.sectionId });
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  const renderItemCell = (section, item) => (
    <ItemCard
      key={item.id}
      projectId={activeIdRef.current}
      item={item}
      issueCode={getSectionIssueCode(section, item)}
      issueCodeStyle={getIssueCodeStyle({
        isNew:
          Boolean(item.isNew) || containsInlineTag(item.description, "u"),
        isCompleted: containsInlineTag(item.description, "s"),
      })}
      density={layout.density}
      persistPhotos
      onDescChange={(value) =>
        dispatch({
          type: "updateItem",
          id: item.id,
          field: "description",
          value,
        })
      }
      onPhoto={(url, position) =>
        dispatch({
          type: "setPhoto",
          id: item.id,
          dataUrl: url,
          position,
        })
      }
      onRemove={() => {
        // Photos live in IndexedDB keyed by item ID; dropping the item alone
        // left the image orphaned there forever.
        discardPhotos([item]);
        dispatch(
          section.sectionId === GENERAL_NOTES_SECTION_ID
            ? { type: "removeGeneralNote", id: item.id }
            : {
                type: "removeRoomItem",
                roomId: section.sectionId,
                itemId: item.id,
              },
        );
      }}
      onPositionChange={(position) => handlePositionChange(item.id, position)}
    />
  );

  const renderSummaryDescriptionCell = (entry) => (
    <div className="summary-cell summary-cell--description">
      <RichText
        className="summary-desc-edit"
        value={entry.description}
        onChange={(html) =>
          dispatch({
            type: "updateItem",
            id: entry.id,
            field: "description",
            value: html,
          })
        }
        placeholder="Click here to enter description"
      />
    </div>
  );

  const renderSummaryCount = () =>
    [
      `${summaryStats.total - summaryStats.completed} open`,
      `${summaryStats.new} new`,
      `${summaryStats.revised} revised`,
      `${summaryStats.completed} completed`,
    ].map((label) => (
      <span key={label} className="summary-stat">
        {label}
      </span>
    ));

  const renderActionCell = (section, key) => {
    const isLast = lastSectionChunk[section.sectionId] === section;
    if (!isLast) {
      return (
        <div
          key={key}
          className="row-action-spacer"
          style={{ gridColumn: `span ${section.span}` }}
        />
      );
    }

    if (section.sectionId === GENERAL_NOTES_SECTION_ID) {
      return (
        <button
          key={key}
          className="row-action-btn"
          style={{ gridColumn: `span ${section.span}` }}
          onClick={() => dispatch({ type: "addGeneralNote" })}
        >
          + Add note to {data.generalNotesTitle || "General"}
        </button>
      );
    }

    return (
      <button
        key={key}
        className="row-action-btn"
        style={{ gridColumn: `span ${section.span}` }}
        onClick={() =>
          dispatch({ type: "addRoomItem", roomId: section.sectionId })
        }
      >
        + Add item to {section.title || "this room"}
      </button>
    );
  };

  const renderSpacer = (span, key, className) => {
    if (span <= 0) return null;
    return (
      <div
        key={key}
        className={className}
        style={{ gridColumn: `span ${span}` }}
      />
    );
  };

  const renderRowGroup = (seg, key) => {
    const usedCols = seg.sections.reduce(
      (sum, section) => sum + section.span,
      0,
    );
    const remainingCols = layoutMetrics.columns - usedCols;
    const hasActions = seg.sections.some(
      (section) => lastSectionChunk[section.sectionId] === section,
    );

    return (
      <div key={key} className="content-row-group">
        <div className="content-row-headers">
          {seg.sections.map((section, index) =>
            renderHeaderCell(section, `${key}-header-${index}`),
          )}
          {renderSpacer(
            remainingCols,
            `${key}-header-spacer`,
            "section-header-spacer",
          )}
        </div>
        <div className="content-row-items">
          {seg.sections.flatMap((section) =>
            section.items.map((item) => renderItemCell(section, item)),
          )}
          {renderSpacer(remainingCols, `${key}-item-spacer`, "item-card empty")}
        </div>
        {hasActions && (
          <div className="content-row-actions">
            {seg.sections.map((section, index) =>
              renderActionCell(section, `${key}-action-${index}`),
            )}
            {renderSpacer(
              remainingCols,
              `${key}-action-spacer`,
              "row-action-spacer",
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEmptySection = (seg, key) => {
    const section = seg.section;
    const isLast = lastSectionChunk[section.sectionId] === section;

    return (
      <div key={key} className="empty-section-group">
        <div className="content-row-headers">
          {renderHeaderCell(section, `${key}-header`)}
        </div>
        {isLast && (
          <div className="content-row-actions">
            {renderActionCell(section, `${key}-action`)}
          </div>
        )}
      </div>
    );
  };

  const pageClassName = [
    "page",
    `page--${layout.density.replace("x", "-")}`,
  ].join(" ");

  const renderDocumentHeader = (pageNumber, totalPages) => (
    <>
      <div className="doc-header">
        <div className="doc-header-left">
          <input
            className="doc-header-project"
            value={data.project}
            placeholder="Project address"
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "project",
                value: event.target.value,
              })
            }
          />
          <input
            className="doc-header-projnum"
            value={data.projectNum}
            placeholder="Project number"
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "projectNum",
                value: event.target.value,
              })
            }
          />
        </div>
        <div className="doc-header-center">
          <input
            className="doc-header-title"
            value={data.title}
            placeholder="Punch List"
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "title",
                value: event.target.value,
              })
            }
          />
          <input
            className="doc-header-date"
            value={data.date}
            placeholder="Date"
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "date",
                value: event.target.value,
              })
            }
          />
        </div>
        <div className="doc-header-right">
          <input
            className="doc-header-firm"
            value={data.firm ?? ""}
            size={Math.max(24, Math.min(34, (data.firm ?? "").length + 2))}
            placeholder="Prepared by"
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "firm",
                value: event.target.value,
              })
            }
          />
          <div className="doc-header-page">
            page {pageNumber} of {totalPages}
          </div>
        </div>
      </div>
      <hr className="doc-header-rule" />
    </>
  );

  const renderHeaderNote = () => (
    <div className="header-note">
      <RichText
        value={data.headerNote ?? ""}
        onChange={(html) =>
          dispatch({ type: "setField", field: "headerNote", value: html })
        }
        placeholder="Header note..."
        className="header-note-input"
      />
    </div>
  );

  const renderSiteConditions = () => (
    <div>
      <div className="section-label-row">
        <div className="section-label">Site Conditions</div>
        <input
          className="site-input site-date-input"
          value={data.punchlistDate ?? ""}
          onChange={(event) =>
            dispatch({
              type: "setField",
              field: "punchlistDate",
              value: event.target.value,
            })
          }
          placeholder="Punch list date and time"
        />
      </div>
      <ul className="site-list">
        {data.siteConditions.map((condition, index) => (
          <li key={index} className="site-item">
            <span className="site-bullet">-</span>
            <input
              className="site-input"
              value={condition}
              onChange={(event) =>
                dispatch({
                  type: "setSiteCondition",
                  index,
                  value: event.target.value,
                })
              }
              placeholder="Add condition..."
            />
            <button
              className="site-remove"
              onClick={() => dispatch({ type: "removeSiteCondition", index })}
            >
              x
            </button>
          </li>
        ))}
      </ul>
      <button
        className="add-inline"
        onClick={() => dispatch({ type: "addSiteCondition" })}
      >
        + Add condition
      </button>
    </div>
  );

  const renderSummaryPage = (segments, pageIdx, totalPages) => {
    const headerSegs = segments.filter(
      (seg) => seg.type === "header" || seg.type === "siteConditions",
    );
    const summarySeg = segments.find((seg) => seg.type === "summary");
    if (!summarySeg) return null;

    return (
      <div key={`summary-${pageIdx}`} className="page page--summary">
        {renderDocumentHeader(pageIdx + 1, totalPages)}
        {headerSegs.some((seg) => seg.type === "siteConditions") && (
          <>
            {renderHeaderNote()}
            {renderSiteConditions()}
          </>
        )}

        <div className="summary-page-body">
          <div className="summary-header-row">
            <div className="section-label">Summary</div>
            {layout.showCount && (
              <div className="summary-count">{renderSummaryCount()}</div>
            )}
          </div>

          <div className="summary-table-head">
            <div className="summary-col summary-col--location">Location</div>
            <div className="summary-col summary-col--id">Item</div>
            <div className="summary-col summary-col--description">
              Description
            </div>
          </div>

          <div className="summary-list">
            {summarySeg.entries.map((entry) => (
              <div key={entry.id} className="summary-row">
                <div
                  className="summary-cell summary-cell--location"
                  title={entry.location}
                >
                  {entry.location}
                </div>
                <div
                  className="summary-cell summary-cell--id"
                  style={getIssueCodeStyle({
                    isNew: entry.isNew,
                    isCompleted: entry.isCompleted,
                  })}
                >
                  {entry.issueCode}
                </div>
                {renderSummaryDescriptionCell(entry)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentEnd = (key) => (
    <div className="document-end-group" key={key}>
      <button className="add-room-btn" onClick={handleAddRoom} type="button">
        + Add room
      </button>
      <div className="document-end">
        <div className="document-end-rule" />
        <div className="document-end-title">End of Punch List</div>
        <ul className="site-list document-end-list">
          {data.endOfPunchListEntries.map((entry, index) => (
            <li className="site-item document-end-item" key={index}>
              <span className="site-bullet">-</span>
              <input
                className="site-input document-end-entry-input"
                type="text"
                value={entry}
                onChange={(event) =>
                  dispatch({
                    type: "setDocumentEndEntry",
                    index,
                    value: event.target.value,
                  })
                }
                placeholder="Punch List issued [date]"
                aria-label={`End of Punch List entry ${index + 1}`}
              />
              <button
                className="site-remove"
                onClick={() =>
                  dispatch({ type: "removeDocumentEndEntry", index })
                }
                type="button"
                aria-label={`Remove End of Punch List entry ${index + 1}`}
              >
                x
              </button>
            </li>
          ))}
        </ul>
        <button
          className="add-inline document-end-add"
          onClick={() => dispatch({ type: "addDocumentEndEntry" })}
          type="button"
        >
          + Add issue date
        </button>
      </div>
    </div>
  );

  const renderDetailPage = (
    segments,
    pageIdx,
    totalPages,
  ) => {
    const headerSegs = segments.filter(
      (seg) => seg.type === "header" || seg.type === "siteConditions",
    );
    const contentSegs = segments.filter(
      (seg) => seg.type !== "header" && seg.type !== "siteConditions",
    );
    const hasSiteConditions = headerSegs.some(
      (seg) => seg.type === "siteConditions",
    );
    const contentRows = hasSiteConditions
      ? Math.max(
          1,
          contentSegs.filter(
            (seg) => seg.type === "rowGroup" || seg.type === "documentEnd",
          ).length,
        )
      : layoutMetrics.otherPageRows;
    const showInlineSummaryCount =
      summaryPages.length === 0 && pageIdx === 0 && contentSegs.length > 0;

    return (
      <div key={`detail-${pageIdx}`} className={pageClassName}>
        {renderDocumentHeader(pageIdx + 1, totalPages)}

        {headerSegs.some((seg) => seg.type === "siteConditions") && (
          <>
            {renderHeaderNote()}
            {renderSiteConditions()}
          </>
        )}

        <div className="page-content">
          {showInlineSummaryCount && layout.showCount && (
            <div className="summary-header-row summary-header-row--detail">
              <div className="summary-count">{renderSummaryCount()}</div>
            </div>
          )}
          <div
            className="page-content-body"
            style={{
              "--grid-cols": String(layoutMetrics.columns),
              "--content-rows": String(contentRows),
            }}
          >
            {contentSegs.map((seg, segIdx) => {
              if (seg.type === "rowGroup") {
                return renderRowGroup(
                  seg,
                  `page-${pageIdx}-row-${segIdx}`,
                );
              }
              if (seg.type === "documentEnd") {
                return renderDocumentEnd(
                  `page-${pageIdx}-end-${segIdx}`,
                );
              }
              return renderEmptySection(
                seg,
                `page-${pageIdx}-empty-${segIdx}`,
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={[
        "app",
        sidebarOpen ? "app--sidebar-open" : "",
        importOpen ? "app--import-open" : "",
        data.isExample ? "app--example" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ProjectSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((value) => !value)}
        projects={projects}
        activeId={activeId}
        onOpen={switchToProject}
        onNew={handleNewProject}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteProject}
        layout={layout}
        onLayoutChange={(layoutUpdate) =>
          dispatch({ type: "setLayout", layout: layoutUpdate })
        }
        onSortRooms={handleSortRooms}
        onCopyNotes={handleCopyNotes}
        copyStatus={
          saveStatus === "Punch list text copied" ? "Copied" : undefined
        }
        onSaveToFile={handleSaveToFile}
        onLoadFromFile={handleLoadFromFile}
        onClear={handleClearAll}
        clearConfirm={clearConfirm}
      />

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="toolbar-product">Punch List</div>
          <div className="toolbar-context">
            <span className="toolbar-document">
              {data.project
                ? `${data.project}${data.isExample ? " (Example)" : ""}`
                : "Untitled punch list"}
            </span>
            <span className="toolbar-title">
              {data.isExample ? (
                <>
                  {data.projectNum} <span aria-hidden="true">·</span>{" "}
                  {data.firm} <span aria-hidden="true">·</span> {data.date}
                </>
              ) : (
                <>
                  {data.title || "Punch List"}{" "}
                  <span aria-hidden="true">·</span> {data.date || "No date"}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="toolbar-right">
          {saveStatus && (
            <span className="save-status">
              <span className="save-status-dot" aria-hidden="true" />
              {saveStatus}
            </span>
          )}
          <button
            className="btn btn-secondary btn-help-top"
            onClick={() => {
              setHelpOpen((open) => !open);
              setImportOpen(false);
            }}
            title="How it works"
            aria-label={helpOpen ? "Close how it works" : "How it works"}
          >
            <HelpIcon />
            <span className="btn-help-label">How it works</span>
          </button>
          <button
            className="btn btn-secondary btn-import-top"
            onClick={() => {
              if (importOpen) {
                setImportOpen(false);
              } else {
                handleOpenImport();
              }
            }}
            title="Import notes"
            aria-expanded={importOpen}
            aria-controls="import-workspace"
          >
            <ImportIcon />
            Import notes
          </button>
          <button
            className="btn btn-print"
            onClick={handlePreviewAndPrint}
          >
            <DocumentIcon />
            Preview / Print PDF
          </button>
        </div>
      </div>

      {helpOpen && (
        <div className="help-panel">
          <div className="import-panel-header">
            <div className="import-panel-label">How it works</div>
            <button
              className="import-close"
              onClick={() => setHelpOpen(false)}
              aria-label="Close help panel"
            >
              ✕
            </button>
          </div>
          <div className="import-panel-body">
            <p className="help-intro">
              Draft in Word, Docs, Notes, or the text editor you already use.
              Punch List turns that outline into a numbered photo document.
            </p>
            <ol className="help-steps">
              {[
                <>
                  <strong>Write your notes in Word, Docs, Notes, or another editor.</strong>{" "}
                  Make each room a top-level bullet and indent its items below.
                </>,
                <>
                  <strong>Import the outline here.</strong> Paste it or load a
                  Word or text file; item IDs are assigned automatically.
                </>,
                <>
                  <strong>Add photos to the numbered items.</strong> Click a photo
                  area or drag images in from a folder.
                </>,
                <>
                  <strong>Add the issue date and save the PDF.</strong> The PDF is the
                  record of that version; the punch list stays editable.
                </>,
              ].map((text, i) => (
                <li key={i}>
                  <span className="help-step-num">{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <div className="help-template-callout">
              <div className="help-template-copy">
                <strong>Start from a template</strong>
                <span>
                  Copy the bullet structure, then draft the list in your preferred
                  editor before importing it here.
                </span>
              </div>
              <button
                className="help-template-btn"
                onClick={handleCopyTemplate}
                type="button"
              >
                {templateCopyStatus || "Copy punch list template"}
              </button>
            </div>
            <p className="help-note">
              Missed something after importing? Add a room or item directly on
              the page. Re-importing numbered notes updates them without
              detaching their photos.
            </p>
            <div className="help-issue-callout">
              <strong>The PDF is your saved version</strong>
              <span>
                Use Add issue date at the end of the punch list, then use
                Preview / Print PDF. The app keeps one editable working document.
              </span>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <aside
          className="import-panel import-workspace"
          id="import-workspace"
          role="dialog"
          aria-modal="false"
          aria-labelledby="import-workspace-title"
        >
          <div className="import-panel-header">
            <div>
              <div className="import-panel-label" id="import-workspace-title">
                {data.isExample ? "Start your punch list" : "Import notes"}
              </div>
              <p className="import-panel-copy">
                {data.isExample
                  ? "Replace the practice outline with your notes, then build a new project."
                  : "Review a long outline comfortably before merging it into this project."}
              </p>
            </div>
            <button
              className="import-close"
              onClick={() => setImportOpen(false)}
              aria-label="Close import panel"
            >
              ✕
            </button>
          </div>

          <div className="import-panel-body">
            <div className="import-workspace-content">
              <p className="import-section-heading">Paste your notes</p>
              <p className="import-helper import-helper--muted">
                Room names are top-level bullets; punch items are indented
                below. Paste from Word, Docs, or Notes, or load a Word or text
                file.
              </p>
              <OutlineEditor
                ref={outlineEditorRef}
                className="import-textarea import-outline-editor"
                value={importText}
                onChange={(value) => {
                  setImportText(value);
                  setImportStatus("");
                }}
                onStructuredPaste={handleStructuredImportPaste}
                onShortcut={handleImportShortcut}
                placeholder="Paste your bulleted or numbered outline here..."
                ariaLabel="Punch list outline"
              />
              <div
                className="import-format-toolbar"
                role="group"
                aria-label="Format selected punch item text"
              >
                <div className="import-format-toolbar-copy">
                  <strong>Format selected text</strong>
                  <span>Format one item or select across several.</span>
                </div>
                <div className="import-format-actions">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyImportFormatting("bold", "bold")}
                    aria-label="Bold selected text"
                    aria-keyshortcuts="Control+B Meta+B"
                    title="Bold · Ctrl+B"
                  >
                    <strong>B</strong>
                    <kbd>Ctrl+B</kbd>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      applyImportFormatting("underline", "underline")
                    }
                    aria-label="Underline selected text"
                    aria-keyshortcuts="Control+U Meta+U"
                    title="Underline · Ctrl+U"
                  >
                    <span className="import-format-underline">U</span>
                    <kbd>Ctrl+U</kbd>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      applyImportFormatting("strikeThrough", "strikethrough")
                    }
                    aria-label="Strikethrough selected text"
                    aria-keyshortcuts="Control+Shift+X Meta+Shift+X"
                    title="Strikethrough · Ctrl+Shift+X"
                  >
                    <span className="import-format-strike">S</span>
                    <kbd>Ctrl+Shift+X</kbd>
                  </button>
                </div>
              </div>
              {importStatus && (
                <div className="import-status" role="status" aria-live="polite">
                  {importStatus}
                </div>
              )}
              <div className="formatting-primer">
                <div className="formatting-primer-title">Formatting primer</div>
                <ul>
                  <li>
                    Load .docx, .md/.markdown, or .txt notes with Load notes
                    file below.
                  </li>
                  <li>Top-level bullets or numbered lines are rooms or areas.</li>
                  <li>Indented bullets or numbered lines become punch items.</li>
                  <li>Select across several items to format them together.</li>
                  <li>Underline marks new; bold marks revised; strike marks complete.</li>
                  <li>Re-importing numbered notes keeps their photos attached.</li>
                </ul>
              </div>
            </div>

            <div className="import-workspace-footer">
              <div className="import-actions">
              <label className="import-file-btn">
                <svg
                  className="import-file-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                Load notes file
                <input
                  type="file"
                  accept=".docx,.md,.markdown,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                  onChange={handleImportFile}
                  hidden
                />
              </label>
              <button
                className="btn btn-import"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
              >
                <ImportIcon />
                Import & build punch list
              </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {data.isExample && (
        <section className="example-banner" aria-label="Example project notice">
          <div className="example-banner-details">
            <span className="example-banner-icon" aria-hidden="true">
              <HelpIcon />
            </span>
            <div className="example-banner-copy">
              <strong>You're viewing an example</strong>
              <span>
                Explore freely. Changes stay in this practice project and never
                affect your real punch lists.
              </span>
            </div>
          </div>
          <button
            className="btn btn-import example-banner-action"
            onClick={handleOpenImport}
            type="button"
          >
            Start your punch list
          </button>
        </section>
      )}

      <div className="pages">
        {pages.map((page, pageIdx) =>
          page.kind === "summary"
            ? renderSummaryPage(page.segments, pageIdx, pages.length)
            : renderDetailPage(
                page.segments,
                pageIdx,
                pages.length,
              ),
        )}
        {data.rooms.length === 0 &&
          data.generalNotes.length === 0 &&
          !helpOpen &&
          !importOpen && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 13h6M9 17h4" />
              </svg>
            </div>
            <div className="empty-state-kicker">Recommended workflow</div>
            <h2 className="empty-state-heading">Write elsewhere. Import here.</h2>
            <p className="empty-state-body">
              Draft in Word, Docs, Notes, or any text editor that makes writing
              easy. Use a bullet or number for each room and indent the punch
              items below it.
            </p>
            <pre className="empty-state-example">{`1. Kitchen 102
    1. Adjust cabinet reveal
    2. Touch up paint at window return`}</pre>
            <ol className="empty-state-steps">
              <li><strong>Import</strong> your bulleted or numbered outline.</li>
              <li><strong>Drag photos</strong> onto the numbered items.</li>
              <li><strong>Print or save</strong> the finished PDF.</li>
            </ol>
            <div className="empty-state-actions">
              <button
                className="btn btn-import empty-state-btn"
                onClick={handleOpenImport}
              >
                <ImportIcon />
                Import notes
              </button>
              <button
                className="btn btn-secondary empty-state-btn"
                onClick={handleCopyTemplate}
              >
                {templateCopyStatus || "Copy outline template"}
              </button>
            </div>
            <p className="empty-state-hint">
              Need to catch a late item? Rooms and items can still be added
              directly on the document after import.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
