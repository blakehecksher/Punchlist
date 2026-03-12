import PhotoCell from "./PhotoCell.jsx";

export default function ItemCard({ projectId, item, num, onDescChange, onPhoto, onRemove, onPositionChange }) {
  return (
    <div className="item-card">
      <div className="item-text">
        <div className="item-num">Item #{String(num).padStart(2, "0")}</div>
        <div className="item-label">Description:</div>
        <textarea className="item-desc-edit" value={item.description}
          onChange={e => onDescChange(e.target.value)}
          placeholder="Click here to enter description" rows={4} />
        <button className="item-remove" onClick={onRemove} title="Remove item">✕</button>
      </div>
      <PhotoCell
        projectId={projectId}
        itemId={item.id}
        photo={item.photo}
        position={item.photoPosition}
        onPhoto={onPhoto}
        onRemove={() => onPhoto(null, null)}
        onPositionChange={onPositionChange}
      />
    </div>
  );
}
