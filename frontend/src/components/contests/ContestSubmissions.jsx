import React, { useState } from "react";
import styles from "../../styles/components/Contest.module.css";
import { PhotoLightbox } from "../photos/PhotoLightbox";
import { PhotoVoteButton } from "./PhotoVoteButton";
import { Link } from "react-router-dom";

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
                {photo.voteCount || 0} votes ·{" "}
                {photo.averageRating ? photo.averageRating.toFixed(1) : 0} avg
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

    // Add tied status to photos with the same score
    if (contestPhase === "ended") {
      let rank = 1;
      let prevScore = null;
      let tieCount = 0;

      displayPhotos.forEach((photo, index) => {
        const currentScore = photo.totalScore || 0;

        if (index > 0 && currentScore === prevScore) {
          photo.rank = rank - tieCount;
          tieCount++;
        } else {
          rank = index + 1;
          photo.rank = rank;
          tieCount = 1;
        }

        prevScore = currentScore;
      });
    }
  }

  return (
    <>
      <h3 className="text-2xl font-semibold mb-6">
        {contestPhase === "ended" ? "All Submissions" : "Submissions"} (
        {photos.length})
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
