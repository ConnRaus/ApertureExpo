import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "./ContestCard";
import { useContestService, useDelayedLoading } from "../../hooks";
import { LoadingSpinner } from "../common/CommonComponents";

export function EventList({ showAllTypes = true, selectedFilter = "all" }) {
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

  // Create a URL-friendly slug from contest title
  const createSlug = (title) => {
    return encodeURIComponent(
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  // Navigate to contest with slug + ID format
  const navigateToContest = (contest) => {
    const slug = createSlug(contest.title);
    navigate(`/events/${slug}-${contest.id}`);
  };

  const fetchContests = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await contestService.fetchContests();
      setContests(data || []);

      // Group contests by phase
      const active = data.filter(
        (contest) => contest.phase === "submission" || contest.status === "open"
      );
      const upcoming = data.filter(
        (contest) =>
          contest.phase === "upcoming" || contest.status === "upcoming"
      );
      const voting = data.filter(
        (contest) => contest.phase === "voting" || contest.status === "voting"
      );
      const ended = data.filter(
        (contest) =>
          ["processing", "ended"].includes(contest.phase) ||
          contest.status === "completed"
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
      <div className="mt-2">
        <LoadingSpinner size="lg" message="Loading contests..." />
      </div>
    );
  }

  // If we're loading but not showing the loading state yet, render nothing or a minimal placeholder
  if (isLoading) {
    return <div className="mt-2"></div>;
  }

  // Check if there are no contests at all
  if (contests.length === 0) {
    return (
      <div className="mt-2">
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
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 auto-rows-fr">
          {contestList.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={() => navigateToContest(contest)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Helper function to get filtered contests based on selectedFilter
  const getFilteredContests = () => {
    switch (selectedFilter) {
      case "active":
        return activeContests;
      case "voting":
        return votingContests;
      case "coming soon":
        return upcomingContests;
      case "ended":
        return endedContests;
      case "all":
      default:
        return null; // Show all sections
    }
  };

  // If we're only showing active contests (e.g., on the home page)
  if (!showAllTypes) {
    // For homepage, show both active and voting contests
    const displayContests = [...activeContests, ...votingContests];

    if (displayContests.length === 0) {
      return (
        <div className="mt-2">
          <p>No active contests at the moment. Check back later!</p>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 auto-rows-fr">
          {displayContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={() => navigateToContest(contest)}
            />
          ))}
        </div>
      </div>
    );
  }

  // If a specific filter is selected (not "all"), show only those contests
  const filteredContests = getFilteredContests();
  if (filteredContests !== null) {
    if (filteredContests.length === 0) {
      const filterLabels = {
        active: "active contests",
        voting: "contests in voting phase",
        "coming soon": "upcoming contests",
        ended: "past contests",
      };
      return (
        <div className="mt-2">
          <p>
            No {filterLabels[selectedFilter]} at the moment. Check back later!
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 auto-rows-fr">
          {filteredContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={() => navigateToContest(contest)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Otherwise show all sections (when filter is "all")
  return (
    <div className="mt-2">
      {renderContestSection(
        "Voting Open",
        votingContests,
        "No contests currently in voting phase."
      )}
      {renderContestSection(
        "Active Submissions",
        activeContests,
        "No active contests at the moment."
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
