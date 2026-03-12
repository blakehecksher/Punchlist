import { useReducer, useRef, useEffect, useCallback } from "react";
import { idbGetAllPhotos, idbSetPhoto } from "./idb.js";
import { paginate } from "./pagination.js";
import ItemCard from "./ItemCard.jsx";
import PhotoCell from "./PhotoCell.jsx";
import "./styles.css";

// ── Constants ──

const STORAGE_KEY = "jbma_punchlist_925park";
const uid = () => Math.random().toString(36).slice(2, 9);

// ── Initial data ──

const INITIAL_DATA = {
  project: "925 Park Ave. Apt 3-4A",
  projectNum: "Proj. # 2402",
  title: "Punchlist",
  date: "March 11, 2026",
  siteConditions: [
    "Carpet installation ongoing — 4th floor",
    "Painting ongoing — 3rd floor",
    "Kitchen installation ongoing",
    "Decorative painting ongoing",
  ],
  generalNotes: [
    { id: "gn1", description: "Hinge screws to be slotted and oriented vertically", photo: null, photoPosition: null },
    { id: "gn2", description: "Paint all paintable grilles in returns — bookcases and walls", photo: null, photoPosition: null },
    { id: "gn3", description: "Grilles to have slotted screws in matching finish", photo: null, photoPosition: null },
    { id: "gn4", description: "Install all hardware", photo: null, photoPosition: null },
    { id: "gn5", description: "Install lenses for all recessed light fixtures", photo: null, photoPosition: null },
    { id: "gn6", description: "Touch up paint at window sills", photo: null, photoPosition: null },
    { id: "gn7", description: "Install child guards at all windows", photo: null, photoPosition: null },
    { id: "gn8", description: "Adjust millwork for consistent gaps throughout", photo: null, photoPosition: null },
    { id: "gn9", description: "Install all electrical, security, and A/V devices and faceplates", photo: null, photoPosition: null },
  ],
  rooms: [
    { id: "r300", name: "300  Stair Hall", items: [
      { id: "r300_1", description: "Touch up connection at first step and opening to Living Room", photo: null, photoPosition: null },
      { id: "r300_2", description: "Stair baluster finish to be continuous — finish currently changes at connection to handrail", photo: null, photoPosition: null },
      { id: "r300_3", description: "Install closet rod at Stair Hall closet", photo: null, photoPosition: null },
    ]},
    { id: "r305", name: "305  Kitchen", items: [
      { id: "r305_1", description: "Install painted wood grille above microwave and below gas meter", photo: null, photoPosition: null },
    ]},
    { id: "r307", name: "307  Pantry", items: [
      { id: "r307_1", description: "Paint metal grille", photo: null, photoPosition: null },
    ]},
    { id: "r400", name: "400  Stair Hall", items: [
      { id: "r400_1", description: "Entry door hardware to be Antique Brass", photo: null, photoPosition: null },
    ]},
    { id: "r402", name: "402  Primary Bedroom", items: [
      { id: "r402_1", description: "Clean fireplace surround", photo: null, photoPosition: null },
      { id: "r402_2", description: "Clean inside of firebox", photo: null, photoPosition: null },
    ]},
    { id: "r403", name: "403  Her Dressing", items: [
      { id: "r403_1", description: "Install grommets at glass shelves to match existing", photo: null, photoPosition: null },
    ]},
    { id: "r405", name: "405  Primary Bath", items: [
      { id: "r405_1", description: "Install tub fixture", photo: null, photoPosition: null },
      { id: "r405_2", description: "Install shower door", photo: null, photoPosition: null },
      { id: "r405_3", description: "Touch up paint at joint between wood base top and vanity", photo: null, photoPosition: null },
    ]},
    { id: "r406", name: "406  Hall", items: [
      { id: "r406_1", description: "Install door hardware at closet doors — no touch latch", photo: null, photoPosition: null },
      { id: "r406_2", description: "Paint exposed pipe in security closet to match", photo: null, photoPosition: null },
      { id: "r406_3", description: "Adjust doors for consistent gap throughout", photo: null, photoPosition: null },
    ]},
    { id: "r407", name: "407  Family Room", items: [
      { id: "r407_1", description: "Repair cracks at cornice and ceiling", photo: null, photoPosition: null },
      { id: "r407_2", description: "Paint linear grilles", photo: null, photoPosition: null },
    ]},
    { id: "r408", name: "408  Her Study", items: [
      { id: "r408_1", description: "Repair cracks in cornice at SW corner", photo: null, photoPosition: null },
      { id: "r408_2", description: "Touch up paint above pocket door and at cornice", photo: null, photoPosition: null },
    ]},
    { id: "r409", name: "409  Laundry", items: [
      { id: "r409_1", description: "Align outlets on north and west walls vertically", photo: null, photoPosition: null },
      { id: "r409_2", description: "Replace screws to match clothes rod finish (polished nickel)", photo: null, photoPosition: null },
      { id: "r409_3", description: "Install missing access panel in closet ceiling", photo: null, photoPosition: null },
      { id: "r409_4", description: "Closet door handle — screws protruding, to be flush", photo: null, photoPosition: null },
      { id: "r409_5", description: "Fill visible gap/hole at heat detector", photo: null, photoPosition: null },
      { id: "r409_6", description: "Raise shelf to top grommet location", photo: null, photoPosition: null },
      { id: "r409_7", description: "Adjust tension on touch latch for hookups — currently too tight", photo: null, photoPosition: null },
      { id: "r409_8", description: "Clean paint overspray and debris from air inlet slot at radiator", photo: null, photoPosition: null },
    ]},
    { id: "r410", name: "410  Study", items: [
      { id: "r410_1", description: "Paint metal wall grille — left side unpainted", photo: null, photoPosition: null },
      { id: "r410_2", description: "Install smoke/CO detector", photo: null, photoPosition: null },
      { id: "r410_3", description: "Install sound attenuation blankets at CU enclosure", photo: null, photoPosition: null },
      { id: "r410_4", description: "Install lenses in recessed light fixtures", photo: null, photoPosition: null },
      { id: "r410_5", description: "Install window guards", photo: null, photoPosition: null },
      { id: "r410_6", description: "Paint linear grille above door", photo: null, photoPosition: null },
      { id: "r410_7", description: "Install faceplates at all electrical fixtures", photo: null, photoPosition: null },
      { id: "r410_8", description: "Drop shelves: 1st down 1 pin, 2nd down 1 pin, 3rd down 2 pins", photo: null, photoPosition: null },
    ]},
    { id: "r411", name: "411  Study Bath", items: [
      { id: "r411_1", description: "Handshower and volume control installed incorrectly — refer to drawings and Gus's Bath for correct configuration", photo: null, photoPosition: null },
      { id: "r411_2", description: "Install glass door at window", photo: null, photoPosition: null },
      { id: "r411_3", description: "Medicine cabinet cornice requires retouching", photo: null, photoPosition: null },
      { id: "r411_4", description: "Tighten light fixture above medicine cabinet", photo: null, photoPosition: null },
      { id: "r411_5", description: "Touch up wall marks adjacent to light above medicine cabinet", photo: null, photoPosition: null },
    ]},
    { id: "r413", name: "413  Georgina's Bedroom", items: [
      { id: "r413_1", description: "Paint metal grille return", photo: null, photoPosition: null },
    ]},
    { id: "r414", name: "414  Georgina's Bath", items: [
      { id: "r414_1", description: "Metal grille to have slotted screws in matching finish", photo: null, photoPosition: null },
      { id: "r414_2", description: "Clean handshower face", photo: null, photoPosition: null },
    ]},
    { id: "r418", name: "418  Henrietta's Bedroom", items: [
      { id: "r418_1", description: "Desk pencil drawer — remove extension on right side, leave 1/8\" gap", photo: null, photoPosition: null },
      { id: "r418_2", description: "Adjust radiator panel for consistent gap", photo: null, photoPosition: null },
    ]},
  ]
};

