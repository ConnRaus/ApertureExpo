import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import styles from "../styles/components/Contest.module.css";
import formStyles from "../styles/components/Form.module.css";
import { PhotoSelector } from "./PhotoSelector";

const API_URL = import.meta.env.VITE_API_URL;

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

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
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/contests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch contests");
      const data = await response.json();
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

function ContestPhotoCard({ photo, onClick }) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  return (
    <div className={styles.contestPhotoCard} onClick={() => onClick(photo)}>
      <img
        src={photo.s3Url}
        alt="Contest submission"
        onError={handleImageError}
        className={styles.contestSubmissionImage}
      />
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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const defaultBanner =
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60";

  useEffect(() => {
    fetchContestDetails();
  }, [contestId]);

  const fetchContestDetails = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch contest details");
      const data = await response.json();
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

  const lightboxSlides = contest.Photos?.map((photo) => ({
    src: photo.s3Url,
  }));

  return (
    <div className={styles.contestDetail}>
      <div className={styles.bannerSection}>
        <img
          src={contest.bannerImageUrl || defaultBanner}
          alt={contest.title}
        />
        <div className={styles.bannerOverlay} />
        <div className={styles.contestHeader}>
          <h1>{contest.title}</h1>
          <p>{contest.description}</p>
          <div className={styles.contestMeta}>
            <span className={styles.statusBadge}>{contest.status}</span>
            <span className={styles.dateRange}>
              {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
            </span>
          </div>
        </div>
      </div>

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

      <h3 className="text-2xl font-semibold mb-6">
        Submissions ({contest.Photos?.length || 0})
      </h3>
      {contest.Photos?.length === 0 ? (
        <p>No submissions yet. Be the first to submit!</p>
      ) : (
        <div className={styles.submissionsGrid}>
          {contest.Photos?.map((photo, index) => (
            <ContestPhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setSelectedPhotoIndex(index)}
            />
          ))}
        </div>
      )}

      <Lightbox
        open={selectedPhotoIndex >= 0}
        close={() => setSelectedPhotoIndex(-1)}
        index={selectedPhotoIndex}
        slides={lightboxSlides}
        plugins={[Thumbnails, Zoom, Counter]}
        carousel={{
          finite: false,
          preload: 3,
          padding: "16px",
        }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
}

export function UploadForm({ onUploadSuccess, contestId }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { getToken } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowUploadForm(true);
      // Reset any previous error
      setError(null);
    }
  };

  const handleExistingPhotoSelect = async (photo) => {
    try {
      setUploading(true);
      setError(null);
      const token = await getToken();

      const response = await fetch(`${API_URL}/photos/${photo.id}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contestId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit photo to contest");
      }

      const data = await response.json();
      setShowPhotoSelector(false);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("Submission error:", error);
      // Show error in a more prominent way
      alert(error.message || "Failed to submit photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("title", title);
    formData.append("description", description);
    if (contestId) formData.append("contestId", contestId);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload photo");
      }

      const data = await response.json();
      setFile(null);
      setTitle("");
      setDescription("");
      setShowUploadForm(false);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setShowUploadForm(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!showUploadForm && (
        <div className="flex gap-4">
          <button
            onClick={() => setShowPhotoSelector(true)}
            className={`${formStyles.button} ${formStyles.secondaryButton} flex-1`}
            disabled={uploading}
          >
            Choose Existing Photo
          </button>
          <span className="text-gray-400 flex items-center">or</span>
          <button
            type="button"
            onClick={() => document.getElementById("photoUploadInput").click()}
            className={`${formStyles.button} ${formStyles.primaryButton} flex-1`}
            disabled={uploading}
          >
            Upload New Photo
          </button>
        </div>
      )}

      <input
        id="photoUploadInput"
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {showUploadForm && (
        <form onSubmit={handleUpload} className="upload-form">
          {error && <div className="error-message mb-4">{error}</div>}

          <div className={formStyles.formGroup}>
            {file && (
              <div className="mb-6">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            <label className={formStyles.label}>Title</label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                className={formStyles.input}
                maxLength={100}
                required
              />
              <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                {title.length}/100
              </span>
            </div>

            <label className={formStyles.label}>Description</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                className={formStyles.textarea}
                maxLength={500}
              />
              <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                {description.length}/500
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={uploading}
                className={`${formStyles.button} ${formStyles.primaryButton} flex-1`}
              >
                {uploading ? "Uploading..." : "Submit Photo"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={`${formStyles.button} ${formStyles.secondaryButton}`}
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
