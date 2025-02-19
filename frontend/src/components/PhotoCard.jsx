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
    <div className="photo-card relative group">
      {isOwner && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingDetails(true);
            }}
            title="Edit photo details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            title="Delete photo"
          >
            ×
          </button>
        </div>
      )}
      <div
        className="photo-image"
        onClick={() => !isEditingDetails && onClick(photo)}
      >
        <img
          src={photo.thumbnailUrl}
          alt={photo.title}
          onError={handleImageError}
          loading="lazy"
          data-full-image={photo.s3Url}
        />
      </div>
      <div className="photo-info">
        {isEditingDetails ? (
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
          </>
        )}
      </div>
    </div>
  );
}
