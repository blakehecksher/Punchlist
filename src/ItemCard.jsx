import PhotoCell from "./PhotoCell.jsx";

export default function ItemCard({ item, num, onDescChange, onPhoto, onRemove, onPositionChange }) {
  return (
    <div className="item-card">
      <div className="item-text">
        <div className="item-num">Item #{String(num).padStart(2, "0")}</div>
        <div className="item-label">Description:</div>
        <textarea className="item-desc-edit" value={item.description}
          onChange={e => onDescChange(e.target.value)} rows={4} />
        <button className="item-remove" onClick={onRemove} title="Remove item">✕</button>
      </div>
      <PhotoCell
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
