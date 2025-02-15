import React from "react";
import { EventList } from "../components/ContestComponents";

function EventsPage() {
  return (
    <div className="events-page">
      <h1>Photo Contests</h1>
      <EventList />
    </div>
  );
}

export default EventsPage;
