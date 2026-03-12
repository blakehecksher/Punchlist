import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import { idbGetAllPhotos, idbSetPhoto, idbClearAll } from "./idb.js";
import {
  convertHtmlToImportText,
  hasStructuredImportHtml,
} from "./importHtml.js";
import { readImportFile } from "./importFile.js";
import { parseImportText } from "./importParser.js";
import { paginate } from "./pagination.js";
import ItemCard from "./ItemCard.jsx";
import PhotoCell from "./PhotoCell.jsx";
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

// ── Constants ──

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
/* Legacy prompt block removed.

Clean up the language — precise and consistent, but don't change my meaning
Keep my structure exactly — dash bullets, room name before room number, sub-bullets where I have them
Consistent title case for room names (e.g. "Primary Bedroom" not "Pri Bed")
Order rooms by room number, ascending
Paste the result as plain text — no file, no extra markdown formatting

[paste your notes below this line]
*/
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

  if (siteConditionCount > 0)
    parts.push(
      `${siteConditionCount} site condition${siteConditionCount === 1 ? "" : "s"}`,
    );
  if (gnCount > 0)
    parts.push(`${gnCount} general note${gnCount === 1 ? "" : "s"}`);
  if (roomItemCount > 0)
    parts.push(
      `${roomItemCount} room item${roomItemCount === 1 ? "" : "s"} across ${roomCount} room${roomCount === 1 ? "" : "s"}`,
    );

  return parts.length > 0
    ? `Imported ${parts.join(" and ")}.`
    : "Nothing imported.";
}

// ── Initial data ──

