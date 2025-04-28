import React from "react";
import styles from "../../styles/components/Contest.module.css";
import { Link } from "react-router-dom";

export function ContestResults({ photos, contestId }) {
  // Sort photos by votes (totalScore or voteCount)
  const sortedPhotos = [...photos].sort((a, b) => {
    return (
      (b.totalScore || 0) - (a.totalScore || 0) ||
      (b.voteCount || 0) - (a.voteCount || 0)
    );
  });

  // Get top 3 photos
  const winners = sortedPhotos.slice(0, 3);

  // If there are no photos or votes, show a message
  if (!winners.length) {
    return (
      <div className={styles.resultsContainer}>
        <h2 className={styles.resultsTitle}>Contest Results</h2>
        <p className="text-center text-gray-400">
          No photos were submitted to this contest.
        </p>
      </div>
    );
  }

  if (!winners[0].voteCount && !winners[0].totalScore) {
    return (
      <div className={styles.resultsContainer}>
        <h2 className={styles.resultsTitle}>Contest Results</h2>
        <p className="text-center text-gray-400">
          No votes were cast in this contest.
        </p>
      </div>
    );
  }

  // Create the podium display
  return (
    <div className={styles.resultsContainer}>
      <h2 className={styles.resultsTitle}>Contest Winners</h2>

      <div className={styles.podiumContainer}>
        {winners.map((photo, index) => {
          const place = index + 1;
          let placeClass;
          let placeText;

          switch (place) {
            case 1:
              placeClass = styles.firstPlace;
              placeText = "1st Place";
              break;
            case 2:
              placeClass = styles.secondPlace;
              placeText = "2nd Place";
              break;
            case 3:
              placeClass = styles.thirdPlace;
              placeText = "3rd Place";
              break;
            default:
              placeClass = "";
              placeText = `${place}th Place`;
          }

          return (
            <div
              key={photo.id}
              className={`${styles.podiumPlace} ${placeClass}`}
            >
              <div className={styles.podiumImage}>
                <img
                  src={photo.thumbnailUrl}
                  alt={`${place} place - ${photo.title}`}
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
                {photo.voteCount || 0} votes (
                {photo.averageRating ? photo.averageRating.toFixed(1) : 0} avg)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
