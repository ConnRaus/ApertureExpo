import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { useContestService } from "../../hooks";
import { LoadingSpinner } from "../common/CommonComponents";
import styles from "../../styles/components/RecentWinners.module.css";

export function RecentWinners() {
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const contestService = useContestService();

  useEffect(() => {
    const fetchRecentWinners = async () => {
      try {
        setIsLoading(true);
        // Get completed contests
        const allContests = await contestService.fetchContests();
        const completedContests = allContests.filter(
          (contest) =>
            contest.phase === "ended" || contest.status === "completed"
        );

        console.log(`Found ${completedContests.length} completed contests`);
        if (completedContests.length === 0) {
          setWinners([]);
          setIsLoading(false);
          return;
        }

        // Sort by most recently ended
        completedContests.sort(
          (a, b) => new Date(b.votingEndDate) - new Date(a.votingEndDate)
        );

        // Take the 3 most recent contests
        const recentContests = completedContests.slice(0, 3);

        if (recentContests.length === 0) {
          setWinners([]);
          setIsLoading(false);
          return;
        }

        // Get top 3 photos from each contest
        const winnerPromises = recentContests.map(async (contest) => {
          try {
            const topPhotos = await contestService.fetchTopPhotos(
              contest.id,
              3
            );

            return {
              contest,
              winners: Array.isArray(topPhotos) ? topPhotos : [],
            };
          } catch (error) {
            console.error(
              `Error fetching winners for contest ${contest.id}:`,
              error
            );
            return {
              contest,
              winners: [],
            };
          }
        });

        const contestWinners = await Promise.all(winnerPromises);

        // We'll show contests even if photos have 0 votes
        const validWinners = contestWinners.filter(
          (cw) => cw.winners && cw.winners.length > 0
        );

        // Create a flattened list of all winning photos with contest info
        const allWinningPhotos = [];
        validWinners.forEach((cw) => {
          // Explicitly sort the winners array by totalScore descending
          const sortedWinners = [...cw.winners].sort((a, b) => {
            const scoreA = a.totalScore ?? -Infinity;
            const scoreB = b.totalScore ?? -Infinity;
            return scoreB - scoreA;
          });

          let currentRank = 0;
          let lastScore = Infinity; // Start higher than any possible score
          // Iterate through the sorted winners to assign ranks, handling ties
          sortedWinners.forEach((photo, index) => {
            // Only increment rank if score is lower than the previous photo's score
            // Check against null/undefined scores as well
            const currentScore = photo.totalScore ?? -Infinity;
            if (currentScore < lastScore) {
              currentRank = index + 1; // Use index+1 for rank when score decreases
            }

            allWinningPhotos.push({
              ...photo,
              contestTitle: cw.contest.title,
              contestId: cw.contest.id,
              rank: currentRank, // Assign the calculated rank (handles ties)
            });
            lastScore = currentScore; // Update last score for the next iteration
          });
        });

        setWinners(allWinningPhotos);
      } catch (error) {
        console.error("Error fetching recent winners:", error);
        setError("Failed to load recent winners");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentWinners();
  }, []);

  // Create a URL-friendly slug from contest title
  const createSlug = (title) => {
    return encodeURIComponent(
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const openPhotoModal = (photo, index) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
  };

  const closePhotoModal = useCallback(() => {
    setSelectedPhoto(null);
    setCurrentIndex(null);
  }, []);

  const showNextPhoto = useCallback(
    (e) => {
      e.stopPropagation();
      if (winners.length === 0) return;
      const nextIndex = (currentIndex + 1) % winners.length;
      setSelectedPhoto(winners[nextIndex]);
      setCurrentIndex(nextIndex);
    },
    [currentIndex, winners]
  );

  const showPreviousPhoto = useCallback(
    (e) => {
      e.stopPropagation();
      if (winners.length === 0) return;
      const prevIndex = (currentIndex - 1 + winners.length) % winners.length;
      setSelectedPhoto(winners[prevIndex]);
      setCurrentIndex(prevIndex);
    },
    [currentIndex, winners]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedPhoto) {
        if (event.key === "ArrowRight") {
          showNextPhoto(event);
        }
        if (event.key === "ArrowLeft") {
          showPreviousPhoto(event);
        }
        if (event.key === "Escape") {
          closePhotoModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto, showNextPhoto, showPreviousPhoto, closePhotoModal]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => showNextPhoto(eventData.event),
    onSwipedRight: (eventData) => showPreviousPhoto(eventData.event),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
  });

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading recent winners..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Always show the section header, even if there are no winners yet
  return (
    <div className={styles.recentWinners}>
      {winners.length > 0 ? (
        <>
          <div className={styles.scrollContainer}>
            {winners.map((photo, index) => (
              <div
                key={photo.id}
                className={styles.winnerCard}
                onClick={() => openPhotoModal(photo, index)}
              >
                <div className={styles.rank}>#{photo.rank}</div>
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  className={styles.thumbnail}
                />
                <div className={styles.photoInfo}>
                  <h4 className={styles.photoTitle}>{photo.title}</h4>
                  <p className={styles.photographer}>
                    by{" "}
                    <Link
                      to={`/users/${photo.userId}`}
                      className={styles.userLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {photo.User?.nickname || "Anonymous"}
                    </Link>
                  </p>
                  <p className={styles.contestInfo}>
                    <Link
                      to={`/events/${createSlug(photo.contestTitle)}-${
                        photo.contestId
                      }`}
                      className={styles.contestLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {photo.contestTitle}
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedPhoto && (
            <div className={styles.modal} onClick={closePhotoModal}>
              <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
                {...swipeHandlers}
              >
                <span className={styles.closeButton} onClick={closePhotoModal}>
                  &times;
                </span>
                <div className={styles.modalImageWrapper}>
                  {winners.length > 1 && (
                    <>
                      <button
                        className={`${styles.navButton} ${styles.prevButton}`}
                        onClick={showPreviousPhoto}
                        aria-label="Previous Winner"
                      >
                        &#10094;
                      </button>
                      <button
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={showNextPhoto}
                        aria-label="Next Winner"
                      >
                        &#10095;
                      </button>
                    </>
                  )}
                  <img
                    src={selectedPhoto.s3Url || selectedPhoto.thumbnailUrl}
                    alt={selectedPhoto.title}
                    className={styles.modalImage}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                <div className={styles.modalInfo}>
                  <h3>{selectedPhoto.title}</h3>
                  <p>
                    by{" "}
                    <Link to={`/users/${selectedPhoto.userId}`}>
                      {selectedPhoto.User?.nickname || "Anonymous"}
                    </Link>
                  </p>
                  <p>
                    From contest:{" "}
                    <Link
                      to={`/events/${createSlug(selectedPhoto.contestTitle)}-${
                        selectedPhoto.contestId
                      }`}
                    >
                      {selectedPhoto.contestTitle}
                    </Link>
                  </p>
                  {selectedPhoto.totalScore > 0 && (
                    <p>Score: {Number(selectedPhoto.totalScore).toFixed(1)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noWinners}>
          <p>
            No contest winners to display yet. Check back after contests have
            completed!
          </p>
        </div>
      )}
    </div>
  );
}
