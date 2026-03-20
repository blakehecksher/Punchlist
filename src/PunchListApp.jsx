import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import { idbGetAllPhotos, idbSetPhoto, idbClearAll } from "./idb.js";
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
  getNextIssueSeq,
  getRoomIssuePrefix,
  normalizeItemIssueSeqs,
} from "./issueIds.js";
import { DEFAULT_LAYOUT, getLayoutMetrics, normalizeLayout } from "./layout.js";
import {
  GENERAL_NOTES_SECTION_ID,
  paginateDetail,
  paginateSummary,
} from "./pagination.js";
import ItemCard from "./ItemCard.jsx";
import RichText from "./RichText.jsx";
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
const getRoomSortNumber = (roomName) => {
  const prefix = getRoomIssuePrefix(roomName);
  const numeric = Number.parseInt(prefix, 10);
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
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
const makeItem = (description = "", issueSeq = 1) => ({
  id: uid(),
  description,
  issueSeq,
  photo: null,
  photoPosition: null,
});
const insertAtSelection = (current, start, end, inserted) =>
  `${current.slice(0, start)}${inserted}${current.slice(end)}`;
const getCurrentDateLabel = (date = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
const IMPORT_CLEANUP_PROMPT = `I will paste raw punch list notes below. Rewrite them so they can be imported into a punch list tool.

Follow these rules:
- Return plain text only
- Use dash bullets only
- Do not use numbered lists
- Do not use tables
- Do not add headings, bold text, or extra markdown
- Keep the same meaning
- Clean up grammar, spelling, and consistency
- Use Title Case for room names
- Write room name first, then room number
- Put rooms in ascending room-number order
- If my notes include Site Conditions, keep them under:
  - Site Conditions
- If my notes include General Notes, keep them under:
  - General Notes
- Put each room as a top-level dash bullet
- Put each punch list item as a nested dash bullet under that room
- Keep any sub-items as nested dash bullets under the main item
- Do not combine, remove, or invent items

Use this exact format:

- Site Conditions
    - condition text
- General Notes
    - note text
- Study 410
    - item text
    - item text
        - sub-item text
- Primary Bedroom 402
    - item text

After these instructions, I will paste my raw notes.
Reply with the cleaned bullet list only.`;

function summarizeImport(parsed) {
  const roomCount = parsed.rooms.length;
  const roomItemCount = parsed.rooms.reduce(
    (sum, room) => sum + room.items.length,
    0,
  );
  const siteConditionCount = parsed.siteConditions.length;
  const gnCount = parsed.generalNotes.length;
  const parts = [];

  if (siteConditionCount > 0) {
    parts.push(
      `${siteConditionCount} site condition${siteConditionCount === 1 ? "" : "s"}`,
    );
  }
  if (gnCount > 0) {
    parts.push(`${gnCount} general note${gnCount === 1 ? "" : "s"}`);
  }
  if (roomItemCount > 0) {
    parts.push(
      `${roomItemCount} room item${roomItemCount === 1 ? "" : "s"} across ${roomCount} room${roomCount === 1 ? "" : "s"}`,
    );
  }

  return parts.length > 0
    ? `Imported ${parts.join(" and ")}.`
    : "Nothing imported.";
}

function makeBlankProjectData() {
  return {
    project: "Project Name",
    projectNum: "Proj. # 0000",
    title: "Punchlist",
    date: getCurrentDateLabel(),
    firm: "Firm Name",
    punchlistDate: "",
    generalNotesTitle: "General",
    layout: { ...DEFAULT_LAYOUT },
    nextGeneralIssueSeq: 1,
    siteConditions: [],
    generalNotes: [],
    rooms: [],
  };
}

function makeRoom(name = "Room Name", firstDescription = "") {
  return {
    id: uid(),
    name,
    nextItemIssueSeq: 2,
    items: [makeItem(firstDescription, 1)],
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
};

function normalizeStoredData(stored, photos = {}) {
  const mergePhotos = (items = []) =>
    items.map((item) => {
      const entry = photos[item.id];
      if (!entry) return { ...item, photo: null, photoPosition: null };
      if (typeof entry === "string")
        return { ...item, photo: entry, photoPosition: null };
      return {
        ...item,
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

  return withIssueSequences({
    ...makeBlankProjectData(),
    ...stored,
    layout: normalizeLayout(stored?.layout),
    firm: stored?.firm ?? "Firm Name",
    punchlistDate: stored?.punchlistDate ?? "",
    generalNotesTitle: stored?.generalNotesTitle ?? "General",
    siteConditions: stored?.siteConditions || [],
    generalNotes: mergePhotos(stored?.generalNotes || []),
    rooms: (stored?.rooms || []).map((room) => ({
      ...room,
      items: mergePhotos(room.items || []),
    })),
  });
}

const stripPhotos = (data) => ({
  ...data,
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
});

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
        generalNotes: [...state.generalNotes, makeItem("", nextIssueSeq)],
      };
    }

    case "removeGeneralNote":
      return {
        ...state,
        generalNotes: state.generalNotes.filter(
          (item) => item.id !== action.id,
        ),
      };

    case "importNotes": {
      const rooms = state.rooms.map((room) => ({
        ...room,
        items: [...room.items],
      }));
      const roomIndexByKey = new Map(
        rooms.map((room, index) => [normalizeRoomKey(room.name), index]),
      );
      const nextSiteConditions = [
        ...state.siteConditions,
        ...action.payload.siteConditions,
      ];
      const nextGeneralNotes = [...state.generalNotes];
      let nextGeneralIssueSeq = getNextIssueSeq(
        nextGeneralNotes,
        state.nextGeneralIssueSeq,
      );
      action.payload.generalNotes.forEach((description) => {
        nextGeneralNotes.push(makeItem(description, nextGeneralIssueSeq));
        nextGeneralIssueSeq += 1;
      });

      action.payload.rooms.forEach((room) => {
        const key = normalizeRoomKey(room.name);
        const existingIndex = roomIndexByKey.get(key);

        if (existingIndex !== undefined) {
          let nextRoomIssueSeq = getNextIssueSeq(
            rooms[existingIndex].items,
            rooms[existingIndex].nextItemIssueSeq,
          );
          const importedItems = room.items.map((description) => {
            const item = makeItem(description, nextRoomIssueSeq);
            nextRoomIssueSeq += 1;
            return item;
          });
          rooms[existingIndex] = {
            ...rooms[existingIndex],
            nextItemIssueSeq: nextRoomIssueSeq,
            items: [...rooms[existingIndex].items, ...importedItems],
          };
          return;
        }

        let nextRoomIssueSeq = 1;
        const importedItems = room.items.map((description) => {
          const item = makeItem(description, nextRoomIssueSeq);
          nextRoomIssueSeq += 1;
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

      return {
        ...state,
        nextGeneralIssueSeq,
        siteConditions: nextSiteConditions,
        generalNotes: nextGeneralNotes,
        rooms,
      };
    }

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
                  items: [...room.items, makeItem("", nextIssueSeq)],
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
        rooms: [...state.rooms, makeRoom()],
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
      return makeBlankProjectData();

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
function CopyIcon() {
  return (
    <svg
      className="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      className="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
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
  const [importStatus, setImportStatus] = useState("");
  const [promptCopyStatus, setPromptCopyStatus] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearTimer = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [activeId, setActiveIdState] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem("pl_sidebar_open") === "true";
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
          const photos = await idbGetAllPhotos(id);
          dispatch({ type: "load", data: normalizeStoredData(stored, photos) });
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
      localStorage.setItem("pl_sidebar_open", sidebarOpen);
    } catch {
      // Ignore storage failures for sidebar state.
    }
  }, [sidebarOpen]);

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
      if (activeIdRef.current) {
        saveProjectData(activeIdRef.current, stripPhotos(data));
      }

      activeIdRef.current = id;
      setActiveIdState(id);
      setActiveId(id);

      try {
        const stored = loadProjectData(id);
        if (stored) {
          const photos = await idbGetAllPhotos(id);
          dispatch({
            type: "load",
            data: normalizeStoredData(stored, photos),
          });
        }
      } catch {
        // Ignore corrupt storage.
      }

      refreshIndex();
    },
    [data],
  );

  const handleNewProject = useCallback(() => {
    if (activeIdRef.current) {
      saveProjectData(activeIdRef.current, stripPhotos(data));
    }

    const blankData = makeBlankProjectData();
    const id = createProject(blankData);
    activeIdRef.current = id;
    setActiveIdState(id);
    setActiveId(id);
    dispatch({ type: "load", data: blankData });
    refreshIndex();
  }, [data]);

  const handleDuplicate = useCallback(() => {
    if (activeIdRef.current) {
      saveProjectData(activeIdRef.current, stripPhotos(data));
    }

    const copy = {
      ...stripPhotos(data),
      project: `${data.project} (copy)`,
    };
    const id = createProject(copy);
    activeIdRef.current = id;
    setActiveIdState(id);
    setActiveId(id);
    dispatch({
      type: "load",
      data: { ...copy, date: getCurrentDateLabel() },
    });
    refreshIndex();
  }, [data]);

  const handleDeleteProject = useCallback((id) => {
    deleteProject(id);
    idbClearAll(id).catch(() => {});
    refreshIndex();
  }, []);

  const handleImportFile = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await readImportFile(file);
      setImportText(text);
      setImportStatus(`${file.name} loaded. Review the outline, then import.`);
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
      dispatch({ type: "importNotes", payload: parsed });
      setImportStatus(summarizeImport(parsed));
      setImportText("");
    } catch (error) {
      setImportStatus(
        error instanceof Error ? error.message : "Import failed.",
      );
    }
  }, [importText]);

  const handleImportPaste = useCallback(
    (event) => {
      const clipboard = event.clipboardData;
      const html = clipboard?.getData("text/html") ?? "";
      if (!html || !hasStructuredImportHtml(html)) return;

      const converted = convertHtmlToImportText(html);
      if (!converted) return;

      event.preventDefault();

      const textarea = event.target;
      const selectionStart =
        typeof textarea.selectionStart === "number"
          ? textarea.selectionStart
          : importText.length;
      const selectionEnd =
        typeof textarea.selectionEnd === "number"
          ? textarea.selectionEnd
          : selectionStart;

      setImportText((current) =>
        insertAtSelection(current, selectionStart, selectionEnd, converted),
      );
      setImportStatus(
        "Rich paste converted to outline. Review the outline, then import.",
      );
    },
    [importText],
  );

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(IMPORT_CLEANUP_PROMPT);
      setPromptCopyStatus("Copied");
      setTimeout(() => setPromptCopyStatus(""), 1500);
    } catch {
      setPromptCopyStatus("Copy failed");
      setTimeout(() => setPromptCopyStatus(""), 1500);
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
      setSaveStatus("Notes copied");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch {
      setSaveStatus("Copy failed");
      setTimeout(() => setSaveStatus(""), 1500);
    }
  }, [data]);

  const handleSaveToFile = useCallback(async () => {
    try {
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
        if (activeIdRef.current) {
          saveProjectData(activeIdRef.current, stripPhotos(data));
        }

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
    [data],
  );

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
    })),
    ...data.rooms.flatMap((room) =>
      room.items.map((item) => ({
        id: item.id,
        location: room.name,
        issueCode: formatIssueCode("room", room.name, item.issueSeq),
        description: item.description,
      })),
    ),
  ];
  const summaryPages = layout.showSummary
    ? paginateSummary(summaryEntries)
    : [];
  const detailPages = paginateDetail(data, layout, {
    includeSiteConditions: summaryPages.length === 0,
  });
  const pages = [
    ...summaryPages.map((segments) => ({ kind: "summary", segments })),
    ...detailPages.map((segments) => ({ kind: "detail", segments })),
  ];
  const lastDetailPageIndex = pages.reduce(
    (lastIndex, page, index) => (page.kind === "detail" ? index : lastIndex),
    -1,
  );

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
        {showRemove && (
          <button
            className="btn-danger"
            onClick={() =>
              dispatch({ type: "removeRoom", roomId: section.sectionId })
            }
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
      density={layout.density}
      showPhotos={layout.showPhotos}
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
      onRemove={() =>
        dispatch(
          section.sectionId === GENERAL_NOTES_SECTION_ID
            ? { type: "removeGeneralNote", id: item.id }
            : {
                type: "removeRoomItem",
                roomId: section.sectionId,
                itemId: item.id,
              },
        )
      }
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
          + Add note
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
        + Add item
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
    layout.showPhotos ? "page--with-photos" : "page--text-only",
  ].join(" ");

  const renderDocumentHeader = (pageNumber, totalPages) => (
    <>
      <div className="doc-header">
        <div className="doc-header-left">
          <input
            className="doc-header-project"
            value={data.project}
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
          placeholder="Punchlist date and time..."
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
        {headerSegs.some((seg) => seg.type === "siteConditions") &&
          renderSiteConditions()}

        <div className="summary-page-body">
          <div className="summary-header-row">
            <div className="section-label">Summary</div>
            <div className="summary-count">
              {summaryEntries.length} item
              {summaryEntries.length === 1 ? "" : "s"}
            </div>
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
                <div className="summary-cell summary-cell--id">
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

  const renderDetailPage = (
    segments,
    pageIdx,
    totalPages,
    isLastDetailPage,
  ) => {
    const headerSegs = segments.filter(
      (seg) => seg.type === "header" || seg.type === "siteConditions",
    );
    const contentSegs = segments.filter(
      (seg) => seg.type !== "header" && seg.type !== "siteConditions",
    );

    return (
      <div key={`detail-${pageIdx}`} className={pageClassName}>
        {renderDocumentHeader(pageIdx + 1, totalPages)}

        {headerSegs.some((seg) => seg.type === "siteConditions") &&
          renderSiteConditions()}

        <div className="page-content">
          <div
            className="page-content-body"
            style={{
              "--grid-cols": String(layoutMetrics.columns),
              "--content-rows": String(
                headerSegs.some((seg) => seg.type === "siteConditions")
                  ? layoutMetrics.firstPageRows
                  : layoutMetrics.otherPageRows,
              ),
            }}
          >
            {contentSegs.map((seg, segIdx) =>
              seg.type === "rowGroup"
                ? renderRowGroup(seg, `page-${pageIdx}-row-${segIdx}`)
                : renderEmptySection(seg, `page-${pageIdx}-empty-${segIdx}`),
            )}
          </div>
          {isLastDetailPage && (
            <button
              className="add-room-btn"
              onClick={() => dispatch({ type: "addRoom" })}
            >
              + Add room
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`app${sidebarOpen ? " app--sidebar-open" : ""}`}>
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
        onSaveToFile={handleSaveToFile}
        onLoadFromFile={handleLoadFromFile}
      />

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">
            {data.project} - {data.title} - {data.date}
          </span>
        </div>
        <div className="toolbar-right">
          {saveStatus && <span className="save-status">{saveStatus}</span>}
          <button
            className="btn btn-secondary"
            onClick={() => setHelpOpen((open) => !open)}
            title="How to use this app"
          >
            <HelpIcon />
            {helpOpen ? "Close Help" : "Help"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setImportOpen((open) => !open)}
          >
            <ImportIcon />
            {importOpen ? "Close Import" : "Import Notes"}
          </button>
          <button className="btn btn-secondary" onClick={handleCopyNotes}>
            <CopyIcon />
            Copy Notes
          </button>
          <button className="btn btn-print" onClick={() => window.print()}>
            <DocumentIcon />
            Print / PDF
          </button>
          <div className="toolbar-divider" />
          <button
            className={`btn ${clearConfirm ? "btn-clear-confirm" : "btn-danger-idle"}`}
            onClick={() => {
              if (!clearConfirm) {
                setClearConfirm(true);
                clearTimer.current = setTimeout(
                  () => setClearConfirm(false),
                  3000,
                );
              } else {
                clearTimeout(clearTimer.current);
                setClearConfirm(false);
                if (activeIdRef.current) {
                  idbClearAll(activeIdRef.current).catch(() => {});
                }
                dispatch({ type: "clearAll" });
              }
            }}
          >
            <TrashIcon />
            {clearConfirm ? "Confirm Clear" : "Clear All"}
          </button>
        </div>
      </div>

      {helpOpen && (
        <div className="help-panel">
          <div className="import-panel-header">
            <div className="import-panel-label">How to Use</div>
            <button
              className="import-close"
              onClick={() => setHelpOpen(false)}
              aria-label="Close help panel"
            >
              ✕
            </button>
          </div>
          <div className="import-panel-body">
            <ol className="help-steps">
              {[
                <>
                  <strong>Write your punch list notes</strong> as a simple
                  bulleted outline in any text editor — room name first, items
                  indented beneath.
                </>,
                <>
                  <strong>Click "Import Notes"</strong> and paste your outline.
                  Use "Clean up with AI" if your notes are rough.
                </>,
                <>
                  <strong>Attach photos</strong> to any item by clicking or
                  dragging an image onto the photo area. Pan with drag, zoom
                  with the +/− buttons.
                </>,
                <>
                  <strong>Click "Print / PDF"</strong> to open the print dialog
                  and save a formatted PDF.
                </>,
              ].map((text, i) => (
                <li key={i}>
                  <span className="help-step-num">{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <p className="help-note">
              All data is saved automatically in your browser. Use the sidebar
              (☰) to switch between projects.
            </p>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="import-panel">
          <div className="import-panel-header">
            <div className="import-panel-label">Import Punchlist Notes</div>
            <button
              className="import-close"
              onClick={() => setImportOpen(false)}
              aria-label="Close import panel"
            >
              ✕
            </button>
          </div>

          <div className="import-panel-body">
            <p className="import-section-heading">Note format</p>
            <p className="import-helper">
              Each room is a top-level bullet. Items are indented beneath it.
              Use a dash and a space <span className="import-code">- </span> for
              each bullet, and 4 spaces (or a tab) to indent.
            </p>
            <pre className="import-example">{`- Study 410
    - Install smoke/CO detector
    - Drop shelves
        - 1st shelf drop by 1 pin
- Kitchen 102
    - Adjust cabinet reveal`}</pre>
            <p className="import-helper import-helper--muted">
              <strong>Site Conditions</strong> and{" "}
              <strong>General Notes</strong> are also supported as top-level
              bullets.
            </p>

            <div className="import-divider" />

            <p className="import-section-heading">Paste your notes</p>
            <textarea
              className="import-textarea"
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportStatus("");
              }}
              onPaste={handleImportPaste}
              placeholder="Paste your bulleted outline here..."
              rows={6}
            />
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
                Load File
                <input
                  type="file"
                  accept=".doc,.docx,.md,.markdown,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                  onChange={handleImportFile}
                  hidden
                />
              </label>
              <button className="btn btn-import" onClick={handleImportSubmit}>
                <ImportIcon />
                Import
              </button>
            </div>
            {importStatus && (
              <div className="import-status">{importStatus}</div>
            )}

            <div className="import-divider" />

            <p className="import-section-heading">Notes look messy?</p>
            <p className="import-helper import-helper--muted">
              Click button below to copy prompt for use with ChatGPT or Claude.
              <br /> Paste your raw notes after it, then paste the cleaned
              result above.
            </p>
            <button className="copy-prompt-btn" onClick={handleCopyPrompt}>
              {promptCopyStatus ? promptCopyStatus : "Copy formatting prompt"}
            </button>
          </div>
        </div>
      )}

      <div className="pages">
        {pages.map((page, pageIdx) =>
          page.kind === "summary"
            ? renderSummaryPage(page.segments, pageIdx, pages.length)
            : renderDetailPage(
                page.segments,
                pageIdx,
                pages.length,
                pageIdx === lastDetailPageIndex,
              ),
        )}
        {data.rooms.length === 0 && data.generalNotes.length === 0 && (
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
            <h2 className="empty-state-heading">Start your punch list</h2>
            <p className="empty-state-body">
              Write your notes as a bulleted outline — room name first, items
              indented beneath — then import them here.
            </p>
            <pre className="empty-state-example">{`- Living Room 101\n    - Touch up paint at window return\n    - Adjust door sweep\n- Kitchen 102\n    - Verify appliance alignment`}</pre>
            <button
              className="btn btn-import empty-state-btn"
              onClick={() => setImportOpen(true)}
            >
              <ImportIcon />
              Import Notes
            </button>
            <p className="empty-state-hint">
              Or add a room manually using the "Add room" button on the page
              above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
