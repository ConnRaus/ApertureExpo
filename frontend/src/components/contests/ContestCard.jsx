import React from "react";
import styles from "../../styles/components/Contest.module.css";

export function ContestCard({ contest, onClick }) {
  const defaultBanner =
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60";

  return (
    <div className={styles.contestCard} onClick={onClick}>
      <img
        src={contest.bannerImageUrl || defaultBanner}
        alt={contest.title}
        className={styles.bannerImage}
      />
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
