import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "./ContestCard";
import { useContestService } from "../hooks/useServices";
import "../styles/loading.css";

export function EventList() {
  const [contests, setContests] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const contestService = useContestService();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    setIsLoading(true);
    try {
      const data = await contestService.fetchContests();
      setContests(data || []);
    } catch (error) {
      console.error("Error fetching contests:", error);
      setError("Failed to load contests");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="contest-card-skeleton">
              <div className="banner-skeleton"></div>
              <div className="content-skeleton">
                <div className="title-skeleton"></div>
                <div className="text-skeleton"></div>
                <div
                  className="text-skeleton"
                  style={{ width: "100px", marginTop: "12px" }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
