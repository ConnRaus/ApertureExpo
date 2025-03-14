import React, { useState, useEffect } from "react";
import styles from "../styles/components/Contest.module.css";
import { ContestHeader } from "./ContestHeader";
import { ContestSubmissions } from "./ContestSubmissions";
import { UploadForm } from "./UploadForm";
import { useContestService, useDelayedLoading } from "../hooks";
import "../styles/loading.css";

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
        <div className="contest-detail-skeleton">
          {/* Header skeleton */}
          <div className="banner-skeleton h-64"></div>
          <div className="content-skeleton">
            <div className="title-skeleton w-1/2 h-8 mb-4"></div>
            <div className="text-skeleton w-3/4 mb-2"></div>
            <div className="text-skeleton w-1/4"></div>
          </div>

          {/* Upload button skeleton */}
          <div className="my-8">
            <div className="button-skeleton w-32 h-10 rounded-lg"></div>
          </div>

          {/* Submissions skeleton */}
          <div className="mt-8">
            <div className="title-skeleton w-48 mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="aspect-square">
                  <div className="banner-skeleton h-full"></div>
                </div>
              ))}
            </div>
          </div>
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
        {!showUploadForm ? (
          <button
            className="sign-in-button"
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
        )}
      </div>

      <ContestSubmissions photos={contest.Photos || []} />
    </div>
  );
}
