import { useRef, useState } from "react";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3m-9 0 1 14h8l1-14M10 11v5M14 11v5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="12" rx="1.5" />
      <path d="M5 16V5.5A1.5 1.5 0 0 1 6.5 4H16" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7v5h5M4.5 12a7.5 7.5 0 1 0 2-5.1" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5v14M8 5 5.5 7.5M8 5l2.5 2.5M16 19V5m0 14 2.5-2.5M16 19l-2.5-2.5" />
    </svg>
  );
}

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
  onCopyNotes,
  copyStatus,
  onSaveToFile,
  onLoadFromFile,
  onClear,
  clearConfirm,
  readOnly = false,
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [documentSort, setDocumentSort] = useState("date");
  const deleteTimer = useRef(null);

  const handleDeleteClick = (id) => {
    clearTimeout(deleteTimer.current);
    if (deleteConfirm === id) {
      setDeleteConfirm(null);
      onDelete(id);
    } else {
      setDeleteConfirm(id);
      deleteTimer.current = setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (documentSort === "name") {
      return (a.name || "").localeCompare(b.name || "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    const aTime = Date.parse(a.lastSaved || "");
    const bTime = Date.parse(b.lastSaved || "");
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    return (b.lastSaved || "").localeCompare(a.lastSaved || "");
  });

  return (
    <>
      <button
        className={`sidebar-toggle${isOpen ? " sidebar-toggle--open" : ""}`}
        onClick={onToggle}
        title={isOpen ? "Hide punch list panel" : "Show punch list panel"}
        aria-label={isOpen ? "Hide punch list panel" : "Show punch list panel"}
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside
        className={`sidebar${isOpen ? " sidebar--open" : ""}`}
        aria-hidden={!isOpen}
        aria-label="Punch list panel"
      >
        <div className="sidebar-header">
          <div className="sidebar-heading-row">
            <div>
              <div className="sidebar-kicker">Your work</div>
              <div className="sidebar-heading">Punch lists</div>
            </div>
            {projects.length > 1 && (
              <button
                className="sidebar-sort-docs-btn"
                onClick={() =>
                  setDocumentSort((current) =>
                    current === "date" ? "name" : "date",
                  )
                }
                type="button"
                title={`Sort punch lists by ${documentSort === "date" ? "name" : "date"}`}
              >
                <SortIcon />
                {documentSort === "date" ? "Recent" : "A–Z"}
              </button>
            )}
          </div>
          <button className="sidebar-new-btn" onClick={onNew} type="button">
            <span aria-hidden="true">+</span>
            New punch list
          </button>
        </div>

        <div className="sidebar-list">
          {sortedProjects.length === 0 && (
            <div className="sidebar-empty">No saved punch lists yet.</div>
          )}
          {sortedProjects.map((proj) => {
            const isActive = proj.id === activeId;
            const isConfirming = deleteConfirm === proj.id;
            const projectName = proj.name || "Untitled punch list";
            return (
              <div
                key={proj.id}
                className={`sidebar-item${isActive ? " sidebar-item--active" : ""}`}
              >
                <button
                  className="sidebar-item-btn"
                  onClick={() => !isActive && onOpen(proj.id)}
                  disabled={isActive}
                  type="button"
                >
                  <span className="sidebar-item-name">{projectName}</span>
                  <span className="sidebar-item-meta">
                    {proj.isExample
                      ? `Practice project · ${proj.lastSaved || "No date"}`
                      : proj.lastSaved || "No date"}
                  </span>
                </button>
                <button
                  className={`sidebar-item-delete${isConfirming ? " sidebar-item-delete--confirm" : ""}`}
                  onClick={() => handleDeleteClick(proj.id)}
                  title={isConfirming ? "Click again to delete" : "Delete punch list"}
                  aria-label={
                    isConfirming
                      ? `Confirm delete ${projectName}`
                      : `Delete punch list ${projectName}`
                  }
                  type="button"
                >
                  <span className="sidebar-delete-icon" aria-hidden="true">
                    {isConfirming ? "?" : <TrashIcon />}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="sidebar-secondary">
          <details className="sidebar-disclosure">
            <summary>Document settings</summary>
            <div className="sidebar-disclosure-body">
              <label className="sidebar-toggle-row">
                <input
                  type="checkbox"
                  checked={layout.showSummary}
                  disabled={readOnly}
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
                  disabled={readOnly}
                  onChange={(event) =>
                    onLayoutChange({ showCount: event.target.checked })
                  }
                />
                <span>Show item count</span>
              </label>
            </div>
          </details>

          <details className="sidebar-disclosure">
            <summary>More actions</summary>
            <div className="sidebar-disclosure-body">
              <button
                className="sidebar-action-btn"
                onClick={onSortRooms}
                disabled={readOnly}
                type="button"
              >
                <span className="sidebar-action-icon" aria-hidden="true">
                  <SortIcon />
                </span>
                Sort rooms
              </button>
              <button className="sidebar-action-btn" onClick={onDuplicate} type="button">
                <span className="sidebar-action-icon" aria-hidden="true">
                  <CopyIcon />
                </span>
                Duplicate punch list
              </button>
              <button className="sidebar-action-btn" onClick={onCopyNotes} type="button">
                <span className="sidebar-action-icon" aria-hidden="true">
                  <CopyIcon />
                </span>
                {copyStatus || "Copy punch list text"}
              </button>
              <button className="sidebar-action-btn" onClick={onSaveToFile} type="button">
                <span className="sidebar-action-icon sidebar-action-icon--download" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />
                  </svg>
                </span>
                Save backup file
              </button>
              <label className="sidebar-action-btn sidebar-file-label">
                <span className="sidebar-action-icon sidebar-action-icon--upload" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 20V9m0 0 4 4m-4-4-4 4M5 4h14" />
                  </svg>
                </span>
                Load backup file
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={onLoadFromFile}
                  hidden
                />
              </label>
              <button
                className={`sidebar-action-btn sidebar-action-btn--danger${clearConfirm ? " sidebar-action-btn--confirm" : ""}`}
                onClick={onClear}
                disabled={readOnly}
                type="button"
              >
                <span className="sidebar-action-icon sidebar-action-icon--reset" aria-hidden="true">
                  <ResetIcon />
                </span>
                {clearConfirm ? "Confirm clear" : "Clear punch list"}
              </button>
            </div>
          </details>
        </div>
      </aside>

      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle} aria-hidden="true" />
      )}
    </>
  );
}
