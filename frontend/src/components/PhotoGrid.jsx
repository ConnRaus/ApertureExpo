import React from "react";
import { PhotoCard } from "./PhotoCard";

export function PhotoGrid({
  photos,
  isOwner,
  isEditing,
  onPhotoClick,
  onDelete,
  onEdit,
  hideProfileLink = false,
}) {
  if (photos.length === 0) {
    return <p>No photos uploaded yet.</p>;
  }

  return (
    <div className="photo-grid">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isOwner={isOwner}
          onClick={() => onPhotoClick(index)}
          isEditing={isEditing}
          onDelete={onDelete}
          onEdit={onEdit}
          hideProfileLink={hideProfileLink}
        />
      ))}
    </div>
  );
}
