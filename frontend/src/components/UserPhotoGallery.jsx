import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import { PhotoCard } from "./PhotoCard";
import { PhotoService } from "../services/api";

export function UserPhotoGallery({ isEditing }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const { getToken } = useAuth();
  const { user } = useUser();
  const photoService = new PhotoService(getToken);

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

  const lightboxSlides = photos.map((photo) => ({
    src: photo.s3Url,
    title: photo.title,
    description: photo.description,
  }));

  return (
    <div className="photo-gallery">
      <div className="photo-grid">
        {photos.length === 0 ? (
          <p>No photos uploaded yet.</p>
        ) : (
          photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={handleDelete}
              isOwner={photo.userId === user?.id}
              onClick={() => setSelectedPhotoIndex(index)}
              isEditing={isEditing}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
      <Lightbox
        open={selectedPhotoIndex >= 0}
        close={() => setSelectedPhotoIndex(-1)}
        index={selectedPhotoIndex}
        slides={lightboxSlides}
        plugins={[Thumbnails, Zoom, Counter]}
        carousel={{
          finite: false,
          preload: 3,
          padding: "16px",
        }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
        render={{
          buttonPrev: photos.length <= 1 ? () => null : undefined,
          buttonNext: photos.length <= 1 ? () => null : undefined,
        }}
      />
    </div>
  );
}
