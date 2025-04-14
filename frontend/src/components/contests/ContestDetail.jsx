import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useContestService } from "../../hooks";
import styles from "../../styles/components/Contest.module.css";
import { ContestHeader } from "./ContestHeader";
import { ContestSubmissions } from "./ContestSubmissions";
import { ContestResults } from "./ContestResults";
import { UploadForm } from "../user/UploadForm";
import { toast } from "react-toastify";

export function ContestDetail() {
  const { contestId } = useParams();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const contestService = useContestService();

  useEffect(() => {
    fetchContestDetails();

    // Set up periodic refresh every minute to check for contest phase changes
    const refreshInterval = setInterval(() => {
      fetchContestDetails(false); // Pass false to not show loading state during refresh
    }, 60000); // Every minute

    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [contestId]);

  const fetchContestDetails = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await contestService.fetchContestDetails(contestId);
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
        return !showUploadForm ? (
          <button
            className="submit-button contest-submit-photo"
            onClick={() => setShowUploadForm(true)}
          >
            Submit a Photo
          </button>
        ) : (
          <UploadForm
            contestId={contestId}
            onUploadSuccess={() => {
              setShowUploadForm(false);
              fetchContestDetails();
            }}
          />
        );

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

      {contest.phase === "ended" && contest.Photos?.length > 0 && (
        <ContestResults photos={contest.Photos} contestId={contestId} />
      )}

      <ContestSubmissions
        photos={contest.Photos || []}
        contestId={contestId}
        contestPhase={contest.phase}
      />
    </div>
  );
}
