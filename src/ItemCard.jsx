import PhotoCell from "./PhotoCell.jsx";
import RichText from "./RichText.jsx";

export default function ItemCard({
  projectId,
  item,
  issueCode,
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
        <div className="item-num">{issueCode}</div>
        <div className="item-label">Description:</div>
        <RichText
          className="item-desc-edit"
          value={item.description}
          onChange={(html) => onDescChange(html)}
          placeholder="Click here to enter description"
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
