import { useState } from "react";
import { DENSITY_OPTIONS } from "./layout.js";

export default function ProjectSidebar({
  isOpen,
  onToggle,
  projects,
  activeId,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  layout,
  onLayoutChange,
  onSortRooms,
  onSaveToFile,
  onLoadFromFile,
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const deleteTimers = {};

  const handleDeleteClick = (id) => {
    if (deleteConfirm === id) {
      clearTimeout(deleteTimers[id]);
      setDeleteConfirm(null);
      onDelete(id);
    } else {
      setDeleteConfirm(id);
      deleteTimers[id] = setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <>
      <button
        className={`sidebar-toggle${isOpen ? " sidebar-toggle--open" : ""}`}
        onClick={onToggle}
        title={isOpen ? "Hide projects" : "Show projects"}
        aria-label={isOpen ? "Hide project list" : "Show project list"}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div className={`sidebar${isOpen ? " sidebar--open" : ""}`} aria-hidden={!isOpen}>
        <div className="sidebar-header">
          <span className="sidebar-label">Projects</span>
        </div>

        <div className="sidebar-list">
          {projects.length === 0 && (
            <div className="sidebar-empty">No saved projects yet.</div>
          )}
          {projects.map((proj) => {
            const isActive = proj.id === activeId;
            return (
              <div
                key={proj.id}
                className={`sidebar-item${isActive ? " sidebar-item--active" : ""}`}
              >
                <button
                  className="sidebar-item-btn"
                  onClick={() => !isActive && onOpen(proj.id)}
                  disabled={isActive}
                >
                  <span className="sidebar-item-name">{proj.name || "Untitled"}</span>
                  {proj.projectNum && (
                    <span className="sidebar-item-meta">{proj.projectNum}</span>
                  )}
                  <span className="sidebar-item-meta">{proj.lastSaved}</span>
                </button>
                {!isActive && (
                  <button
                    className={`sidebar-item-delete${deleteConfirm === proj.id ? " sidebar-item-delete--confirm" : ""}`}
                    onClick={() => handleDeleteClick(proj.id)}
                    title={deleteConfirm === proj.id ? "Click again to confirm" : "Delete project"}
                    aria-label="Delete project"
                  >
                    {deleteConfirm === proj.id ? "?" : "x"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Layout</div>
          <div className="sidebar-label-sub">Card size per page</div>
          <div className="sidebar-density">
            {DENSITY_OPTIONS.map((density, i) => {
              const labels = ["Large", "Medium", "Small"];
              return (
                <button
                  key={density}
                  className={`sidebar-density-btn${layout.density === density ? " sidebar-density-btn--active" : ""}`}
                  onClick={() => onLayoutChange({ density })}
                  type="button"
                  title={`${labels[i]} cards (${density} grid)`}
                >
                  {labels[i]}
                </button>
              );
            })}
          </div>
          <label className="sidebar-toggle-row">
            <input
              type="checkbox"
              checked={layout.showPhotos}
              onChange={(event) =>
                onLayoutChange({ showPhotos: event.target.checked })
              }
            />
            <span>Show photo slots</span>
          </label>
          <label className="sidebar-toggle-row">
            <input
              type="checkbox"
              checked={layout.showSummary}
              onChange={(event) =>
                onLayoutChange({ showSummary: event.target.checked })
              }
            />
            <span>Include summary page</span>
          </label>
          <label className="sidebar-toggle-row">
            <input
              type="checkbox"
              checked={layout.showCount}
              onChange={(event) =>
                onLayoutChange({ showCount: event.target.checked })
              }
            />
            <span>Show item count</span>
          </label>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Rooms</div>
          <div className="sidebar-label-sub">Sort by room number prefix</div>
          <button className="sidebar-action-btn" onClick={onSortRooms} type="button">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            Sort Rooms
          </button>
        </div>

        <div className="sidebar-section sidebar-section--actions">
          <div className="sidebar-label">Actions</div>
          <button className="sidebar-action-btn sidebar-action-btn--primary" onClick={onNew}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Punchlist
          </button>
          <button className="sidebar-action-btn" onClick={onDuplicate}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Duplicate Current
          </button>
        </div>

        <div className="sidebar-section sidebar-section--actions">
          <div className="sidebar-label">File</div>
          <button className="sidebar-action-btn" onClick={onSaveToFile}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v12M8 11l4 4 4-4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Save to File
          </button>
          <label className="sidebar-action-btn sidebar-file-label">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 15V3M8 7l4-4 4 4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Load from File
            <input
              type="file"
              accept=".json,application/json"
              onChange={onLoadFromFile}
              hidden
            />
          </label>
        </div>
      </div>

      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle} aria-hidden="true" />
      )}
    </>
  );
}
