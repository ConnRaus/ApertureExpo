import React from "react";
import { EventList } from "../components/contests/ContestComponents";
import { RecentWinners } from "../components/contests/RecentWinners";
import styles from "../styles/pages/HomePage.module.css";

function HomePage() {
  return (
    <div className={styles.homePage}>
      <div className={styles.welcomeSection}>
        <h1>Aperture Expo</h1>
        <h2>Welcome to Aperture Expo!</h2>
        <p>
          Join exciting photo contests and showcase your photography skills!
        </p>
      </div>
      <h2>Recent Winners</h2>
      <RecentWinners />
      <h2>Active Contests</h2>
      <EventList showAllTypes={false} />
    </div>
  );
}

export default HomePage;
