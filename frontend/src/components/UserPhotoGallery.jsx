import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoLightbox } from "./PhotoLightbox";
import { usePhotoService } from "../hooks";

export function UserPhotoGallery({ isEditing }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const { user } = useUser();
  const photoService = usePhotoService();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const data = await photoService.fetchPhotos();
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setError("Failed to load photos");
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      await photoService.deletePhoto(photoId);
      setPhotos((prevPhotos) => prevPhotos.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  const handleEdit = (updatedPhoto) => {
    setPhotos(photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="photo-gallery">
      <PhotoGrid
        photos={photos}
        isOwner={true}
        isEditing={isEditing}
        onPhotoClick={setSelectedPhotoIndex}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <PhotoLightbox
        photos={photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
      />
    </div>
  );
}
