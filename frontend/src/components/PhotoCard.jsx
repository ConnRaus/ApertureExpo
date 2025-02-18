import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import formStyles from "../styles/components/Form.module.css";
import { PhotoService } from "../services/api";

export function PhotoCard({
  photo,
  onDelete,
  isOwner,
  onClick,
  isEditing,
  onEdit,
  hideProfileLink = false,
}) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [title, setTitle] = useState(photo.title);
  const [description, setDescription] = useState(photo.description || "");
  const { getToken } = useAuth();
  const photoService = new PhotoService(getToken);

  const handleImageError = (e) => {
    console.error("Image failed to load:", photo.s3Url);
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  const handleEdit = async () => {
    try {
      const updatedPhoto = await photoService.updatePhoto(photo.id, {
        title,
        description,
      });
      if (onEdit) {
        onEdit(updatedPhoto);
      }
      setIsEditingDetails(false);
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Failed to update photo details");
    }
  };

  return (
    <div className="photo-card">
      {isOwner && isEditing && (
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo.id);
          }}
          title="Delete photo"
        >
          ×
        </button>
      )}
      <div
        className="photo-image"
        onClick={() => !isEditingDetails && onClick(photo)}
      >
        <img src={photo.s3Url} alt={photo.title} onError={handleImageError} />
      </div>
      <div className="photo-info">
        {isEditingDetails && isEditing ? (
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={formStyles.input}
            />
            <label className={formStyles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={formStyles.textarea}
            />
            <div className={formStyles.editButtons}>
              <button
                onClick={handleEdit}
                className={`${formStyles.button} ${formStyles.primaryButton}`}
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingDetails(false)}
                className={`${formStyles.button} ${formStyles.secondaryButton}`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3>{photo.title}</h3>
            {photo.description && <p>{photo.description}</p>}
            {!hideProfileLink && (
              <Link
                to={`/users/${photo.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="user-link"
              >
                View Profile
              </Link>
            )}
            {photo.createdAt && (
              <p className="upload-date">
                Uploaded {new Date(photo.createdAt).toLocaleDateString()}
              </p>
            )}
            {isOwner && isEditing && (
              <button
                className={`${formStyles.button} ${formStyles.primaryButton} mt-4`}
                onClick={() => setIsEditingDetails(true)}
              >
                Edit Details
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