const INITIAL_DATA = {
  project: "Project Name",
  projectNum: "Proj. # 0000",
  title: "Punchlist",
  date: getCurrentDateLabel(),
  firm: "Firm Name",
  punchlistDate: "",
  generalNotesTitle: "General",
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

// ── Helpers ──

const stripPhotos = (data) => ({
  ...data,
  generalNotes: data.generalNotes.map((i) => ({
    ...i,
    photo: null,
    photoPosition: null,
  })),
  rooms: data.rooms.map((r) => ({
    ...r,
    items: r.items.map((i) => ({ ...i, photo: null, photoPosition: null })),
  })),
});

function mapItem(data, id, fn) {
  // Update a single item by id across generalNotes and rooms
  const inGN = data.generalNotes.some((i) => i.id === id);
  if (inGN) {
    return {
      ...data,
      generalNotes: data.generalNotes.map((i) => (i.id === id ? fn(i) : i)),
    };
  }
  return {
    ...data,
    rooms: data.rooms.map((r) => ({
      ...r,
      items: r.items.map((i) => (i.id === id ? fn(i) : i)),
    })),
  };
}

// ── Reducer ──

function reducer(state, action) {
  switch (action.type) {
    case "load":
      return action.data;

    case "setField":
      return { ...state, [action.field]: action.value };

    case "setSiteCondition": {
      const sc = [...state.siteConditions];
      sc[action.index] = action.value;
      return { ...state, siteConditions: sc };
    }
    case "removeSiteCondition":
      return {
        ...state,
        siteConditions: state.siteConditions.filter(
          (_, i) => i !== action.index,
        ),
      };
    case "addSiteCondition":
      return { ...state, siteConditions: [...state.siteConditions, ""] };

    case "updateItem":
      return mapItem(state, action.id, (i) => ({
        ...i,
        [action.field]: action.value,
      }));

    case "setPhoto":
      return mapItem(state, action.id, (i) => ({
        ...i,
        photo: action.dataUrl,
        photoPosition: action.position,
      }));

    case "setPhotoPosition":
      return mapItem(state, action.id, (i) => ({
        ...i,
        photoPosition: action.position,
      }));

    case "addGeneralNote":
      return { ...state, generalNotes: [...state.generalNotes, makeItem()] };
    case "removeGeneralNote":
      return {
        ...state,
        generalNotes: state.generalNotes.filter((i) => i.id !== action.id),
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
        rooms: state.rooms.map((r) =>
          r.id !== action.roomId
            ? r
            : {
                ...r,
                items: [...r.items, makeItem()],
              },
        ),
      };
    case "removeRoomItem":
      return {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id !== action.roomId
            ? r
            : {
                ...r,
                items: r.items.filter((i) => i.id !== action.itemId),
              },
        ),
      };

    case "setRoomName":
      return {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id !== action.roomId ? r : { ...r, name: action.name },
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
        rooms: state.rooms.filter((r) => r.id !== action.roomId),
      };

    case "clearAll":
      return {
        project: "Project Name",
        projectNum: "Proj. # 0000",
        title: "Punchlist",
        date: getCurrentDateLabel(),
        firm: "Firm Name",
        punchlistDate: "",
        generalNotesTitle: "General",
        siteConditions: [],
        generalNotes: [],
        rooms: [],
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
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h1" />
    </svg>
  );
}

// ── App ──

export default function PunchListApp() {
  const [data, dispatch] = useReducer(reducer, INITIAL_DATA);
  const [saveStatus, setSaveStatus] = useReducer((_, v) => v, "");
  const saveTimer = useRef(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [promptCopyStatus, setPromptCopyStatus] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearTimer = useRef(null);

  // Project management state
  const [activeId, setActiveIdState] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem("pl_sidebar_open") === "true"; } catch { return false; }
  });
  const activeIdRef = useRef(null);

  const refreshIndex = () => setProjects(loadIndex());

  // ── Load active project on mount (with legacy migration) ──
  useEffect(() => {
    (async () => {
      try {
        // Migrate old single-project data if needed
        migrateLegacy();

        let id = getActiveId();
        const index = loadIndex();

        // If no active ID or it's been deleted, pick the first in index or create blank
        if (!id || !index.find((e) => e.id === id)) {
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
          const mergePhotos = (items) =>
            items.map((i) => {
              const entry = photos[i.id];
              if (!entry) return { ...i, photo: null, photoPosition: null };
              if (typeof entry === "string")
                return { ...i, photo: entry, photoPosition: null };
              return {
                ...i,
                photo: entry.dataUrl,
                photoPosition: entry.position ?? null,
              };
            });
          dispatch({
            type: "load",
            data: {
              ...stored,
              firm: stored.firm ?? "Firm Name",
              punchlistDate: stored.punchlistDate ?? "",
              generalNotesTitle: stored.generalNotesTitle ?? "General",
              generalNotes: mergePhotos(stored.generalNotes || []),
              rooms: (stored.rooms || []).map((r) => ({
                ...r,
                items: mergePhotos(r.items || []),
              })),
            },
          });
          setSaveStatus("Loaded");
          setTimeout(() => setSaveStatus(""), 1500);
        }
      } catch {
        /* corrupt storage — start fresh */
      }
    })();
  }, []);

  // ── Debounced auto-save ──
  useEffect(() => {
    if (!activeIdRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        saveProjectData(activeIdRef.current, stripPhotos(data));
        refreshIndex();
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 1500);
      } catch {
        /* quota exceeded */
      }
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  // Persist sidebar open state
  useEffect(() => {
    try { localStorage.setItem("pl_sidebar_open", sidebarOpen); } catch { /* */ }
  }, [sidebarOpen]);

  // ── Photo position changes ──
  const handlePositionChange = useCallback(
    (itemId, position) => {
      dispatch({ type: "setPhotoPosition", id: itemId, position });
      const findPhoto = () => {
        for (const gn of data.generalNotes)
          if (gn.id === itemId) return gn.photo;
        for (const r of data.rooms)
          for (const it of r.items) if (it.id === itemId) return it.photo;
        return null;
      };
      const dataUrl = findPhoto();
      if (dataUrl && activeIdRef.current)
        idbSetPhoto(activeIdRef.current, itemId, { dataUrl, position }).catch(() => {});
    },
    [data],
  );

  // ── Project switching ──
  const switchToProject = useCallback(async (id) => {
    // Save current before switching
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
        const mergePhotos = (items) =>
          items.map((i) => {
            const entry = photos[i.id];
            if (!entry) return { ...i, photo: null, photoPosition: null };
            if (typeof entry === "string")
              return { ...i, photo: entry, photoPosition: null };
            return { ...i, photo: entry.dataUrl, photoPosition: entry.position ?? null };
          });
        dispatch({
          type: "load",
          data: {
            ...stored,
            firm: stored.firm ?? "Firm Name",
            punchlistDate: stored.punchlistDate ?? "",
            generalNotesTitle: stored.generalNotesTitle ?? "General",
            generalNotes: mergePhotos(stored.generalNotes || []),
            rooms: (stored.rooms || []).map((r) => ({
              ...r,
              items: mergePhotos(r.items || []),
            })),
          },
        });
      }
    } catch { /* corrupt */ }
    refreshIndex();
  }, [data]);

  const handleNewProject = useCallback(() => {
    if (activeIdRef.current) {
      saveProjectData(activeIdRef.current, stripPhotos(data));
    }
    const blankData = {
      project: "Project Name",
      projectNum: "Proj. # 0000",
      title: "Punchlist",
      date: getCurrentDateLabel(),
      firm: "Firm Name",
      punchlistDate: "",
      generalNotesTitle: "General",
      siteConditions: [],
      generalNotes: [],
      rooms: [],
    };
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
    dispatch({ type: "load", data: { ...copy, date: getCurrentDateLabel() } });
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

  const pages = paginate(data);

  // Item numbering maps
  const gnItemNums = {};
  data.generalNotes.forEach((it, i) => {
    gnItemNums[it.id] = i + 1;
  });
  const roomItemNums = {};
  data.rooms.forEach((room) => {
    room.items.forEach((it, i) => {
      roomItemNums[it.id] = i + 1;
    });
  });

  // Identify first/last segments per room for add/remove button placement
  const allSegs = pages.flatMap((pg) => pg);
  const lastGnRowsSeg =
    [...allSegs].reverse().find((s) => s.type === "gnRows") ?? null;
  const lastRoomSeg = {};
  const firstRoomSeg = {};
  allSegs.forEach((seg) => {
    if (seg.type === "roomRows") {
      lastRoomSeg[seg.roomId] = seg;
      if (!firstRoomSeg[seg.roomId]) firstRoomSeg[seg.roomId] = seg;
    }
    if (seg.type === "singleRoomPair") {
      [seg.left, seg.right].forEach((entry) => {
        if (!entry) return;
        lastRoomSeg[entry.roomId] = seg;
        if (!firstRoomSeg[entry.roomId]) firstRoomSeg[entry.roomId] = seg;
      });
    }
  });

  // ── Segment renderer ──

  const renderSeg = (seg, segIdx, contentSegs) => {
    if (seg.type === "gnHeader") {
      const nextSeg = contentSegs[segIdx + 1];
      const isHalfWidth =
        nextSeg?.type === "gnRows" &&
        nextSeg.pairs.length === 1 &&
        nextSeg.pairs[0][1] === null;
      return [
        <div
          key={`gnHeader-${segIdx}`}
          className={`general-notes-header${seg.empty ? " is-empty" : ""}`}
          style={isHalfWidth ? { width: "50%" } : undefined}
        >
          {seg.cont ? (
            <span>{data.generalNotesTitle || "General"} (cont&apos;d)</span>
          ) : (
            <input
              className="gn-title-input"
              value={data.generalNotesTitle ?? "General"}
              onChange={(e) =>
                dispatch({
                  type: "setField",
                  field: "generalNotesTitle",
                  value: e.target.value,
                })
              }
            />
          )}
        </div>,
      ];
    }

    if (seg.type === "gnRows") {
      const showAdd = seg === lastGnRowsSeg;
      const elements = seg.pairs.map((pair, pi) => (
        <div key={`gn-row-${segIdx}-${pi}`} className="item-row">
          {pair.map((item, ci) =>
            item ? (
              <ItemCard
                key={item.id}
                projectId={activeIdRef.current}
                item={item}
                num={gnItemNums[item.id]}
                onDescChange={(v) =>
                  dispatch({
                    type: "updateItem",
                    id: item.id,
                    field: "description",
                    value: v,
                  })
                }
                onPhoto={(url, pos) =>
                  dispatch({
                    type: "setPhoto",
                    id: item.id,
                    dataUrl: url,
                    position: pos,
                  })
                }
                onRemove={() =>
                  dispatch({ type: "removeGeneralNote", id: item.id })
                }
                onPositionChange={(pos) => handlePositionChange(item.id, pos)}
              />
            ) : (
              <div key={ci} className="item-card empty" />
            ),
          )}
        </div>
      ));
      if (showAdd) {
        elements.push(
          <button
            key="add-gn"
            className={`add-item-cell${seg.empty ? " general-notes-add-only" : ""}`}
            onClick={() => dispatch({ type: "addGeneralNote" })}
          >
            ＋ Add note
          </button>,
        );
      }
      return elements;
    }

    if (seg.type === "roomRows") {
      const { roomId, roomName, cont, pairs } = seg;
      const showAddItem = seg === lastRoomSeg[roomId];
      const showRemove = seg === firstRoomSeg[roomId];
      const isHalfWidth = pairs.length === 1 && pairs[0][1] === null;

      const elements = [];
      elements.push(
        <div
          key={`${roomId}-hdr-${segIdx}`}
          className="room-header-row"
          style={isHalfWidth ? { width: "50%" } : undefined}
        >
          <input
            className="room-name-input"
            value={cont ? `${roomName}  (cont'd)` : roomName}
            readOnly={cont}
            onChange={(e) =>
              !cont &&
              dispatch({ type: "setRoomName", roomId, name: e.target.value })
            }
            placeholder="Room name…"
          />
          {showRemove && (
            <button
              className="btn-danger"
              onClick={() => dispatch({ type: "removeRoom", roomId })}
            >
              Remove
            </button>
          )}
        </div>,
      );
      pairs.forEach((pair, pi) => {
        elements.push(
          <div key={`${roomId}-row-${segIdx}-${pi}`} className="item-row">
            {pair.map((item, ci) =>
              item ? (
                <ItemCard
                  key={item.id}
                  projectId={activeIdRef.current}
                  item={item}
                  num={roomItemNums[item.id]}
                  onDescChange={(v) =>
                    dispatch({
                      type: "updateItem",
                      id: item.id,
                      field: "description",
                      value: v,
                    })
                  }
                  onPhoto={(url, pos) =>
                    dispatch({
                      type: "setPhoto",
                      id: item.id,
                      dataUrl: url,
                      position: pos,
                    })
                  }
                  onRemove={() =>
                    dispatch({
                      type: "removeRoomItem",
                      roomId,
                      itemId: item.id,
                    })
                  }
                  onPositionChange={(pos) => handlePositionChange(item.id, pos)}
                />
              ) : (
                <div key={ci} className="item-card empty" />
              ),
            )}
          </div>,
        );
      });
      if (showAddItem) {
        elements.push(
          <button
            key={`add-${roomId}`}
            className="add-item-cell"
            onClick={() => dispatch({ type: "addRoomItem", roomId })}
          >
            ＋ Add item
          </button>,
        );
      }
      return elements;
    }

    if (seg.type === "singleRoomPair") {
      const renderHalf = (entry, side) => {
        if (!entry)
          return (
            <div key={`empty-${side}`} className="single-room-half empty" />
          );
        const { roomId, roomName, item, cont: entryCont } = entry;
        const isFirst = firstRoomSeg[roomId] === seg;
        return (
          <div key={`${roomId}-${side}`} className="single-room-half">
            <div className="room-header-row">
              <input
                className="room-name-input"
                value={entryCont ? `${roomName}  (cont'd)` : roomName}
                readOnly={entryCont}
                onChange={(e) =>
                  !entryCont &&
                  dispatch({
                    type: "setRoomName",
                    roomId,
                    name: e.target.value,
                  })
                }
                placeholder="Room name…"
              />
              {isFirst && (
                <button
                  className="btn-danger"
                  onClick={() => dispatch({ type: "removeRoom", roomId })}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="item-card" style={{ flex: 1 }}>
              <div className="item-text">
                <div className="item-num">
                  Item #{String(roomItemNums[item.id]).padStart(2, "0")}
                </div>
                <div className="item-label">Description:</div>
                <textarea
                  className="item-desc-edit"
                  value={item.description}
                  onChange={(e) =>
                    dispatch({
                      type: "updateItem",
                      id: item.id,
                      field: "description",
                      value: e.target.value,
                    })
                  }
                  placeholder="Click here to enter description"
                  rows={4}
                />
                <button
                  className="item-remove"
                  onClick={() =>
                    dispatch({
                      type: "removeRoomItem",
                      roomId,
                      itemId: item.id,
                    })
                  }
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
              <PhotoCell
                projectId={activeIdRef.current}
                itemId={item.id}
                photo={item.photo}
                position={item.photoPosition}
                onPhoto={(url, pos) =>
                  dispatch({
                    type: "setPhoto",
                    id: item.id,
                    dataUrl: url,
                    position: pos,
                  })
                }
                onRemove={() =>
                  dispatch({
                    type: "setPhoto",
                    id: item.id,
                    dataUrl: null,
                    position: null,
                  })
                }
                onPositionChange={(pos) => handlePositionChange(item.id, pos)}
              />
            </div>
            <button
              className="add-item-cell"
              onClick={() => dispatch({ type: "addRoomItem", roomId })}
            >
              ＋ Add item
            </button>
          </div>
        );
      };
      return [
        <div key={`srp-${segIdx}`} className="single-room-pair">
          {renderHalf(seg.left, "left")}
          {renderHalf(seg.right, "right")}
        </div>,
      ];
    }

    return [];
  };

  // ── Render ──

  return (
    <div className={`app${sidebarOpen ? " app--sidebar-open" : ""}`}>
      <ProjectSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        projects={projects}
        activeId={activeId}
        onOpen={switchToProject}
        onNew={handleNewProject}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteProject}
      />

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">
            {data.project} — {data.title} — {data.date}
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
                if (activeIdRef.current) idbClearAll(activeIdRef.current).catch(() => {});
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
              Format your notes as a bulleted outline — room name and number as
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
                it, then paste the chatbot's cleaned bullet list here.
              </p>
              <button className="copy-prompt-btn" onClick={handleCopyPrompt}>
                Copy prompt
                {promptCopyStatus ? ` ${promptCopyStatus}` : " ↓"}
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
            (s) => s.type === "header" || s.type === "siteConditions",
          );
          const contentSegs = pageSegs.filter(
            (s) => s.type !== "header" && s.type !== "siteConditions",
          );

          return (
            <div key={pageIdx} className="page">
              {/* Document header — all fields editable */}
              <div className="doc-header">
                <div className="doc-header-left">
                  <input
                    className="doc-header-project"
                    value={data.project}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "project",
                        value: e.target.value,
                      })
                    }
                  />
                  <input
                    className="doc-header-projnum"
                    value={data.projectNum}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "projectNum",
                        value: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="doc-header-center">
                  <input
                    className="doc-header-title"
                    value={data.title}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "title",
                        value: e.target.value,
                      })
                    }
                  />
                  <input
                    className="doc-header-date"
                    value={data.date}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "date",
                        value: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="doc-header-right">
                  <input
                    className="doc-header-firm"
                    value={data.firm ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "firm",
                        value: e.target.value,
                      })
                    }
                  />
                  <div className="doc-header-page">
                    page {pageIdx + 1} of {pages.length}
                  </div>
                </div>
              </div>
              <hr className="doc-header-rule" />

              {/* Site conditions — page 1 only */}
              {headerSegs.some((s) => s.type === "siteConditions") && (
                <div>
                  <div className="section-label-row">
                    <div className="section-label">Site Conditions</div>
                    <input
                      className="site-input site-date-input"
                      value={data.punchlistDate ?? ""}
                      onChange={(e) =>
                        dispatch({
                          type: "setField",
                          field: "punchlistDate",
                          value: e.target.value,
                        })
                      }
                      placeholder="Punchlist date and time…"
                    />
                  </div>
                  <ul className="site-list">
                    {data.siteConditions.map((s, i) => (
                      <li key={i} className="site-item">
                        <span className="site-bullet">–</span>
                        <input
                          className="site-input"
                          value={s}
                          onChange={(e) =>
                            dispatch({
                              type: "setSiteCondition",
                              index: i,
                              value: e.target.value,
                            })
                          }
                          placeholder="Add condition…"
                        />
                        <button
                          className="site-remove"
                          onClick={() =>
                            dispatch({ type: "removeSiteCondition", index: i })
                          }
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="add-inline"
                    onClick={() => dispatch({ type: "addSiteCondition" })}
                  >
                    ＋ Add condition
                  </button>
                </div>
              )}

              {/* Content area — item-rows are direct flex children for equal height */}
              <div className="page-content">
                {contentSegs.flatMap((seg, segIdx) =>
                  renderSeg(seg, segIdx, contentSegs),
                )}
                {pageIdx === pages.length - 1 && (
                  <button
                    className="add-room-btn"
                    onClick={() => dispatch({ type: "addRoom" })}
                  >
                    ＋ Add room
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
