import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "./ContestCard";
import { useContestService, useDelayedLoading } from "../../hooks";
import { LoadingSpinner } from "../common/CommonComponents";

export function EventList({ showAllTypes = true }) {
  const [contests, setContests] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const contestService = useContestService();

  // Separate contests by phase
  const [activeContests, setActiveContests] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [votingContests, setVotingContests] = useState([]);
  const [endedContests, setEndedContests] = useState([]);

  // Use our delayed loading hook to prevent flashing on fast connections
  const shouldShowLoading = useDelayedLoading(isLoading);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchContests();

    // Set up periodic refresh every minute to check for phase changes
    const refreshInterval = setInterval(() => {
      fetchContests(false); // Pass false to not show loading state during refresh
    }, 60000); // Every minute

    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchContests = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await contestService.fetchContests();
      setContests(data || []);

      // Group contests by phase
      const active = data.filter((contest) => contest.phase === "submission");
      const upcoming = data.filter((contest) => contest.phase === "upcoming");
      const voting = data.filter((contest) => contest.phase === "voting");
      const ended = data.filter((contest) =>
        ["processing", "ended"].includes(contest.phase)
      );

      setActiveContests(active);
      setUpcomingContests(upcoming);
      setVotingContests(voting);
      setEndedContests(ended);
    } catch (error) {
      console.error("Error fetching contests:", error);
      setError("Failed to load contests");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Only show loading state if shouldShowLoading is true
  if (shouldShowLoading) {
    return (
      <div className="mt-8">
        <LoadingSpinner size="lg" message="Loading contests..." />
      </div>
    );
  }

  // If we're loading but not showing the loading state yet, render nothing or a minimal placeholder
  if (isLoading) {
    return <div className="mt-8"></div>; // Empty container to maintain layout
  }

  // Check if there are no contests at all
  if (contests.length === 0) {
    return (
      <div className="mt-8">
        <p>No contests available at the moment. Check back later!</p>
      </div>
    );
  }

  // Function to render a section of contests
  const renderContestSection = (title, contestList, emptyMessage) => {
    if (!contestList || contestList.length === 0) {
      return null;
    }

    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {contestList.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={() => navigate(`/events/${contest.id}`)}
            />
          ))}
        </div>
      </div>
    );
  };

  // If we're only showing active contests (e.g., on the home page)
  if (!showAllTypes) {
    // For homepage, show both active and voting contests
    const displayContests = [...activeContests, ...votingContests];

    if (displayContests.length === 0) {
      return (
        <div className="mt-8">
          <p>No active contests at the moment. Check back later!</p>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {displayContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={() => navigate(`/events/${contest.id}`)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Otherwise show all sections
  return (
    <div className="mt-8">
      {renderContestSection(
        "Active Contests",
        activeContests,
        "No active contests at the moment."
      )}
      {renderContestSection(
        "Voting Open",
        votingContests,
        "No contests currently in voting phase."
      )}
      {renderContestSection(
        "Coming Soon",
        upcomingContests,
        "No upcoming contests at the moment."
      )}
      {renderContestSection(
        "Past Contests",
        endedContests,
        "No past contests at the moment."
      )}
    </div>
  );
}
