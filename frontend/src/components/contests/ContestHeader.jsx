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
  phase = "submission",
  startDate,
  endDate,
  votingStartDate,
  votingEndDate,
  bannerImageUrl,
  defaultBanner = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
}) {
  // Get status text and class based on phase
  let statusText;
  let statusClass;

  switch (phase) {
    case "upcoming":
      statusText = "Coming Soon";
      statusClass = styles.statusUpcoming;
      break;
    case "submission":
      statusText = "Accepting Submissions";
      statusClass = styles.statusActive;
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
      // Fallback to status if phase is not available
      switch (status) {
        case "open":
          statusText = "Accepting Submissions";
          statusClass = styles.statusActive;
          break;
        case "upcoming":
          statusText = "Coming Soon";
          statusClass = styles.statusUpcoming;
          break;
        case "voting":
          statusText = "Voting Open";
          statusClass = styles.statusVoting;
          break;
        case "completed":
          statusText = "Ended";
          statusClass = styles.statusEnded;
          break;
        default:
          statusText = status || "Unknown";
          statusClass = "";
      }
  }

  // Determine which dates and countdown to show based on phase
  const getPhaseInfo = () => {
    let dateString;
    let targetDate;
    let countdownLabel;

    switch (phase) {
      case "upcoming":
        dateString = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        targetDate = startDate;
        countdownLabel = "Starts in: ";
        break;
      case "submission":
        dateString = `Submissions until: ${formatDate(endDate)}`;
        targetDate = endDate;
        countdownLabel = "Submissions end in: ";
        break;
      case "processing":
        dateString = `Voting: ${formatDate(votingStartDate)} - ${formatDate(
          votingEndDate
        )}`;
        targetDate = votingStartDate;
        countdownLabel = "Voting begins in: ";
        break;
      case "voting":
        dateString = `Voting until: ${formatDate(votingEndDate)}`;
        targetDate = votingEndDate;
        countdownLabel = "Voting ends in: ";
        break;
      case "ended":
        dateString = `Contest ended: ${formatDate(votingEndDate)}`;
        return { dateString };
      default:
        dateString = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    return { dateString, targetDate, countdownLabel };
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className={styles.bannerSection}>
      <img src={bannerImageUrl || defaultBanner} alt={title} />
      <div className={styles.bannerOverlay} />
      <div className={styles.contestHeader}>
        <h1 title={title} className={styles.contestTitle}>
          {title}
        </h1>

        {description && (
          <p title={description} className={styles.contestDescription}>
            {description}
          </p>
        )}

        <div className={styles.contestMeta}>
          <div className={styles.statusBadgeContainer}>
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {statusText}
            </span>
          </div>

          {/* Add countdown timer based on phase */}
          {phase !== "ended" && phaseInfo.targetDate && (
            <div className={styles.countdownTimer}>
              <span className={styles.countdownLabel}>
                {phaseInfo.countdownLabel}
              </span>
              <CountdownTimer
                targetDate={phaseInfo.targetDate}
                type="countdown"
                className={styles.countdownText}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
