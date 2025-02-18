import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/components/Contest.module.css";
import formStyles from "../styles/components/Form.module.css";
import { PhotoSelector } from "./PhotoSelector";
import { ContestHeader } from "./ContestHeader";
import { ContestSubmissions } from "./ContestSubmissions";
import { useContestService } from "../hooks/useServices";
import { usePhotoUploadForm } from "../hooks/useForm";

export function ContestCard({ contest, onClick }) {
  const defaultBanner =
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60";

  return (
    <div className={styles.contestCard} onClick={onClick}>
      <img
        src={contest.bannerImageUrl || defaultBanner}
        alt={contest.title}
        className={styles.bannerImage}
      />
      <div className={styles.contestInfo}>
        <h3>{contest.title}</h3>
        <p>{contest.description}</p>
        <p className={styles.submissionCount}>
          {contest.Photos?.length || 0} submissions
        </p>
      </div>
    </div>
  );
}

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
    <div className="contest-grid">
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
  );
}

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

export function UploadForm({ onUploadSuccess, contestId }) {
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const contestService = useContestService();
  const form = usePhotoUploadForm();

  const handleExistingPhotoSelect = async (photo) => {
    try {
      form.setUploading(true);
      const toastId = toast.loading("Submitting photo to contest...");
      await contestService.submitPhoto(contestId, photo.id);
      toast.update(toastId, {
        render: "Photo submitted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setShowPhotoSelector(false);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to submit photo. Please try again.");
    } finally {
      form.setUploading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return;

    try {
      form.setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading("Preparing to upload...");

      await contestService.uploadNewPhoto(
        contestId,
        form.getFormData(),
        (progress) => {
          setUploadProgress(progress);
          toast.update(toastId, {
            render: `Uploading: ${Math.round(progress)}%`,
          });
        }
      );

      toast.update(toastId, {
        render: "Photo uploaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to upload photo. Please try again.");
      form.setError("Failed to upload photo. Please try again.");
    } finally {
      form.setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="bottom-right" />

      {!form.showUploadForm && (
        <div className="flex gap-4">
          <button
            onClick={() => setShowPhotoSelector(true)}
            className={`${formStyles.button} ${formStyles.secondaryButton} flex-1`}
            disabled={form.uploading}
          >
            Choose Existing Photo
          </button>
          <span className="text-gray-400 flex items-center">or</span>
          <button
            type="button"
            onClick={() => document.getElementById("photoUploadInput").click()}
            className={`${formStyles.button} ${formStyles.primaryButton} flex-1`}
            disabled={form.uploading}
          >
            Upload New Photo
          </button>
        </div>
      )}

      <input
        id="photoUploadInput"
        type="file"
        onChange={form.handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {form.showUploadForm && form.file && (
        <form onSubmit={handleUpload} className={formStyles.form}>
          <div className={formStyles.formGroup}>
            {form.error && (
              <div className="error-message mb-4">{form.error}</div>
            )}
            {form.file && (
              <div className="mb-6">
                <img
                  src={URL.createObjectURL(form.file)}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            <label className={formStyles.label}>Title</label>
            <div className="relative">
              <input
                type="text"
                {...form.title}
                className={formStyles.input}
                required
              />
              <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                {form.title.length}/{form.title.maxLength}
              </span>
            </div>

            <label className={formStyles.label}>Description</label>
            <div className="relative">
              <textarea {...form.description} className={formStyles.textarea} />
              <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                {form.description.length}/{form.description.maxLength}
              </span>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={form.uploading}
                className={`${formStyles.button} ${formStyles.primaryButton} flex-1`}
              >
                {form.uploading ? "Uploading..." : "Submit Photo"}
              </button>
              <button
                type="button"
                onClick={form.handleCancel}
                className={`${formStyles.button} ${formStyles.secondaryButton}`}
                disabled={form.uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <PhotoSelector
        isOpen={showPhotoSelector}
        onClose={() => setShowPhotoSelector(false)}
        onSelect={handleExistingPhotoSelect}
        contestId={contestId}
      />
    </div>
  );
}
