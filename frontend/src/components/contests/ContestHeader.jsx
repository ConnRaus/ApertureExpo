import React from "react";
import styles from "../../styles/components/Contest.module.css";

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
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {statusText}
          </span>
          <span className={styles.dateRange}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
