import React, { useState, useEffect } from "react";
import styles from "../../styles/components/Contest.module.css";
import { PhotoLightbox } from "../photos/PhotoLightbox";
import { PhotoVoteButton } from "./PhotoVoteButton";
import { Link } from "react-router-dom";
import { Pagination } from "../common/Pagination";

function ContestPhotoCard({ photo, contestId, contestPhase, onClick }) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  // Check if we should show votes
  const showVotes = contestPhase === "voting" || contestPhase === "ended";

  // Only show stars during voting phase
  const showStars = contestPhase === "voting";

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

          {contestPhase === "ended" ? (
            <div className={styles.photoResultsInfo}>
              <div className={styles.photoAuthor}>
                by{" "}
                <Link
                  to={`/users/${photo.userId}`}
                  className="text-indigo-300 hover:text-indigo-200 underline"
                >
                  {photo.User?.nickname || "Unknown"}
                </Link>
              </div>
              <div className={styles.photoStats}>
                {photo.averageRating ? photo.averageRating.toFixed(1) : "0.0"}/5
                ⭐ ({photo.voteCount || 0} vote
                {photo.voteCount !== 1 ? "s" : ""})
              </div>
            </div>
          ) : (
            <PhotoVoteButton
              photo={photo}
              contestId={contestId}
              contestPhase={contestPhase}
              showStars={showStars}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ContestSubmissions({
  photos = [],
  contestId,
  contestPhase = "submission",
  pagination = null,
  onPageChange,
}) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);

  if (!photos || photos.length === 0) {
    return <p>No submissions yet. Be the first to submit!</p>;
  }

  // Photos are now assumed to be pre-sorted by the backend based on phase.
  // We only need to handle assigning rank for display in the 'ended' phase.
  let displayPhotos = [...photos];
  if (contestPhase === "ended" && displayPhotos[0]?.totalScore !== undefined) {
    // Add rank property for display
    let rank = 0;
    let lastScore = Infinity;
    let photosProcessedForRank = 0;
    displayPhotos = displayPhotos.map((photo) => {
      photosProcessedForRank++;
      const currentScore = photo.totalScore ?? -Infinity;
      if (currentScore < lastScore) {
        rank = photosProcessedForRank;
      } else if (lastScore === -Infinity) {
        rank = 1;
      }
      lastScore = currentScore;
      return { ...photo, rank };
    });
  }

  return (
    <>
      <h3
        className={`text-2xl font-semibold ${
          contestPhase === "ended" ? "mb-2" : "mb-4"
        }`}
      >
        {contestPhase === "ended" ? "All Submissions" : "Submissions"} (
        {pagination?.totalPhotos || photos.length})
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

      {/* Show pagination if pagination data is available */}
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}

      <PhotoLightbox
        photos={displayPhotos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
      />
    </>
  );
}
