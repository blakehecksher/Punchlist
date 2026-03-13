import PhotoCell from "./PhotoCell.jsx";

const ROWS_BY_DENSITY = {
  "2x2": 4,
  "3x3": 3,
  "4x4": 2,
};

export default function ItemCard({
  projectId,
  item,
  num,
  density,
  showPhotos,
  onDescChange,
  onPhoto,
  onRemove,
  onPositionChange,
}) {
  const cardClass = [
    "item-card",
    `item-card--${density}`,
    showPhotos ? "" : "item-card--text-only",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="item-text">
        <div className="item-num">Item #{String(num).padStart(2, "0")}</div>
        <div className="item-label">Description:</div>
        <textarea
          className="item-desc-edit"
          value={item.description}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Click here to enter description"
          rows={ROWS_BY_DENSITY[density] ?? 3}
        />
        <button className="item-remove" onClick={onRemove} title="Remove item">
          x
        </button>
      </div>
      {showPhotos && (
        <PhotoCell
          projectId={projectId}
          itemId={item.id}
          photo={item.photo}
          position={item.photoPosition}
          onPhoto={onPhoto}
          onRemove={() => onPhoto(null, null)}
          onPositionChange={onPositionChange}
        />
      )}
    </div>
  );
}
