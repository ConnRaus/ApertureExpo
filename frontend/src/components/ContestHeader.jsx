import React from "react";
import styles from "../styles/components/Contest.module.css";

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
  return (
    <div className={styles.bannerSection}>
      <img src={bannerImageUrl || defaultBanner} alt={title} />
      <div className={styles.bannerOverlay} />
      <div className={styles.contestHeader}>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.contestMeta}>
          <span className={styles.statusBadge}>{status}</span>
          <span className={styles.dateRange}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
