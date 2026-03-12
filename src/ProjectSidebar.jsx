import { useState } from "react";

export default function ProjectSidebar({
  isOpen,
  onToggle,
  projects,       // [{ id, name, projectNum, lastSaved }]
  activeId,
  onOpen,         // (id) => void
  onNew,          // () => void
  onDuplicate,    // () => void
  onDelete,       // (id) => void
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id pending delete
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
      {/* Toggle tab — always visible on left edge */}
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

      {/* Sidebar panel */}
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
                    {deleteConfirm === proj.id ? "?" : "✕"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="sidebar-actions">
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
      </div>

      {/* Overlay to close sidebar on mobile / click-outside */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle} aria-hidden="true" />
      )}
    </>
  );
}
