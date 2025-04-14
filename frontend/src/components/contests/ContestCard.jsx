import React from "react";
import styles from "../../styles/components/Contest.module.css";

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
        <span
          className={`absolute top-2 right-2 ${styles.statusBadge} ${statusClass}`}
        >
          {statusText}
        </span>
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
