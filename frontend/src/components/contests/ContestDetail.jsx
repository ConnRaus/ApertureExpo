import React, { useState, useEffect } from "react";
import styles from "../../styles/components/Contest.module.css";
import { ContestHeader } from "./ContestHeader";
import { ContestSubmissions } from "./ContestSubmissions";
import { UploadForm } from "../user/UploadForm";
import { useContestService, useDelayedLoading } from "../../hooks";
import { LoadingSpinner } from "../common/CommonComponents";

export function ContestDetail({
  contestId,
  showUploadForm,
  setShowUploadForm,
}) {
  const [contest, setContest] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const contestService = useContestService();

  // Use our delayed loading hook to prevent flashing on fast connections
  const shouldShowLoading = useDelayedLoading(isLoading);

  useEffect(() => {
    fetchContestDetails();
  }, [contestId]);

  const fetchContestDetails = async () => {
    setIsLoading(true);
    try {
      const data = await contestService.fetchContestDetails(contestId);
      setContest(data);
    } catch (error) {
      console.error("Error fetching contest details:", error);
      setError("Failed to load contest details");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Only show loading state if shouldShowLoading is true
  if (shouldShowLoading) {
    return (
      <div className={styles.contestDetail}>
        <div className="py-12">
          <LoadingSpinner size="lg" message="Loading contest details..." />
        </div>
      </div>
    );
  }

  // If we're loading but not showing the loading state yet, render nothing or a minimal placeholder
  if (isLoading) {
    return <div className={styles.contestDetail}></div>; // Empty container to maintain layout
  }

  return (
    <div className={styles.contestDetail}>
      <ContestHeader
        title={contest.title}
        description={contest.description}
        status={contest.status}
        startDate={contest.startDate}
        endDate={contest.endDate}
        bannerImageUrl={contest.bannerImageUrl}
      />

      <div className="mb-8">
        {/* Only show submit button for active contests */}
        {contest.status === "active" ? (
          !showUploadForm ? (
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
          )
        ) : contest.status === "upcoming" ? (
          <div className="text-center p-3 bg-indigo-900/30 rounded-lg">
            <p>
              This contest hasn't started yet. Check back on{" "}
              {new Date(contest.startDate).toLocaleDateString()}!
            </p>
          </div>
        ) : (
          <div className="text-center p-3 bg-red-900/30 rounded-lg">
            <p>This contest has ended. No more submissions are allowed.</p>
          </div>
        )}
      </div>

      <ContestSubmissions photos={contest.Photos || []} />
    </div>
  );
}
