import React, { useState, useEffect } from "react";
import {
  Lightbox,
  LightboxConfigs,
  PhotoGrid,
  PhotoGridConfigs,
} from "../photos/PhotoComponents";
import { Pagination } from "../common/Pagination";

export function ContestSubmissions({
  photos = [],
  contestId,
  contestPhase = "submission",
  pagination = null,
  onPageChange,
  userVotesMap = {},
  onUserVoteChange = () => {},
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
    // Update shared user vote state so all components stay in sync
    onUserVoteChange(photoId, newVoteValue);
    // Still bump the trigger to force re-render in any places relying on the key
    setVoteUpdateTrigger((prev) => prev + 1);
  };

  // Determine which config to use based on contest phase
  const getGridConfig = () => {
    switch (contestPhase) {
      case "submission":
        return PhotoGridConfigs.contestSubmission;
      case "voting":
        return PhotoGridConfigs.contestVoting;
      case "ended":
        return PhotoGridConfigs.contestResults;
      default:
        return PhotoGridConfigs.contestSubmission;
    }
  };

  if (!photos || photos.length === 0) {
    // Don't show message for upcoming contests (coming soon phase)
    if (contestPhase === "upcoming") {
      return null;
    }
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

      <PhotoGrid
        photos={displayPhotos}
        config={getGridConfig()}
        onClick={setSelectedPhotoIndex}
        contestId={contestId}
        contestPhase={contestPhase}
        voteUpdateTrigger={voteUpdateTrigger}
        userVotesMap={userVotesMap}
        onUserVoteChange={onUserVoteChange}
      />

      {/* Show pagination if pagination data is available */}
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}

      <Lightbox
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
        userVotesMap={userVotesMap}
        onUserVoteChange={onUserVoteChange}
      />
    </>
  );
}
