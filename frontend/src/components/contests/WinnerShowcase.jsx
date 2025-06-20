import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useContestService } from "../../hooks";
import { LoadingSpinner } from "../common/CommonComponents";
import { Lightbox, LightboxConfigs } from "../photos/PhotoComponents";
import styles from "../../styles/components/WinnerShowcase.module.css";

export function WinnerShowcase() {
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
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

        if (completedContests.length === 0) {
          setWinners([]);
          setIsLoading(false);
          return;
        }

        // First, filter for contests that have photos
        const contestsWithPhotos = completedContests.filter(
          (contest) => contest.submissionCount > 0
        );

        if (contestsWithPhotos.length === 0) {
          setWinners([]);
          setIsLoading(false);
          return;
        }

        // Sort by most recently ended among contests that have photos
        contestsWithPhotos.sort(
          (a, b) => new Date(b.votingEndDate) - new Date(a.votingEndDate)
        );

        // Take up to 3 most recent contests that have photos
        const recentContests = contestsWithPhotos.slice(0, 3);

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

  const openPhotoModal = (index) => {
    setSelectedPhotoIndex(index);
  };

  // Get rank display (medal emoji for top 3, number for others)
  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  // Get CSS class for rank background
  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return `${styles.rank} ${styles.firstPlace}`;
      case 2:
        return `${styles.rank} ${styles.secondPlace}`;
      case 3:
        return `${styles.rank} ${styles.thirdPlace}`;
      default:
        return styles.rank;
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading winner showcase..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Always show the section header, even if there are no winners yet
  return (
    <div className={styles.winnerShowcase}>
      {winners.length > 0 ? (
        <>
          <div className={styles.scrollContainer}>
            {winners.map((photo, index) => (
              <div
                key={photo.id}
                className={styles.winnerCard}
                onClick={() => openPhotoModal(index)}
              >
                <div className={getRankClass(photo.rank)}>
                  {getRankDisplay(photo.rank)}
                </div>
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

          <Lightbox
            photos={winners}
            selectedIndex={selectedPhotoIndex}
            onClose={() => setSelectedPhotoIndex(-1)}
            config={LightboxConfigs.winnerShowcase}
          />
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
