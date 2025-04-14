import React from "react";
import styles from "../../styles/components/Contest.module.css";
import { CountdownTimer } from "../common/CountdownTimer";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function ContestHeader({
  title,
  description,
  status,
  startDate,
  endDate,
  bannerImageUrl,
  defaultBanner = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
}) {
  // Get status text and class
  let statusText;
  let statusClass;

  switch (status) {
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
      statusText = status || "Unknown";
      statusClass = "";
  }

  return (
    <div className={styles.bannerSection}>
      <img src={bannerImageUrl || defaultBanner} alt={title} />
      <div className={styles.bannerOverlay} />
      <div className={styles.contestHeader}>
        <h1 title={title}>{title}</h1>
        <p title={description}>{description}</p>
        <div className={styles.contestMeta}>
          <div className={styles.statusBadgeContainer}>
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {statusText}
            </span>
            <span className={styles.dateRange}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>

          {/* Add countdown timer based on status (only for active and upcoming contests) */}
          {status !== "ended" && (
            <div className={styles.countdownTimer}>
              {status === "active" ? (
                <>
                  <span className={styles.countdownLabel}>Ends in: </span>
                  <CountdownTimer
                    targetDate={endDate}
                    type="countdown"
                    className={styles.countdownText}
                  />
                </>
              ) : (
                <>
                  <span className={styles.countdownLabel}>Starts in: </span>
                  <CountdownTimer
                    targetDate={startDate}
                    type="countdown"
                    className={styles.countdownText}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
