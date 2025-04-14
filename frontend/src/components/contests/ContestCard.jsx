import React from "react";
import styles from "../../styles/components/Contest.module.css";
import { CountdownTimer } from "../common/CountdownTimer";

export function ContestCard({ contest, onClick }) {
  const defaultBanner =
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60";

  // Get status text and class based on phase instead of status
  let statusText;
  let statusClass;

  // Use phase which is calculated on the fly in the backend
  switch (contest.phase) {
    case "submission":
      statusText = "Active";
      statusClass = styles.statusActive;
      break;
    case "upcoming":
      statusText = "Coming Soon";
      statusClass = styles.statusUpcoming;
      break;
    case "processing":
      statusText = "Processing";
      statusClass = styles.statusProcessing;
      break;
    case "voting":
      statusText = "Voting Open";
      statusClass = styles.statusVoting;
      break;
    case "ended":
      statusText = "Ended";
      statusClass = styles.statusEnded;
      break;
    default:
      statusText = contest.status || "Unknown";
      statusClass = "";
  }

  return (
    <div className={styles.contestCard} onClick={onClick}>
      <div className="relative">
        <img
          src={contest.bannerImageUrl || defaultBanner}
          alt={contest.title}
          className={styles.bannerImage}
        />
        <div className={styles.badgeContainer}>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {statusText}
          </span>

          {/* Countdown timer next to status badge */}
          {contest.phase === "submission" && (
            <span
              className={styles.headerCountdown}
              title={`Contest ends on ${new Date(
                contest.endDate
              ).toLocaleString()}`}
            >
              <CountdownTimer
                targetDate={contest.endDate}
                type="countdown"
                compact={true}
                className={styles.headerCountdownText}
              />
            </span>
          )}
          {contest.phase === "upcoming" && (
            <span
              className={styles.headerCountdown}
              title={`Contest starts on ${new Date(
                contest.startDate
              ).toLocaleString()}`}
            >
              <CountdownTimer
                targetDate={contest.startDate}
                type="countdown"
                compact={true}
                className={styles.headerCountdownText}
              />
            </span>
          )}
          {contest.phase === "voting" && (
            <span
              className={styles.headerCountdown}
              title={`Voting ends on ${new Date(
                contest.votingEndDate
              ).toLocaleString()}`}
            >
              <CountdownTimer
                targetDate={contest.votingEndDate}
                type="countdown"
                compact={true}
                className={styles.headerCountdownText}
              />
            </span>
          )}
        </div>
      </div>
      <div className={styles.contestInfo}>
        <h3 title={contest.title}>{contest.title}</h3>
        <p title={contest.description}>{contest.description}</p>

        <p className={styles.submissionCount}>
          {contest.Photos?.length || 0} submissions
        </p>
      </div>
    </div>
  );
}
