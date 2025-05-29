import React, { useState } from "react";
import { EventList } from "../components/contests/ContestComponents";
import styles from "../styles/components/Forum.module.css";

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
    <div className="events-page">
      <div className={styles.forumHeader}>
        <h1>Photography Events</h1>
      </div>

      <div className={styles.categoryFilter}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`${styles.categoryPill} ${
              selectedFilter === filter.value ? styles.categoryPillActive : ""
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
