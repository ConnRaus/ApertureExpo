import React, { useState } from "react";
import { EventList } from "../components/contests/ContestComponents";
import forumStyles from "../styles/components/Forum.module.css";
import styles from "../styles/pages/EventsPage.module.css";

function EventsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filters = [
    { value: "all", label: "All Contests" },
    { value: "active", label: "Active" },
    { value: "voting", label: "Voting" },
    { value: "coming soon", label: "Coming Soon" },
    { value: "ended", label: "Ended" },
  ];

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
  };

  return (
    <div className={styles.eventsPage}>
      <div className={styles.heroBanner}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Photography Events</h1>
            <p className={styles.subtitle}>Discover and join exciting photography contests and challenges</p>
          </div>
        </div>
      </div>

      <div className={forumStyles.categoryFilter}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`${forumStyles.categoryPill} ${
              selectedFilter === filter.value ? forumStyles.categoryPillActive : ""
            }`}
            onClick={() => handleFilterSelect(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <EventList selectedFilter={selectedFilter} />
    </div>
  );
}

export default EventsPage;
