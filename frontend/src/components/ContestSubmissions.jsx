import React, { useState } from "react";
import styles from "../styles/components/Contest.module.css";
import { PhotoLightbox } from "./PhotoLightbox";

function ContestPhotoCard({ photo, onClick }) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  return (
    <div className={styles.contestPhotoCard} onClick={() => onClick(photo)}>
      <img
        src={photo.thumbnailUrl}
        alt="Contest submission"
        onError={handleImageError}
        className={styles.contestSubmissionImage}
        loading="lazy"
      />
    </div>
  );
}

export function ContestSubmissions({ photos = [] }) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);

  if (photos.length === 0) {
    return <p>No submissions yet. Be the first to submit!</p>;
  }

  return (
    <>
      <h3 className="text-2xl font-semibold mb-6">
        Submissions ({photos.length})
      </h3>
      <div className={styles.submissionsGrid}>
        {photos.map((photo, index) => (
          <ContestPhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => setSelectedPhotoIndex(index)}
          />
        ))}
      </div>

      <PhotoLightbox
        photos={photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
      />
    </>
  );
}
