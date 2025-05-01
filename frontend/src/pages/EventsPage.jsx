import React from "react";
import { EventList } from "../components/contests/ContestComponents";

function EventsPage() {
  return (
    <div className="events-page">
      <h1>Aperture Expo</h1>
      <EventList />
    </div>
  );
}

export default EventsPage;
