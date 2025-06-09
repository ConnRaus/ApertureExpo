import React, { useState, useEffect } from "react";
import styles from "../../styles/components/Contest.module.css";
import { UnifiedLightbox, LightboxConfigs } from "../photos/PhotoComponents";
import { PhotoVoteButton } from "./PhotoVoteButton";
import { Link } from "react-router-dom";
import { Pagination } from "../common/Pagination";

function ContestPhotoCard({
  photo,
  contestId,
  contestPhase,
  onClick,
  voteUpdateTrigger,
}) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  // Check if we should show votes
  const showVotes = contestPhase === "voting" || contestPhase === "ended";

  // Only show stars during voting phase
  const showStars = contestPhase === "voting";

  // Hide title during voting phase to prevent bias
  const showTitle = contestPhase !== "voting";

  return (
    <div className={`${styles.contestPhotoCard} relative group cursor-pointer`}>
      <div className="relative overflow-hidden" onClick={() => onClick(photo)}>
        <img
          src={photo.thumbnailUrl}
          alt="Contest submission"
          onError={handleImageError}
          className={`${styles.contestSubmissionImage} group-hover:scale-105 transition-transform duration-500`}
          loading="lazy"
        />

        {/* Text and voting overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 via-gray-900/70 to-transparent p-4 text-white">
          {showTitle && (
            <h3 className="text-lg font-semibold mb-2 leading-tight text-center">
              {photo.title}
            </h3>
          )}

          {contestPhase === "ended" && showVotes && (
            <div className="text-center">
              <div className="text-sm text-gray-300 mb-1">
                by{" "}
                <Link
                  to={`/users/${photo.userId}`}
                  className="text-indigo-300 hover:text-indigo-200 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {photo.User?.nickname || "Unknown"}
                </Link>
              </div>
              <div className="text-sm text-yellow-400">
                {photo.averageRating ? photo.averageRating.toFixed(1) : "0.0"}/5
                ⭐ ({photo.voteCount || 0} vote
                {photo.voteCount !== 1 ? "s" : ""})
              </div>
            </div>
          )}

          {contestPhase === "voting" && showVotes && (
            <div
              className="flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <PhotoVoteButton
                photo={photo}
                contestId={contestId}
                contestPhase={contestPhase}
                showStars={showStars}
                key={`${photo.id}-${voteUpdateTrigger}`}
              />
            </div>
          )}
        </div>
      </div>
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
  const [displayPhotos, setDisplayPhotos] = useState([]);
  const [voteUpdateTrigger, setVoteUpdateTrigger] = useState(0);

  // Update displayPhotos when photos prop changes
  useEffect(() => {
    if (!photos || photos.length === 0) {
      setDisplayPhotos([]);
      return;
    }

    // Photos are now assumed to be pre-sorted by the backend based on phase.
    // We only need to handle assigning rank for display in the 'ended' phase.
    let processedPhotos = [...photos];
    if (
      contestPhase === "ended" &&
      processedPhotos[0]?.totalScore !== undefined
    ) {
      // Add rank property for display
      let rank = 0;
      let lastScore = Infinity;
      let photosProcessedForRank = 0;
      processedPhotos = processedPhotos.map((photo) => {
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
    setDisplayPhotos(processedPhotos);
  }, [photos, contestPhase]);

  const handleVoteSuccess = (photoId, newVoteValue) => {
    // Trigger a re-render of PhotoVoteButton components by updating the trigger
    setVoteUpdateTrigger((prev) => prev + 1);
  };

  if (!photos || photos.length === 0) {
    return <p>No submissions yet. Be the first to submit!</p>;
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
            voteUpdateTrigger={voteUpdateTrigger}
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

      <UnifiedLightbox
        photos={displayPhotos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
        config={
          contestPhase === "submission"
            ? LightboxConfigs.contestSubmission
            : contestPhase === "voting"
            ? LightboxConfigs.contestVoting
            : LightboxConfigs.contestResults
        }
        contestId={contestId}
        contestPhase={contestPhase}
        onVoteSuccess={handleVoteSuccess}
      />
    </>
  );
}
