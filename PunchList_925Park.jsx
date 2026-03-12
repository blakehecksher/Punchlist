import { useState, useRef, useCallback, useEffect } from "react";

const STORAGE_KEY = "jbma_punchlist_925park";

const INITIAL_DATA = {
  project: "925 Park Ave. Apt 3-4A",
  projectNum: "Proj. # 2402",
  date: "March 11, 2026",
  siteConditions: [
    "Carpet installation ongoing — 4th floor",
    "Painting ongoing — 3rd floor",
    "Kitchen installation ongoing",
    "Decorative painting ongoing",
  ],
  generalNotes: [
    { id: "gn1", description: "Hinge screws to be slotted and oriented vertically", photo: null },
    { id: "gn2", description: "Paint all paintable grilles in returns — bookcases and walls", photo: null },
    { id: "gn3", description: "Grilles to have slotted screws in matching finish", photo: null },
    { id: "gn4", description: "Install all hardware", photo: null },
    { id: "gn5", description: "Install lenses for all recessed light fixtures", photo: null },
    { id: "gn6", description: "Touch up paint at window sills", photo: null },
    { id: "gn7", description: "Install child guards at all windows", photo: null },
    { id: "gn8", description: "Adjust millwork for consistent gaps throughout", photo: null },
    { id: "gn9", description: "Install all electrical, security, and A/V devices and faceplates", photo: null },
  ],
  rooms: [
    { id: "r300", name: "300  Stair Hall", items: [
      { id: "r300_1", description: "Touch up connection at first step and opening to Living Room", photo: null },
      { id: "r300_2", description: "Stair baluster finish to be continuous — finish currently changes at connection to handrail", photo: null },
      { id: "r300_3", description: "Install closet rod at Stair Hall closet", photo: null },
    ]},
    { id: "r305", name: "305  Kitchen", items: [
      { id: "r305_1", description: "Install painted wood grille above microwave and below gas meter", photo: null },
    ]},
    { id: "r307", name: "307  Pantry", items: [
      { id: "r307_1", description: "Paint metal grille", photo: null },
    ]},
    { id: "r400", name: "400  Stair Hall", items: [
      { id: "r400_1", description: "Entry door hardware to be Antique Brass", photo: null },
    ]},
    { id: "r402", name: "402  Primary Bedroom", items: [
      { id: "r402_1", description: "Clean fireplace surround", photo: null },
      { id: "r402_2", description: "Clean inside of firebox", photo: null },
    ]},
    { id: "r403", name: "403  Her Dressing", items: [
      { id: "r403_1", description: "Install grommets at glass shelves to match existing", photo: null },
    ]},
    { id: "r405", name: "405  Primary Bath", items: [
      { id: "r405_1", description: "Install tub fixture", photo: null },
      { id: "r405_2", description: "Install shower door", photo: null },
      { id: "r405_3", description: "Touch up paint at joint between wood base top and vanity", photo: null },
    ]},
    { id: "r406", name: "406  Hall", items: [
      { id: "r406_1", description: "Install door hardware at closet doors — no touch latch", photo: null },
      { id: "r406_2", description: "Paint exposed pipe in security closet to match", photo: null },
      { id: "r406_3", description: "Adjust doors for consistent gap throughout", photo: null },
    ]},
    { id: "r407", name: "407  Family Room", items: [
      { id: "r407_1", description: "Repair cracks at cornice and ceiling", photo: null },
      { id: "r407_2", description: "Paint linear grilles", photo: null },
    ]},
    { id: "r408", name: "408  Her Study", items: [
      { id: "r408_1", description: "Repair cracks in cornice at SW corner", photo: null },
      { id: "r408_2", description: "Touch up paint above pocket door and at cornice", photo: null },
    ]},
    { id: "r409", name: "409  Laundry", items: [
      { id: "r409_1", description: "Align outlets on north and west walls vertically", photo: null },
      { id: "r409_2", description: "Replace screws to match clothes rod finish (polished nickel)", photo: null },
      { id: "r409_3", description: "Install missing access panel in closet ceiling", photo: null },
      { id: "r409_4", description: "Closet door handle — screws protruding, to be flush", photo: null },
      { id: "r409_5", description: "Fill visible gap/hole at heat detector", photo: null },
      { id: "r409_6", description: "Raise shelf to top grommet location", photo: null },
      { id: "r409_7", description: "Adjust tension on touch latch for hookups — currently too tight", photo: null },
      { id: "r409_8", description: "Clean paint overspray and debris from air inlet slot at radiator", photo: null },
    ]},
    { id: "r410", name: "410  Study", items: [
      { id: "r410_1", description: "Paint metal wall grille — left side unpainted", photo: null },
      { id: "r410_2", description: "Install smoke/CO detector", photo: null },
      { id: "r410_3", description: "Install sound attenuation blankets at CU enclosure", photo: null },
      { id: "r410_4", description: "Install lenses in recessed light fixtures", photo: null },
      { id: "r410_5", description: "Install window guards", photo: null },
      { id: "r410_6", description: "Paint linear grille above door", photo: null },
      { id: "r410_7", description: "Install faceplates at all electrical fixtures", photo: null },
      { id: "r410_8", description: "Drop shelves: 1st down 1 pin, 2nd down 1 pin, 3rd down 2 pins", photo: null },
    ]},
    { id: "r411", name: "411  Study Bath", items: [
      { id: "r411_1", description: "Handshower and volume control installed incorrectly — refer to drawings and Gus's Bath for correct configuration", photo: null },
      { id: "r411_2", description: "Install glass door at window", photo: null },
      { id: "r411_3", description: "Medicine cabinet cornice requires retouching", photo: null },
      { id: "r411_4", description: "Tighten light fixture above medicine cabinet", photo: null },
      { id: "r411_5", description: "Touch up wall marks adjacent to light above medicine cabinet", photo: null },
    ]},
    { id: "r413", name: "413  Georgina's Bedroom", items: [
      { id: "r413_1", description: "Paint metal grille return", photo: null },
    ]},
    { id: "r414", name: "414  Georgina's Bath", items: [
      { id: "r414_1", description: "Metal grille to have slotted screws in matching finish", photo: null },
      { id: "r414_2", description: "Clean handshower face", photo: null },
    ]},
    { id: "r418", name: "418  Henrietta's Bedroom", items: [
      { id: "r418_1", description: "Desk pencil drawer — remove extension on right side, leave 1/8\" gap", photo: null },
      { id: "r418_2", description: "Adjust radiator panel for consistent gap", photo: null },
    ]},
  ]
};

