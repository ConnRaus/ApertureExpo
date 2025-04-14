import React, { useState } from "react";
import styles from "../../styles/components/Contest.module.css";
import { PhotoLightbox } from "../photos/PhotoLightbox";
import { PhotoVoteButton } from "./PhotoVoteButton";

function ContestPhotoCard({ photo, contestId, contestPhase, onClick }) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  // Check if we should show votes
  const showVotes = contestPhase === "voting" || contestPhase === "ended";

  return (
    <div className={styles.contestPhotoCard}>
      <div onClick={() => onClick(photo)}>
        <img
          src={photo.thumbnailUrl}
          alt="Contest submission"
          onError={handleImageError}
          className={styles.contestSubmissionImage}
          loading="lazy"
        />
      </div>

      {showVotes && (
        <div className={styles.photoVoteContainer}>
          <h3 className={styles.photoTitle}>{photo.title}</h3>
          <PhotoVoteButton
            photo={photo}
            contestId={contestId}
            contestPhase={contestPhase}
            showStars={true}
          />
        </div>
      )}
    </div>
  );
}

export function ContestSubmissions({
  photos = [],
  contestId,
  contestPhase = "submission",
}) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);

  if (photos.length === 0) {
    return <p>No submissions yet. Be the first to submit!</p>;
  }

  // If the contest is in voting or ended phase, sort photos by votes (if available)
  let displayPhotos = [...photos];
  if (
    (contestPhase === "voting" || contestPhase === "ended") &&
    displayPhotos[0]?.totalScore !== undefined
  ) {
    displayPhotos.sort((a, b) => {
      // Sort by total score or vote count if available
      return (
        (b.totalScore || 0) - (a.totalScore || 0) ||
        (b.voteCount || 0) - (a.voteCount || 0)
      );
    });
  }

  return (
    <>
      <h3 className="text-2xl font-semibold mb-6">
        {contestPhase === "ended" ? "Results" : "Submissions"} ({photos.length})
      </h3>

      <div className={styles.submissionsGrid}>
        {displayPhotos.map((photo, index) => (
          <ContestPhotoCard
            key={photo.id}
            photo={photo}
            contestId={contestId}
            contestPhase={contestPhase}
            onClick={() => setSelectedPhotoIndex(index)}
          />
        ))}
      </div>

      <PhotoLightbox
        photos={displayPhotos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
      />
    </>
  );
}
