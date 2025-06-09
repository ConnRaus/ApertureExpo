import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { PhotoService } from "../../services/PhotoService";

export function PhotoCard({
  photo,
  onDelete,
  isOwner,
  onClick,
  onEdit,
  hideProfileLink = false,
}) {
  const { getToken } = useAuth();
  const photoService = new PhotoService(getToken);

  const handleImageError = (e) => {
    console.error("Image failed to load:", photo.s3Url);
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  return (
    <div className="photo-card relative group">
      {isOwner && (
        <>
          <button
            className="absolute top-3 right-3 w-8 h-8 opacity-0 group-hover:opacity-100 bg-red-600/80 text-white rounded-full flex items-center justify-center transition-all hover:bg-red-600 hover:scale-110 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            aria-label="Delete photo"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
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
    </div>
  );
}
