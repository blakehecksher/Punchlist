import { useState, useRef, useCallback } from "react";
import { idbSetPhoto, idbDeletePhoto } from "./idb.js";

const MAX_DIM = 1200;
const QUALITY = 0.7;

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.src = url;
  });
}

/**
 * PhotoCell — photo display with full pan/zoom in both axes.
 *
 * Uses background-image + background-size/position for rendering.
 * At scale=1 the image fills the cell (like background-size:cover)
 * centered at (x%, y%). Dragging shifts the background-position,
 * scroll-wheel zooms. Position persists to IndexedDB.
 *
 * pos = { scale, x, y } where x/y are background-position percentages.
 * At scale=1, background-size is "cover". At scale>1, background-size
 * grows proportionally so the image is larger than the cell and can
 * be panned freely in both directions.
 */
const DEFAULT_POS = { scale: 1, x: 50, y: 50 };

export default function PhotoCell({ projectId, itemId, photo, position, onPhoto, onRemove, onPositionChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [pos, setPos] = useState(position ?? DEFAULT_POS);
  const [photoKey, setPhotoKey] = useState(photo);
  const fileRef = useRef();
  const cellRef = useRef();
  const dragging = useRef(false);
  const lastClient = useRef({ x: 0, y: 0 });

  // Reset position when the photo changes
  if (photo !== photoKey) {
    setPhotoKey(photo);
    setPos(position ?? DEFAULT_POS);
  }

  // Persist position changes (debounced)
  const persistTimer = useRef(null);
  const persistPosition = useCallback((newPos) => {
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      if (onPositionChange) onPositionChange(newPos);
    }, 300);
  }, [onPositionChange]);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await compressImage(file);
    onPhoto(dataUrl, DEFAULT_POS);
    idbSetPhoto(projectId, itemId, { dataUrl, position: DEFAULT_POS }).catch(() => {});
  }, [projectId, itemId, onPhoto]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleWheel = useCallback((e) => {
    if (!photo) return;
    e.preventDefault();
    setPos(prev => {
      const newScale = Math.min(4, Math.max(1, prev.scale - e.deltaY * 0.003));
      const next = { ...prev, scale: newScale };
      // Clamp position when zooming out
      next.x = Math.max(0, Math.min(100, next.x));
      next.y = Math.max(0, Math.min(100, next.y));
      persistPosition(next);
      return next;
    });
  }, [photo, persistPosition]);

  // Drag uses window-level listeners so it continues outside the cell.
  // We store the cleanup ref so mouseup can remove both listeners.
  const cleanupDrag = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (!photo) return;
    e.preventDefault();
    dragging.current = true;
    lastClient.current = { x: e.clientX, y: e.clientY };

    const onMove = (ev) => {
      if (!cellRef.current) return;
      const rect = cellRef.current.getBoundingClientRect();
      const dx = ev.clientX - lastClient.current.x;
      const dy = ev.clientY - lastClient.current.y;
      lastClient.current = { x: ev.clientX, y: ev.clientY };

      setPos(prev => {
        const sensitivity = 100 / prev.scale;
        const pctX = -(dx / rect.width) * sensitivity;
        const pctY = -(dy / rect.height) * sensitivity;
        const next = {
          ...prev,
          x: Math.max(0, Math.min(100, prev.x + pctX)),
          y: Math.max(0, Math.min(100, prev.y + pctY)),
        };
        persistPosition(next);
        return next;
      });
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      cleanupDrag.current = null;
    };

    // Remove any stale listeners before adding new ones
    if (cleanupDrag.current) cleanupDrag.current();
    cleanupDrag.current = onUp;

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [photo, persistPosition]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    onRemove();
    idbDeletePhoto(projectId, itemId).catch(() => {});
  }, [projectId, itemId, onRemove]);

  const handleReset = useCallback((e) => {
    e.stopPropagation();
    setPos(DEFAULT_POS);
    persistPosition(DEFAULT_POS);
  }, [persistPosition]);

  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setPos(prev => {
      const next = { ...prev, scale: Math.min(4, prev.scale + 0.25) };
      persistPosition(next);
      return next;
    });
  }, [persistPosition]);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    setPos(prev => {
      const next = { ...prev, scale: Math.max(1, prev.scale - 0.25) };
      persistPosition(next);
      return next;
    });
  }, [persistPosition]);

  // Background-based rendering: at scale=1 it's equivalent to
  // background-size:cover centered. At scale>1 the background is
  // proportionally larger, and background-position pans in both axes.
  const bgStyle = photo ? {
    backgroundImage: `url(${photo})`,
    backgroundSize: `${pos.scale * 100}%`,
    backgroundPosition: `${pos.x}% ${pos.y}%`,
    backgroundRepeat: "no-repeat",
  } : undefined;

  return (
    <div
      ref={cellRef}
      className={`photo-cell${photo ? " has-photo" : ""}${dragOver ? " drag-over" : ""}`}
      style={bgStyle}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !photo && fileRef.current.click()}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
      {photo ? (
        <div className="photo-controls">
          <button className="photo-btn" onClick={handleZoomIn}>+</button>
          <button className="photo-btn" onClick={handleZoomOut}>−</button>
          <button className="photo-btn" onClick={handleReset}>↺</button>
          <button className="photo-btn" onClick={handleRemove}>✕</button>
        </div>
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