const uid = () => Math.random().toString(36).slice(2, 9);

const stripPhotos = (data) => ({
  ...data,
  generalNotes: data.generalNotes.map(i => ({ ...i, photo: null })),
  rooms: data.rooms.map(r => ({ ...r, items: r.items.map(i => ({ ...i, photo: null })) })),
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Lato:wght@300;400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Lato', sans-serif; background: #f4f1ee; }
  .app { min-height: 100vh; }

  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: #1a1a1a; color: white;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 52px;
  }
  .toolbar-left { display: flex; align-items: center; gap: 16px; }
  .toolbar-brand { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #923B08; font-weight: 700; }
  .toolbar-title { font-size: 13px; color: #ccc; font-weight: 300; }
  .toolbar-right { display: flex; gap: 10px; align-items: center; }
  .save-status { font-size: 11px; color: #666; font-style: italic; }

  .btn {
    padding: 6px 16px; border: none; border-radius: 3px; cursor: pointer;
    font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.85; }
  .btn-print { background: #923B08; color: white; }
  .btn-danger { background: transparent; color: #c0392b; border: 1px solid #c0392b; font-size: 10px; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-family: 'Lato', sans-serif; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .btn-danger:hover { background: #c0392b; color: white; }

  .pages { padding: 72px 24px 60px; display: flex; flex-direction: column; align-items: center; }

  .page {
    background: white; width: 11in;
    padding: 0.5in 0.55in;
    margin-bottom: 24px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.13);
  }

  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
  .doc-header-left { font-family: 'EB Garamond', serif; }
  .doc-header-project { font-size: 13px; color: #1a1a1a; line-height: 1.4; }
  .doc-header-projnum { font-size: 12px; color: #777; line-height: 1.4; }
  .doc-header-date { font-family: 'EB Garamond', serif; font-size: 13px; color: #1a1a1a; }
  .doc-header-rule { border: none; border-top: 1px solid #ddd; margin: 6px 0 10px; }

  .section-label {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #923B08; font-weight: 700; margin-bottom: 6px; margin-top: 14px;
  }

  /* Site conditions */
  .site-list { list-style: none; margin-bottom: 2px; }
  .site-item { display: flex; align-items: center; gap: 4px; padding: 1px 0; }
  .site-bullet { color: #923B08; flex-shrink: 0; font-size: 12px; line-height: 1; }
  .site-input {
    border: none; outline: none; background: transparent;
    font-family: 'Lato', sans-serif; font-size: 11px; color: #333;
    width: 100%; line-height: 1.5; padding: 1px 3px; border-radius: 2px;
  }
  .site-input:focus { background: #fafaf8; }
  .site-remove {
    background: none; border: none; cursor: pointer; color: transparent;
    font-size: 12px; padding: 0 2px; flex-shrink: 0; line-height: 1;
    transition: color 0.15s;
  }
  .site-item:hover .site-remove { color: #ccc; }
  .site-remove:hover { color: #c0392b !important; }

  .add-inline {
    display: inline-flex; align-items: center; gap: 4px; margin-top: 3px;
    background: none; border: none; cursor: pointer;
    color: #923B08; font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 0;
    font-family: 'Lato', sans-serif;
  }
  .add-inline:hover { opacity: 0.7; }

  /* Room */
  .room-block { margin-bottom: 2px; }
  .room-header-row {
    display: flex; align-items: center; justify-content: space-between;
    background: #923B08; padding: 5px 8px 5px 10px;
  }
  .room-name-input {
    font-family: 'EB Garamond', serif; font-size: 14px; font-weight: 500;
    color: white; background: transparent; border: none; outline: none;
    letter-spacing: 0.02em; flex: 1;
  }
  .room-name-input::placeholder { color: rgba(255,255,255,0.45); }

  /* Grid */
  .items-grid { display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #ccc; border-top: 1px solid #ccc; }
  .item-card { display: grid; grid-template-columns: 1fr 1fr; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; min-height: 160px; }
  .item-text { padding: 8px 10px; border-right: 1px solid #ccc; display: flex; flex-direction: column; gap: 4px; position: relative; }
  .item-num { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: #923B08; text-transform: uppercase; }
  .item-label { font-size: 9px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.06em; }
  .item-desc-edit {
    font-family: 'EB Garamond', serif; font-size: 12px; color: #1a1a1a; line-height: 1.45;
    border: none; outline: none; resize: none; width: 100%; flex: 1; background: transparent; min-height: 60px;
  }
  .item-desc-edit:focus { background: #fafaf8; }
  .item-remove {
    position: absolute; top: 5px; right: 5px; background: none; border: none;
    cursor: pointer; color: transparent; font-size: 12px; line-height: 1; padding: 2px;
    transition: color 0.15s;
  }
  .item-text:hover .item-remove { color: #ccc; }
  .item-remove:hover { color: #c0392b !important; }

  .add-item-cell {
    grid-column: 1 / -1; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;
    display: flex; align-items: center; justify-content: center; padding: 7px;
    background: none; cursor: pointer; color: #923B08;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    font-family: 'Lato', sans-serif; border-top: none; gap: 5px;
    transition: background 0.12s;
  }
  .add-item-cell:hover { background: #fdf5f2; }

  .add-room-btn {
    width: 100%; padding: 9px; margin-top: 2px; border: 1px dashed #ccc;
    background: none; cursor: pointer; color: #923B08;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    font-family: 'Lato', sans-serif; border-radius: 2px; display: flex;
    align-items: center; justify-content: center; gap: 6px;
    transition: background 0.12s, border-color 0.12s;
  }
  .add-room-btn:hover { background: #fdf5f2; border-color: #923B08; }

  .general-notes-header {
    background: #3a3a3a; color: white;
    font-family: 'EB Garamond', serif; font-size: 14px; font-weight: 500;
    padding: 5px 10px; margin-top: 14px; margin-bottom: 0;
  }

  /* Photo */
  .photo-cell {
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: #fafaf8; cursor: pointer; min-height: 160px; user-select: none;
  }
  .photo-cell.has-photo { background: #000; cursor: grab; }
  .photo-cell.has-photo:active { cursor: grabbing; }
  .photo-cell.drag-over { background: #f5ebe6; outline: 2px dashed #923B08; outline-offset: -4px; }
  .photo-drop-hint { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #bbb; pointer-events: none; }
  .photo-drop-hint svg { width: 24px; height: 24px; opacity: 0.35; }
  .photo-drop-hint span { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; }
  .photo-img { width: 100%; height: 100%; object-fit: cover; display: block; transform-origin: center center; pointer-events: none; }
  .photo-controls { position: absolute; top: 4px; right: 4px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
  .photo-cell:hover .photo-controls { opacity: 1; }
  .photo-btn {
    width: 24px; height: 24px; border-radius: 3px; background: rgba(0,0,0,0.6);
    border: none; cursor: pointer; color: white;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
  }
  .photo-btn:hover { background: rgba(0,0,0,0.88); }

  @media print {
    @page { size: landscape; margin: 0.4in 0.45in; }
    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .toolbar, .add-inline, .add-item-cell, .add-room-btn, .site-remove, .item-remove, .photo-controls, .btn-danger { display: none !important; }
    .pages { padding: 0 !important; }
    .page { width: 100% !important; margin: 0 !important; box-shadow: none !important; padding: 0 !important; }
    .item-desc-edit, .site-input, .room-name-input { background: transparent !important; }
    .photo-cell { cursor: default !important; }
    .photo-drop-hint { display: none !important; }
  }
`;

function PhotoCell({ photo, onPhoto, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const fileRef = useRef();
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => { onPhoto(e.target.result); setTransform({ scale: 1, x: 0, y: 0 }); };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) readFile(file);
  }, []);

  const handleWheel = (e) => {
    if (!photo) return;
    e.preventDefault();
    setTransform(t => ({ ...t, scale: Math.min(4, Math.max(0.5, t.scale - e.deltaY * 0.003)) }));
  };
  const handleMouseDown = (e) => {
    if (!photo) return;
    e.preventDefault();
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };
  const handleMouseUp = () => { dragging.current = false; };

  return (
    <div
      className={`photo-cell${photo ? " has-photo" : ""}${dragOver ? " drag-over" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !photo && fileRef.current.click()}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) readFile(e.target.files[0]); }} />
      {photo ? (
        <>
          <img src={photo} className="photo-img" draggable={false} alt=""
            style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }} />
          <div className="photo-controls">
            <button className="photo-btn" onClick={e => { e.stopPropagation(); setTransform(t => ({ ...t, scale: Math.min(4, t.scale + 0.25) })); }}>+</button>
            <button className="photo-btn" onClick={e => { e.stopPropagation(); setTransform(t => ({ ...t, scale: Math.max(0.5, t.scale - 0.25) })); }}>−</button>
            <button className="photo-btn" onClick={e => { e.stopPropagation(); setTransform({ scale: 1, x: 0, y: 0 }); }}>↺</button>
            <button className="photo-btn" onClick={e => { e.stopPropagation(); onRemove(); setTransform({ scale: 1, x: 0, y: 0 }); }}>✕</button>
          </div>
        </>
      ) : (
        <div className="photo-drop-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span>Drop photo</span>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, num, onDescChange, onPhoto, onRemove }) {
  return (
    <div className="item-card">
      <div className="item-text">
        <div className="item-num">Item #{String(num).padStart(2, "0")}</div>
        <div className="item-label">Description:</div>
        <textarea className="item-desc-edit" value={item.description}
          onChange={e => onDescChange(e.target.value)} rows={4} />
        <button className="item-remove" onClick={onRemove} title="Remove item">✕</button>
      </div>
      <PhotoCell photo={item.photo} onPhoto={onPhoto} onRemove={() => onPhoto(null)} />
    </div>
  );
}

function chunkPairs(arr) {
  const pairs = [];
  for (let i = 0; i < arr.length; i += 2) pairs.push([arr[i], arr[i + 1] || null]);
  return pairs;
}

export default function PunchListApp() {
  const [data, setData] = useState(INITIAL_DATA);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimer = useRef(null);

  // Load from persistent storage on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          setData(JSON.parse(result.value));
          setSaveStatus("Loaded");
          setTimeout(() => setSaveStatus(""), 1500);
        }
      } catch {}
    })();
  }, []);

  // Debounced auto-save (strip photos — base64 too large)
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(stripPhotos(data)));
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 1500);
      } catch {}
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  const updateSiteCondition = (i, val) =>
    setData(d => { const sc = [...d.siteConditions]; sc[i] = val; return { ...d, siteConditions: sc }; });
  const removeSiteCondition = (i) =>
    setData(d => ({ ...d, siteConditions: d.siteConditions.filter((_, idx) => idx !== i) }));
  const addSiteCondition = () =>
    setData(d => ({ ...d, siteConditions: [...d.siteConditions, ""] }));

  const updateGeneralNote = (id, field, val) =>
    setData(d => ({ ...d, generalNotes: d.generalNotes.map(it => it.id === id ? { ...it, [field]: val } : it) }));
  const addGeneralNote = () =>
    setData(d => ({ ...d, generalNotes: [...d.generalNotes, { id: uid(), description: "", photo: null }] }));
  const removeGeneralNote = (id) =>
    setData(d => ({ ...d, generalNotes: d.generalNotes.filter(it => it.id !== id) }));

  const updateRoomItem = (roomId, itemId, field, val) =>
    setData(d => ({
      ...d,
      rooms: d.rooms.map(r => r.id !== roomId ? r : {
        ...r, items: r.items.map(it => it.id !== itemId ? it : { ...it, [field]: val })
      })
    }));
  const addRoomItem = (roomId) =>
    setData(d => ({
      ...d,
      rooms: d.rooms.map(r => r.id !== roomId ? r : {
        ...r, items: [...r.items, { id: uid(), description: "", photo: null }]
      })
    }));
  const removeRoomItem = (roomId, itemId) =>
    setData(d => ({
      ...d,
      rooms: d.rooms.map(r => r.id !== roomId ? r : {
        ...r, items: r.items.filter(it => it.id !== itemId)
      })
    }));
  const updateRoomName = (roomId, name) =>
    setData(d => ({ ...d, rooms: d.rooms.map(r => r.id !== roomId ? r : { ...r, name }) }));
  const addRoom = () =>
    setData(d => ({ ...d, rooms: [...d.rooms, { id: uid(), name: "Room Name", items: [{ id: uid(), description: "", photo: null }] }] }));
  const removeRoom = (roomId) =>
    setData(d => ({ ...d, rooms: d.rooms.filter(r => r.id !== roomId) }));

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="toolbar">
          <div className="toolbar-left">
            <span className="toolbar-brand">JBMA</span>
            <span className="toolbar-title">925 Park Ave — Punch List — March 11, 2026</span>
          </div>
          <div className="toolbar-right">
            {saveStatus && <span className="save-status">{saveStatus}</span>}
            <button className="btn btn-print" onClick={() => window.print()}>⎙  Print / PDF</button>
          </div>
        </div>

        <div className="pages">
          <div className="page">
            <div className="doc-header">
              <div className="doc-header-left">
                <div className="doc-header-project">{data.project}</div>
                <div className="doc-header-projnum">{data.projectNum}</div>
              </div>
              <div className="doc-header-date">{data.date}</div>
            </div>
            <hr className="doc-header-rule" />

            {/* Site Conditions */}
            <div className="section-label">Site Conditions</div>
            <ul className="site-list">
              {data.siteConditions.map((s, i) => (
                <li key={i} className="site-item">
                  <span className="site-bullet">–</span>
                  <input className="site-input" value={s}
                    onChange={e => updateSiteCondition(i, e.target.value)}
                    placeholder="Add condition…" />
                  <button className="site-remove" onClick={() => removeSiteCondition(i)}>✕</button>
                </li>
              ))}
            </ul>
            <button className="add-inline" onClick={addSiteCondition}>＋ Add condition</button>

            {/* General Notes */}
            <div className="general-notes-header">General Notes</div>
            <div className="items-grid">
              {chunkPairs(data.generalNotes).map((pair, pi) =>
                pair.map((item, ci) => item ? (
                  <ItemCard key={item.id} item={item} num={pi * 2 + ci + 1}
                    onDescChange={v => updateGeneralNote(item.id, "description", v)}
                    onPhoto={url => updateGeneralNote(item.id, "photo", url)}
                    onRemove={() => removeGeneralNote(item.id)}
                  />
                ) : <div key={`eg-${pi}-${ci}`} className="item-card" style={{ background: "#fafaf8" }} />)
              )}
              <button className="add-item-cell" onClick={addGeneralNote}>＋ Add note</button>
            </div>

            {/* By Room */}
            <div className="section-label" style={{ marginTop: 16 }}>By Room</div>

            {data.rooms.map(room => (
              <div key={room.id} className="room-block">
                <div className="room-header-row">
                  <input className="room-name-input" value={room.name}
                    onChange={e => updateRoomName(room.id, e.target.value)}
                    placeholder="Room name…" />
                  <button className="btn-danger" onClick={() => removeRoom(room.id)}>Remove</button>
                </div>
                <div className="items-grid">
                  {chunkPairs(room.items).map((pair, pi) =>
                    pair.map((item, ci) => item ? (
                      <ItemCard key={item.id} item={item} num={pi * 2 + ci + 1}
                        onDescChange={v => updateRoomItem(room.id, item.id, "description", v)}
                        onPhoto={url => updateRoomItem(room.id, item.id, "photo", url)}
                        onRemove={() => removeRoomItem(room.id, item.id)}
                      />
                    ) : <div key={`er-${pi}-${ci}`} className="item-card" style={{ background: "#fafaf8" }} />)
                  )}
                  <button className="add-item-cell" onClick={() => addRoomItem(room.id)}>＋ Add item</button>
                </div>
              </div>
            ))}

            <button className="add-room-btn" onClick={addRoom}>＋ Add room</button>
          </div>
        </div>
      </div>
    </>
  );
}
