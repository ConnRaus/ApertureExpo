import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import formStyles from "../../styles/components/Form.module.css";
import { PhotoService } from "../../services/PhotoService";

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
        <>
          <button
            className="absolute top-3 right-3 w-8 h-8 opacity-0 group-hover:opacity-100 bg-red-600/80 text-white rounded-full flex items-center justify-center text-lg font-medium transition-all hover:bg-red-600 hover:scale-110 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            aria-label="Delete photo"
          >
            ×
          </button>
          <button
            className="absolute top-3 right-14 w-8 h-8 opacity-0 group-hover:opacity-100 bg-blue-600/80 text-white rounded-full flex items-center justify-center text-sm transition-all hover:bg-blue-600 hover:scale-110 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingDetails(true);
            }}
            aria-label="Edit photo details"
          >
            ✏
          </button>
        </>
      )}

      <div
        className="photo-image relative overflow-hidden cursor-pointer"
        onClick={() => onClick && onClick()}
      >
        <img
          src={photo.thumbnailUrl || photo.s3Url}
          alt={photo.title}
          onError={handleImageError}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 via-gray-900/70 to-transparent p-4 text-white">
          <h3 className="text-lg font-semibold mb-1 leading-tight">
            {photo.title}
          </h3>
          {photo.description && (
            <p className="text-sm text-gray-200 line-clamp-2 mb-2 opacity-90">
              {photo.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-300">
            {!hideProfileLink && (
              <Link
                to={`/users/${photo.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                View Profile
              </Link>
            )}
            {photo.createdAt && (
              <span className="text-gray-400">
                {new Date(photo.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit form modal overlay */}
      {isEditingDetails && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsEditingDetails(false)}
        >
          <div
            className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Photo Details
            </h3>
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
          </div>
        </div>
      )}
    </div>
  );
}
