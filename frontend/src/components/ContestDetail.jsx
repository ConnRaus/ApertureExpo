import React, { useState, useEffect } from "react";
import styles from "../styles/components/Contest.module.css";
import { ContestHeader } from "./ContestHeader";
import { ContestSubmissions } from "./ContestSubmissions";
import { UploadForm } from "./UploadForm";
import { useContestService } from "../hooks/useServices";

export function ContestDetail({
  contestId,
  showUploadForm,
  setShowUploadForm,
}) {
  const [contest, setContest] = useState(null);
  const [error, setError] = useState(null);
  const contestService = useContestService();

  useEffect(() => {
    fetchContestDetails();
  }, [contestId]);

  const fetchContestDetails = async () => {
    try {
      const data = await contestService.fetchContestDetails(contestId);
      setContest(data);
    } catch (error) {
      console.error("Error fetching contest details:", error);
      setError("Failed to load contest details");
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!contest) {
    return <div>Loading contest details...</div>;
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

      {!showUploadForm ? (
        <button
          className="sign-in-button mb-8"
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

      <ContestSubmissions photos={contest.Photos || []} />
    </div>
  );
}
