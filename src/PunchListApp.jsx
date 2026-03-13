import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import { idbGetAllPhotos, idbSetPhoto, idbClearAll } from "./idb.js";
import {
  convertHtmlToImportText,
  hasStructuredImportHtml,
} from "./importHtml.js";
import { readImportFile } from "./importFile.js";
import { parseImportText } from "./importParser.js";
import { DEFAULT_LAYOUT, getLayoutMetrics, normalizeLayout } from "./layout.js";
import { GENERAL_NOTES_SECTION_ID, paginate } from "./pagination.js";
import ItemCard from "./ItemCard.jsx";
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
const makeItem = (description = "") => ({
  id: uid(),
  description,
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
    siteConditions: [],
    generalNotes: [],
    rooms: [],
  };
}

const INITIAL_DATA = {
  ...makeBlankProjectData(),
  siteConditions: [
    "Example condition: final painting touch-ups are in progress",
    "Example condition: flooring protection remains in place in main hall",
    "Example condition: millwork adjustments are ongoing",
    "Example condition: electrical trim-out is still underway",
  ],
  generalNotes: [
    {
      id: "gn1",
      description:
        "Example note 01: verify final paint touch-up at all visible corners.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn2",
      description:
        "Example note 02: confirm hardware finish is consistent throughout.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn3",
      description:
        "Example note 03: clean glass, mirrors, and adjacent trim before turnover.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn4",
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
      items: [
        {
          id: "r101_1",
          description: "Example item: touch up paint at door frame corners.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r101_2",
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
      items: [
        {
          id: "r102_1",
          description:
            "Example item: adjust cabinet reveal for consistent gap.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r102_2",
          description:
            "Example item: clean stone backsplash and sealant joints.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r102_3",
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
      items: [
        {
          id: "r103_1",
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
      items: [
        {
          id: "r104_1",
          description:
            "Example item: repair minor wall blemish at window return.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r104_2",
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
      items: [
        {
          id: "r105_1",
          description: "Example item: adjust closet doors for even spacing.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r106",
      name: "106  Bath",
      items: [
        {
          id: "r106_1",
          description: "Example item: verify fixture trim is installed level.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r106_2",
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

  return {
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
  };
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

    case "addGeneralNote":
      return { ...state, generalNotes: [...state.generalNotes, makeItem()] };

    case "removeGeneralNote":
      return {
        ...state,
        generalNotes: state.generalNotes.filter((item) => item.id !== action.id),
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
      const nextGeneralNotes = [
        ...state.generalNotes,
        ...action.payload.generalNotes.map((description) =>
          makeItem(description),
        ),
      ];

      action.payload.rooms.forEach((room) => {
        const key = normalizeRoomKey(room.name);
        const importedItems = room.items.map((description) =>
          makeItem(description),
        );
        const existingIndex = roomIndexByKey.get(key);

        if (existingIndex !== undefined) {
          rooms[existingIndex] = {
            ...rooms[existingIndex],
            items: [...rooms[existingIndex].items, ...importedItems],
          };
          return;
        }

        roomIndexByKey.set(key, rooms.length);
        rooms.push({ id: uid(), name: room.name, items: importedItems });
      });

      return {
        ...state,
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
            : { ...room, items: [...room.items, makeItem()] },
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
          room.id !== action.roomId
            ? room
            : { ...room, name: action.name },
        ),
      };

    case "addRoom":
      return {
        ...state,
        rooms: [
          ...state.rooms,
          { id: uid(), name: "Room Name", items: [makeItem()] },
        ],
      };

    case "removeRoom":
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.roomId),
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
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h1" />
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

  const layout = normalizeLayout(data.layout);
  const layoutMetrics = getLayoutMetrics(layout);
  const pages = paginate(data, layout);

  const gnItemNums = {};
  data.generalNotes.forEach((item, index) => {
    gnItemNums[item.id] = index + 1;
  });

  const roomItemNums = {};
  data.rooms.forEach((room) => {
    room.items.forEach((item, index) => {
      roomItemNums[item.id] = index + 1;
    });
  });

  const firstSectionChunk = {};
  const lastSectionChunk = {};
  pages.flatMap((page) => page).forEach((seg) => {
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

  const getSectionItemNumber = (section, item) =>
    section.sectionId === GENERAL_NOTES_SECTION_ID
      ? gnItemNums[item.id]
      : roomItemNums[item.id];

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
      num={getSectionItemNumber(section, item)}
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
    const usedCols = seg.sections.reduce((sum, section) => sum + section.span, 0);
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
            className={`btn ${clearConfirm ? "btn-clear-confirm" : "btn-secondary"}`}
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
            {clearConfirm ? "Confirm Clear" : "Clear All"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setImportOpen((open) => !open)}
          >
            {importOpen ? "Close Import" : "Import Notes"}
          </button>
          <button className="btn btn-print" onClick={() => window.print()}>
            <DocumentIcon />
            Print / PDF
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="import-panel">
          <div className="import-panel-header">
            <div>
              <div className="import-panel-label">Import Punchlist Notes</div>
              <div className="import-panel-copy">
                Paste bulleted notes in the box below, or load a `.docx`, `.md`,
                or `.txt` file.
              </div>
            </div>
            <button
              className="import-close"
              onClick={() => setImportOpen(false)}
              aria-label="Close import panel"
            >
              x
            </button>
          </div>

          <div className="import-panel-body">
            <p className="import-helper">
              Format your notes as a bulleted outline - room name and number as
              the top-level item, punch list items nested beneath. A{" "}
              <strong>Site Conditions</strong> section will import into Site
              Conditions. A <strong>General Notes</strong> section will import
              into General Notes. See example below.
            </p>
            <pre className="import-example">{`- Study 410
    - Install smoke/CO detector
    - Drop shelves
        - 1st shelf drop by 1 pin
        - 2nd shelf drop by 1 pin`}</pre>
            <div className="import-tip-row">
              <p className="import-helper import-tip">
                Tip: Copy this prompt into a chatbot, paste your raw notes after
                it, then paste the chatbot&apos;s cleaned bullet list here.
              </p>
              <button className="copy-prompt-btn" onClick={handleCopyPrompt}>
                Copy prompt
                {promptCopyStatus ? ` ${promptCopyStatus}` : " ->"}
              </button>
            </div>
            <pre className="import-prompt">{IMPORT_CLEANUP_PROMPT}</pre>
            <textarea
              className="import-textarea"
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportStatus("");
              }}
              onPaste={handleImportPaste}
              placeholder="Paste import text here..."
              rows={12}
            />
            <div className="import-actions">
              <label className="import-file-btn">
                Load .docx / .md / .txt
                <input
                  type="file"
                  accept=".doc,.docx,.md,.markdown,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                  onChange={handleImportFile}
                  hidden
                />
              </label>
              <button className="btn btn-import" onClick={handleImportSubmit}>
                Add To List
              </button>
            </div>
            {importStatus && (
              <div className="import-status">{importStatus}</div>
            )}
          </div>
        </div>
      )}

      <div className="pages">
        {pages.map((pageSegs, pageIdx) => {
          const headerSegs = pageSegs.filter(
            (seg) => seg.type === "header" || seg.type === "siteConditions",
          );
          const contentSegs = pageSegs.filter(
            (seg) => seg.type !== "header" && seg.type !== "siteConditions",
          );

          return (
            <div key={pageIdx} className={pageClassName}>
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
                    page {pageIdx + 1} of {pages.length}
                  </div>
                </div>
              </div>
              <hr className="doc-header-rule" />

              {headerSegs.some((seg) => seg.type === "siteConditions") && (
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
                          onClick={() =>
                            dispatch({ type: "removeSiteCondition", index })
                          }
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
              )}

              <div className="page-content">
                <div
                  className="page-content-body"
                  style={{
                    "--grid-cols": String(layoutMetrics.columns),
                    "--content-rows": String(
                      pageIdx === 0
                        ? layoutMetrics.firstPageRows
                        : layoutMetrics.otherPageRows,
                    ),
                  }}
                >
                  {contentSegs.map((seg, segIdx) =>
                    seg.type === "rowGroup"
                      ? renderRowGroup(seg, `page-${pageIdx}-row-${segIdx}`)
                      : renderEmptySection(
                          seg,
                          `page-${pageIdx}-empty-${segIdx}`,
                        ),
                  )}
                </div>
                {pageIdx === pages.length - 1 && (
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
        })}
      </div>
    </div>
  );
}
