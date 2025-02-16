import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL;

export function PhotoSelector({
  isOpen,
  onClose,
  onSelect,
  excludePhotoIds = [],
  contestId,
}) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${API_URL}/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch photos");

      const data = await response.json();
      // Filter out excluded photos and sort by contest submission status
      const filteredPhotos = data
        .filter((photo) => !excludePhotoIds.includes(photo.id))
        .sort((a, b) => {
          // Sort photos: non-submitted first, then by date
          if ((a.ContestId === contestId) === (b.ContestId === contestId)) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.ContestId === contestId ? 1 : -1;
        });
      setPhotos(filteredPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Select a Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-4 border border-red-500/30">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            {photos.length === 0 ? (
              <p className="text-gray-400 text-center py-12">
                No photos available to select from.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const isSubmitted = photo.ContestId === contestId;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => !isSubmitted && onSelect(photo)}
                      className={`group relative aspect-square rounded-lg overflow-hidden ${
                        isSubmitted
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      } border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300`}
                    >
                      <img
                        src={photo.s3Url}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium truncate">
                            {photo.title}
                          </p>
                          {photo.description && (
                            <p className="text-gray-300 text-xs truncate">
                              {photo.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSubmitted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="bg-gray-900/90 text-white px-3 py-1 rounded-full text-sm border border-gray-700">
                            Already Submitted
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