// ── Helpers ──

const stripPhotos = (data) => ({
  ...data,
  generalNotes: data.generalNotes.map(i => ({ ...i, photo: null, photoPosition: null })),
  rooms: data.rooms.map(r => ({
    ...r,
    items: r.items.map(i => ({ ...i, photo: null, photoPosition: null })),
  })),
});

function mapItem(data, id, fn) {
  // Update a single item by id across generalNotes and rooms
  const inGN = data.generalNotes.some(i => i.id === id);
  if (inGN) {
    return { ...data, generalNotes: data.generalNotes.map(i => i.id === id ? fn(i) : i) };
  }
  return {
    ...data,
    rooms: data.rooms.map(r => ({
      ...r,
      items: r.items.map(i => i.id === id ? fn(i) : i),
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
      return { ...state, siteConditions: state.siteConditions.filter((_, i) => i !== action.index) };
    case "addSiteCondition":
      return { ...state, siteConditions: [...state.siteConditions, ""] };

    case "updateItem":
      return mapItem(state, action.id, i => ({ ...i, [action.field]: action.value }));

    case "setPhoto":
      return mapItem(state, action.id, i => ({
        ...i,
        photo: action.dataUrl,
        photoPosition: action.position,
      }));

    case "setPhotoPosition":
      return mapItem(state, action.id, i => ({ ...i, photoPosition: action.position }));

    case "addGeneralNote":
      return { ...state, generalNotes: [...state.generalNotes, { id: uid(), description: "", photo: null, photoPosition: null }] };
    case "removeGeneralNote":
      return { ...state, generalNotes: state.generalNotes.filter(i => i.id !== action.id) };

    case "addRoomItem":
      return {
        ...state,
        rooms: state.rooms.map(r => r.id !== action.roomId ? r : {
          ...r, items: [...r.items, { id: uid(), description: "", photo: null, photoPosition: null }],
        }),
      };
    case "removeRoomItem":
      return {
        ...state,
        rooms: state.rooms.map(r => r.id !== action.roomId ? r : {
          ...r, items: r.items.filter(i => i.id !== action.itemId),
        }),
      };

    case "setRoomName":
      return { ...state, rooms: state.rooms.map(r => r.id !== action.roomId ? r : { ...r, name: action.name }) };
    case "addRoom":
      return { ...state, rooms: [...state.rooms, { id: uid(), name: "Room Name", items: [{ id: uid(), description: "", photo: null, photoPosition: null }] }] };
    case "removeRoom":
      return { ...state, rooms: state.rooms.filter(r => r.id !== action.roomId) };

    default:
      return state;
  }
}

// ── App ──

export default function PunchListApp() {
  const [data, dispatch] = useReducer(reducer, INITIAL_DATA);
  const [saveStatus, setSaveStatus] = useReducer((_, v) => v, "");
  const saveTimer = useRef(null);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const photos = await idbGetAllPhotos();
          // photos[id] is now { dataUrl, position } (or a plain string for legacy data)
          const mergePhotos = (items) =>
            items.map(i => {
              const entry = photos[i.id];
              if (!entry) return { ...i, photo: null, photoPosition: null };
              // Handle legacy format (plain dataUrl string)
              if (typeof entry === "string") return { ...i, photo: entry, photoPosition: null };
              return { ...i, photo: entry.dataUrl, photoPosition: entry.position ?? null };
            });
          dispatch({
            type: "load",
            data: {
              ...parsed,
              generalNotes: mergePhotos(parsed.generalNotes || []),
              rooms: (parsed.rooms || []).map(r => ({ ...r, items: mergePhotos(r.items || []) })),
            },
          });
          setSaveStatus("Loaded");
          setTimeout(() => setSaveStatus(""), 1500);
        }
      } catch { /* corrupt storage — start fresh */ }
    })();
  }, []);

  // Debounced auto-save text to localStorage
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stripPhotos(data)));
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 1500);
      } catch { /* quota exceeded — photos are in IDB so text-only should be fine */ }
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  // Photo position changes persist to IDB (photo data is already there)
  const handlePositionChange = useCallback((itemId, position) => {
    dispatch({ type: "setPhotoPosition", id: itemId, position });
    // Re-save the full photo entry to IDB
    // We need the current photo dataUrl — find it in state
    const findPhoto = () => {
      for (const gn of data.generalNotes) if (gn.id === itemId) return gn.photo;
      for (const r of data.rooms) for (const it of r.items) if (it.id === itemId) return it.photo;
      return null;
    };
    const dataUrl = findPhoto();
    if (dataUrl) idbSetPhoto(itemId, { dataUrl, position }).catch(() => {});
  }, [data]);

  const pages = paginate(data);

  // Item numbering maps
  const gnItemNums = {};
  data.generalNotes.forEach((it, i) => { gnItemNums[it.id] = i + 1; });
  const roomItemNums = {};
  data.rooms.forEach(room => {
    room.items.forEach((it, i) => { roomItemNums[it.id] = i + 1; });
  });

  // Identify first/last segments per room for add/remove button placement
  const allSegs = pages.flatMap(pg => pg);
  const lastGnRowsSeg = [...allSegs].reverse().find(s => s.type === "gnRows") ?? null;
  const lastRoomSeg = {};
  const firstRoomSeg = {};
  allSegs.forEach(seg => {
    if (seg.type === "roomRows") {
      lastRoomSeg[seg.roomId] = seg;
      if (!firstRoomSeg[seg.roomId]) firstRoomSeg[seg.roomId] = seg;
    }
    if (seg.type === "singleRoomPair") {
      [seg.left, seg.right].forEach(entry => {
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
      const isHalfWidth = nextSeg?.type === "gnRows" &&
        nextSeg.pairs.length === 1 && nextSeg.pairs[0][1] === null;
      return [
        <div key={`gnHeader-${segIdx}`} className="general-notes-header"
          style={isHalfWidth ? { width: "50%" } : undefined}>
          General Notes{seg.cont ? "  (cont'd)" : ""}
        </div>
      ];
    }

    if (seg.type === "gnRows") {
      const showAdd = seg === lastGnRowsSeg;
      const elements = seg.pairs.map((pair, pi) => (
        <div key={`gn-row-${segIdx}-${pi}`} className="item-row">
          {pair.map((item, ci) => item ? (
            <ItemCard key={item.id} item={item} num={gnItemNums[item.id]}
              onDescChange={v => dispatch({ type: "updateItem", id: item.id, field: "description", value: v })}
              onPhoto={(url, pos) => dispatch({ type: "setPhoto", id: item.id, dataUrl: url, position: pos })}
              onRemove={() => dispatch({ type: "removeGeneralNote", id: item.id })}
              onPositionChange={pos => handlePositionChange(item.id, pos)}
            />
          ) : <div key={ci} className="item-card empty" />)}
        </div>
      ));
      if (showAdd) {
        elements.push(
          <button key="add-gn" className="add-item-cell" onClick={() => dispatch({ type: "addGeneralNote" })}>＋ Add note</button>
        );
      }
      return elements;
    }

    if (seg.type === "byRoomLabel") {
      return [<div key="byRoomLabel" className="section-label" style={{ marginTop: 8, marginBottom: 4 }}>By Room</div>];
    }

    if (seg.type === "roomRows") {
      const { roomId, roomName, cont, pairs } = seg;
      const showAddItem = seg === lastRoomSeg[roomId];
      const showRemove = seg === firstRoomSeg[roomId];
      const isHalfWidth = pairs.length === 1 && pairs[0][1] === null;

      const elements = [];
      elements.push(
        <div key={`${roomId}-hdr-${segIdx}`} className="room-header-row"
          style={isHalfWidth ? { width: "50%" } : undefined}>
          <input className="room-name-input"
            value={cont ? `${roomName}  (cont'd)` : roomName}
            readOnly={cont}
            onChange={e => !cont && dispatch({ type: "setRoomName", roomId, name: e.target.value })}
            placeholder="Room name…" />
          {showRemove && (
            <button className="btn-danger" onClick={() => dispatch({ type: "removeRoom", roomId })}>Remove</button>
          )}
        </div>
      );
      pairs.forEach((pair, pi) => {
        elements.push(
          <div key={`${roomId}-row-${segIdx}-${pi}`} className="item-row">
            {pair.map((item, ci) => item ? (
              <ItemCard key={item.id} item={item} num={roomItemNums[item.id]}
                onDescChange={v => dispatch({ type: "updateItem", id: item.id, field: "description", value: v })}
                onPhoto={(url, pos) => dispatch({ type: "setPhoto", id: item.id, dataUrl: url, position: pos })}
                onRemove={() => dispatch({ type: "removeRoomItem", roomId, itemId: item.id })}
                onPositionChange={pos => handlePositionChange(item.id, pos)}
              />
            ) : <div key={ci} className="item-card empty" />)}
          </div>
        );
      });
      if (showAddItem) {
        elements.push(
          <button key={`add-${roomId}`} className="add-item-cell" onClick={() => dispatch({ type: "addRoomItem", roomId })}>＋ Add item</button>
        );
      }
      return elements;
    }

    if (seg.type === "singleRoomPair") {
      const renderHalf = (entry, side) => {
        if (!entry) return <div key={`empty-${side}`} className="single-room-half empty" />;
        const { roomId, roomName, item, cont: entryCont } = entry;
        const isFirst = firstRoomSeg[roomId] === seg;
        return (
          <div key={`${roomId}-${side}`} className="single-room-half">
            <div className="room-header-row">
              <input className="room-name-input"
                value={entryCont ? `${roomName}  (cont'd)` : roomName}
                readOnly={entryCont}
                onChange={e => !entryCont && dispatch({ type: "setRoomName", roomId, name: e.target.value })}
                placeholder="Room name…" />
              {isFirst && (
                <button className="btn-danger" onClick={() => dispatch({ type: "removeRoom", roomId })}>Remove</button>
              )}
            </div>
            <div className="item-card" style={{ flex: 1 }}>
              <div className="item-text">
                <div className="item-num">Item #{String(roomItemNums[item.id]).padStart(2, "0")}</div>
                <div className="item-label">Description:</div>
                <textarea className="item-desc-edit" value={item.description}
                  onChange={e => dispatch({ type: "updateItem", id: item.id, field: "description", value: e.target.value })} rows={4} />
                <button className="item-remove" onClick={() => dispatch({ type: "removeRoomItem", roomId, itemId: item.id })} title="Remove item">✕</button>
              </div>
              <PhotoCell
                itemId={item.id}
                photo={item.photo}
                position={item.photoPosition}
                onPhoto={(url, pos) => dispatch({ type: "setPhoto", id: item.id, dataUrl: url, position: pos })}
                onRemove={() => dispatch({ type: "setPhoto", id: item.id, dataUrl: null, position: null })}
                onPositionChange={pos => handlePositionChange(item.id, pos)}
              />
            </div>
            <button className="add-item-cell" onClick={() => dispatch({ type: "addRoomItem", roomId })}>＋ Add item</button>
          </div>
        );
      };
      return [
        <div key={`srp-${segIdx}`} className="single-room-pair">
          {renderHalf(seg.left, "left")}
          {renderHalf(seg.right, "right")}
        </div>
      ];
    }

    return [];
  };

  // ── Render ──

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-brand">JBMA</span>
          <span className="toolbar-title">{data.project} — {data.title} — {data.date}</span>
        </div>
        <div className="toolbar-right">
          {saveStatus && <span className="save-status">{saveStatus}</span>}
          <button className="btn btn-print" onClick={() => window.print()}>⎙  Print / PDF</button>
        </div>
      </div>

      <div className="pages">
        {pages.map((pageSegs, pageIdx) => {
          const headerSegs = pageSegs.filter(s => s.type === "header" || s.type === "siteConditions");
          const contentSegs = pageSegs.filter(s => s.type !== "header" && s.type !== "siteConditions");

          return (
            <div key={pageIdx} className="page">
              {/* Document header — all fields editable */}
              <div className="doc-header">
                <div className="doc-header-left">
                  <input className="doc-header-project" value={data.project}
                    onChange={e => dispatch({ type: "setField", field: "project", value: e.target.value })} />
                  <input className="doc-header-projnum" value={data.projectNum}
                    onChange={e => dispatch({ type: "setField", field: "projectNum", value: e.target.value })} />
                </div>
                <div className="doc-header-center">
                  <input className="doc-header-title" value={data.title}
                    onChange={e => dispatch({ type: "setField", field: "title", value: e.target.value })} />
                </div>
                <div className="doc-header-right">
                  <input className="doc-header-date" value={data.date}
                    onChange={e => dispatch({ type: "setField", field: "date", value: e.target.value })} />
                </div>
              </div>
              <hr className="doc-header-rule" />

              {/* Site conditions — page 1 only */}
              {headerSegs.some(s => s.type === "siteConditions") && (
                <div>
                  <div className="section-label">Site Conditions</div>
                  <ul className="site-list">
                    {data.siteConditions.map((s, i) => (
                      <li key={i} className="site-item">
                        <span className="site-bullet">–</span>
                        <input className="site-input" value={s}
                          onChange={e => dispatch({ type: "setSiteCondition", index: i, value: e.target.value })}
                          placeholder="Add condition…" />
                        <button className="site-remove" onClick={() => dispatch({ type: "removeSiteCondition", index: i })}>✕</button>
                      </li>
                    ))}
                  </ul>
                  <button className="add-inline" onClick={() => dispatch({ type: "addSiteCondition" })}>＋ Add condition</button>
                </div>
              )}

              {/* Content area — item-rows are direct flex children for equal height */}
              <div className="page-content">
                {contentSegs.flatMap((seg, segIdx) => renderSeg(seg, segIdx, contentSegs))}
                {pageIdx === pages.length - 1 && (
                  <button className="add-room-btn" onClick={() => dispatch({ type: "addRoom" })}>＋ Add room</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
