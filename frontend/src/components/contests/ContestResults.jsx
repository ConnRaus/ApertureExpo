import React, { useState } from "react";
import styles from "../../styles/components/Contest.module.css";
import { Link } from "react-router-dom";
import { UnifiedLightbox, LightboxConfigs } from "../photos/PhotoComponents";

export function ContestResults({ photos, contestId }) {
  // Sort photos by score (totalScore or voteCount)
  const sortedPhotos = [...photos].sort((a, b) => {
    const scoreA = a.totalScore ?? -Infinity;
    const scoreB = b.totalScore ?? -Infinity;
    // Fallback to voteCount if scores are equal or absent
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.voteCount || 0) - (a.voteCount || 0);
  });

  // Assign ranks with tie handling
  let currentRank = 0;
  let lastScore = Infinity;
  const rankedPhotos = sortedPhotos.map((photo, index) => {
    const currentScore = photo.totalScore ?? -Infinity;
    if (currentScore < lastScore) {
      currentRank = index + 1;
    }
    lastScore = currentScore;
    return { ...photo, rank: currentRank }; // Add rank property
  });

  // Get photos for the podium (ranks 1, 2, 3)
  const podiumWinners = rankedPhotos.filter((photo) => photo.rank <= 3);

  // Add state for lightbox
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);

  // If there are no photos or votes, show a message
  if (podiumWinners.length === 0) {
    // Check the original photos array for submissions
    if (!photos.length) {
      return (
        <div className={styles.resultsContainer}>
          <h2 className={styles.resultsTitle}>Contest Results</h2>
          <p className="text-center text-gray-400">
            No photos were submitted to this contest.
          </p>
        </div>
      );
    }
    // Check the first *sorted* photo for votes (as it's the highest score)
    if (!sortedPhotos[0]?.voteCount && !sortedPhotos[0]?.totalScore) {
      return (
        <div className={styles.resultsContainer}>
          <h2 className={styles.resultsTitle}>Contest Results</h2>
          <p className="text-center text-gray-400">
            No votes were cast in this contest.
          </p>
        </div>
      );
    }
    // If photos exist and have votes, but none ranked 1-3 (e.g., all 0 votes),
    // it's unlikely but possible. We can just show the 'no winners yet' state.
    return (
      <div className={styles.resultsContainer}>
        <h2 className={styles.resultsTitle}>Contest Winners</h2>
        <p className="text-center text-gray-400">
          Results are still being processed or no votes were cast.
        </p>
      </div>
    );
  }

  // Create the podium display
  return (
    <>
      <div className={styles.resultsContainer}>
        <h2 className={styles.resultsTitle}>Contest Winners</h2>

        <div className={styles.podiumContainer}>
          {podiumWinners.map((photo, index) => {
            // Use photo.rank now instead of index + 1
            const place = photo.rank;
            let placeClass;
            let placeText;

            // Simplified ordinal suffix function
            const getOrdinalSuffix = (n) => {
              const s = ["th", "st", "nd", "rd"];
              const v = n % 100;
              return s[(v - 20) % 10] || s[v] || s[0];
            };

            switch (place) {
              case 1:
                placeClass = styles.firstPlace;
                placeText = `1${getOrdinalSuffix(1)} Place`;
                break;
              case 2:
                placeClass = styles.secondPlace;
                placeText = `2${getOrdinalSuffix(2)} Place`;
                break;
              case 3:
                placeClass = styles.thirdPlace;
                placeText = `3${getOrdinalSuffix(3)} Place`;
                break;
              default: // Should not happen with filter, but good practice
                placeClass = "";
                placeText = `${place}${getOrdinalSuffix(place)} Place`;
            }

            return (
              <div
                key={photo.id}
                className={`${styles.podiumPlace} ${placeClass}`}
              >
                <div
                  className={styles.podiumImage}
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <img
                    src={photo.thumbnailUrl}
                    alt={`${placeText} - ${photo.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={styles.placeBadge}>{placeText}</div>
                <div className={styles.photoTitle}>{photo.title}</div>
                <div className={styles.photographerName}>
                  by{" "}
                  <Link
                    to={`/users/${photo.userId}`}
                    className="text-indigo-300 hover:text-indigo-200 underline"
                  >
                    {photo.User?.nickname || "Unknown"}
                  </Link>
                </div>
                <div className={styles.voteCount}>
                  {photo.averageRating ? photo.averageRating.toFixed(1) : "0.0"}
                  /5 ⭐ ({photo.voteCount || 0} vote
                  {photo.voteCount !== 1 ? "s" : ""})
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <UnifiedLightbox
        photos={podiumWinners}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
        config={LightboxConfigs.contestResults}
      />
    </>
  );
}
