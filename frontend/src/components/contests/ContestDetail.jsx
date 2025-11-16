import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useContestService, useVoteService } from "../../hooks";
import styles from "../../styles/components/Contest.module.css";
import { ContestHeader } from "./ContestHeader";
import { ContestSubmissions } from "./ContestSubmissions";
import { ContestPodium } from "./ContestPodium";
import { UploadForm } from "../user/UploadForm";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";

export function ContestDetail(props) {
  // Accept contestId as prop or extract from URL params
  let contestId = props.contestId;
  if (!contestId) {
    // If not passed as prop, get from URL params
    const { slugAndId } = useParams();
    // Extract the UUID from the slugAndId using regex
    const uuidMatch = slugAndId.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    contestId = uuidMatch ? uuidMatch[0] : slugAndId;
  }

  // Get page from URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");

  const [contest, setContest] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(
    props.showUploadForm || false
  );
  const contestService = useContestService();
  const voteService = useVoteService();
  const { user, isLoaded: userLoaded } = useUser();
  const previousPhaseRef = useRef(null);
  const phaseTransitionTimersRef = useRef([]);
  const [userVotesMap, setUserVotesMap] = useState({});

  useEffect(() => {
    fetchContestDetails(true, currentPage);

    // Set up periodic refresh every 30 seconds as a fallback
    const refreshInterval = setInterval(() => {
      fetchContestDetails(false, currentPage);
    }, 30000);

    // Clean up interval and timers on unmount
    return () => {
      clearInterval(refreshInterval);
      phaseTransitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, [contestId, currentPage]);

  // Fetch all user votes for this contest once and cache them in a map
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user || !contestId) {
        setUserVotesMap({});
        return;
      }

      try {
        const userVotes = await voteService.getUserVotes(contestId);
        const votesMap = {};
        userVotes.forEach((vote) => {
          if (vote.photoId && typeof vote.value === "number") {
            votesMap[vote.photoId] = vote.value;
          }
        });
        setUserVotesMap(votesMap);
      } catch (err) {
        console.error("Failed to fetch user votes for contest:", err);
        // Don't block the rest of the page if this fails
      }
    };

    fetchUserVotes();
  }, [user, contestId, voteService]);

  // Effect to fetch winners separately when contest ends
  useEffect(() => {
    if (contest?.phase === "ended") {
      fetchWinners();
    }
  }, [contest?.phase, contestId]);

  // Helper function to schedule precise refreshes at phase transition times
  const schedulePhaseTransitionRefreshes = (contestData) => {
    // Clear any existing timers
    phaseTransitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    phaseTransitionTimersRef.current = [];

    if (!contestData) return;

    const now = new Date().getTime();
    const transitions = [
      {
        time: new Date(contestData.startDate).getTime(),
        label: "submission start",
      },
      {
        time: new Date(contestData.endDate).getTime(),
        label: "submission end",
      },
      {
        time: new Date(contestData.votingStartDate).getTime(),
        label: "voting start",
      },
      {
        time: new Date(contestData.votingEndDate).getTime(),
        label: "voting end",
      },
    ];

    // Schedule a refresh for each upcoming transition
    transitions.forEach((transition) => {
      const timeUntilTransition = transition.time - now;

      // Only schedule if the transition is in the future and within 24 hours
      if (
        timeUntilTransition > 0 &&
        timeUntilTransition < 24 * 60 * 60 * 1000
      ) {
        // Add 2 seconds buffer to ensure the backend has updated the phase
        const timer = setTimeout(() => {
          console.log(`Executing scheduled refresh for ${transition.label}`);
          fetchContestDetails(false, currentPage).then(() => {
            // Force page reload 1 second after the fetch to ensure we get the new state
            setTimeout(() => window.location.reload(), 1000);
          });
        }, timeUntilTransition + 2000);

        phaseTransitionTimersRef.current.push(timer);
      }
    });
  };

  const fetchContestDetails = async (showLoading = true, page = 1) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await contestService.fetchContestDetails(contestId, page);

      // Check for status/phase changes and force reload
      if (contest && previousPhaseRef.current) {
        const oldPhase = previousPhaseRef.current;
        const newPhase = data.phase;

        // Detect specific phase transitions that need immediate refresh
        const needsRefresh =
          (oldPhase === "upcoming" && newPhase === "submission") ||
          (oldPhase === "submission" && newPhase === "processing") ||
          (oldPhase === "submission" && newPhase === "voting") ||
          (oldPhase === "processing" && newPhase === "voting") ||
          (oldPhase === "voting" && newPhase === "ended");

        if (needsRefresh) {
          console.log(
            `Contest phase changed from ${oldPhase} to ${newPhase}. Reloading page...`
          );
          window.location.reload();
          return;
        }
      }

      // Store the current phase for future comparison
      if (data) {
        previousPhaseRef.current = data.phase;

        // Schedule precise refreshes at phase transition times
        schedulePhaseTransitionRefreshes(data);
      }

      setContest(data);
    } catch (error) {
      console.error("Failed to fetch contest details:", error);
      setError("Failed to load contest details");
      toast.error("Failed to load contest details");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Fetch top photos for the results podium
  const fetchWinners = async () => {
    try {
      // Fetch top 5 to better handle ties for 3rd place later
      const topPhotos = await contestService.fetchTopPhotos(contestId, 5);
      setWinners(topPhotos || []);
    } catch (error) {
      console.error("Failed to fetch contest winners:", error);
      // Don't necessarily show error toast here, main content still loads
      setWinners([]); // Ensure winners is an empty array on error
    }
  };

  // Handle page change for submissions pagination
  const handlePageChange = (page) => {
    setSearchParams({ page: page.toString() });
  };

  // Keep a single source of truth for the user's vote per photo in this contest
  const handleUserVoteChange = (photoId, value) => {
    setUserVotesMap((prev) => ({
      ...prev,
      [photoId]: value,
    }));
  };

  // Calculate user's submission count (using the count provided by the API)
  const userSubmissionCount = contest?.userSubmissionCount ?? 0;

  // Check if user has reached the submission limit
  const maxPhotosPerUser = contest?.maxPhotosPerUser;
  const limitReached =
    maxPhotosPerUser !== null && userSubmissionCount >= maxPhotosPerUser;

  if (loading && !contest) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-400">{error || "Contest not found"}</p>
      </div>
    );
  }

  const renderPhaseSpecificContent = () => {
    const limitText =
      maxPhotosPerUser !== null
        ? ` (${userSubmissionCount} of ${maxPhotosPerUser} submitted)`
        : "";

    switch (contest.phase) {
      case "upcoming":
        return (
          <div className="text-center p-3 bg-indigo-900/30 rounded-lg">
            <p>
              This contest hasn't started yet. Check back on{" "}
              {new Date(contest.startDate).toLocaleDateString()}!
            </p>
          </div>
        );

      case "submission":
        if (!user) {
          return (
            <div className="text-center p-3 bg-blue-900/30 rounded-lg">
              <p>Sign in to participate in this contest!</p>
            </div>
          );
        } else if (limitReached) {
          return (
            <div className="text-center p-3 bg-yellow-900/30 rounded-lg">
              <p>You have reached the submission limit{limitText}.</p>
            </div>
          );
        } else if (showUploadForm) {
          return (
            <UploadForm
              contestId={contestId}
              onUploadSuccess={() => {
                setShowUploadForm(false);
                fetchContestDetails();
              }}
            />
          );
        } else {
          return (
            <div className="flex flex-col items-center">
              <button
                className="submit-button contest-submit-photo mb-2"
                onClick={() => setShowUploadForm(true)}
              >
                Submit a Photo
              </button>
              {maxPhotosPerUser !== null && (
                <p className="text-sm text-gray-400">
                  You can submit up to {maxPhotosPerUser} photos.
                  {limitText}
                </p>
              )}
            </div>
          );
        }

      case "processing":
        return (
          <div className="text-center p-3 bg-yellow-900/30 rounded-lg">
            <p>
              The submission period has ended. Voting begins on{" "}
              {new Date(contest.votingStartDate).toLocaleDateString()}!
            </p>
          </div>
        );

      case "voting":
        return (
          <div className="text-center p-3 bg-green-900/30 rounded-lg">
            <p>
              Voting is open! Cast your votes for your favorite photos. Voting
              ends on {new Date(contest.votingEndDate).toLocaleDateString()}.
            </p>
          </div>
        );

      case "ended":
        return (
          <div className="text-center p-3 bg-gray-900/30 rounded-lg">
            <p>This contest has ended. Results are displayed below.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.contestDetail}>
      <ContestHeader
        title={contest.title}
        description={contest.description}
        status={contest.status}
        phase={contest.phase}
        startDate={contest.startDate}
        endDate={contest.endDate}
        votingStartDate={contest.votingStartDate}
        votingEndDate={contest.votingEndDate}
        bannerImageUrl={contest.bannerImageUrl}
      />

      <div className="mb-8">{renderPhaseSpecificContent()}</div>

      {contest.phase === "ended" && winners.length > 0 && (
        <div className="mb-8">
          <ContestPodium photos={winners} contestId={contestId} />
        </div>
      )}

      <ContestSubmissions
        photos={contest.Photos || []}
        contestId={contestId}
        contestPhase={contest.phase}
        pagination={contest.pagination}
        onPageChange={handlePageChange}
        userVotesMap={userVotesMap}
        onUserVoteChange={handleUserVoteChange}
      />
    </div>
  );
}
