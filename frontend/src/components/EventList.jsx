import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "./ContestCard";
import { useContestService } from "../hooks/useServices";

export function EventList() {
  const [contests, setContests] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const contestService = useContestService();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const data = await contestService.fetchContests();
      setContests(data || []);
    } catch (error) {
      console.error("Error fetching contests:", error);
      setError("Failed to load contests");
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.length === 0 ? (
          <p>No active contests at the moment. Check back later!</p>
        ) : (
          contests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={() => navigate(`/events/${contest.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
