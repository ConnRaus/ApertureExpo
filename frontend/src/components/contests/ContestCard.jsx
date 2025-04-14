import React from "react";
import styles from "../../styles/components/Contest.module.css";
import { CountdownTimer } from "../common/CountdownTimer";

export function ContestCard({ contest, onClick }) {
  const defaultBanner =
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60";

  // Get status text and class
  let statusText;
  let statusClass;

  switch (contest.status) {
    case "active":
      statusText = "Active";
      statusClass = styles.statusActive;
      break;
    case "upcoming":
      statusText = "Coming Soon";
      statusClass = styles.statusUpcoming;
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
          {contest.status === "active" && (
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
          {contest.status === "upcoming" && (
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
