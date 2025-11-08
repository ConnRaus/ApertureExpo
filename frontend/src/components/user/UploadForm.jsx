import React, { useState } from "react";
import formStyles from "../../styles/components/Form.module.css";
import { PhotoLibraryPicker } from "../photos/PhotoLibraryPicker";
import { PhotoFileUploader } from "../photos/PhotoFileUploader";
import { useContestService } from "../../hooks";

export function UploadForm({ onUploadSuccess, contestId }) {
  const [showPhotoLibraryPicker, setShowPhotoLibraryPicker] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const contestService = useContestService();

  const handleExistingPhotoSelect = async (photo) => {
    try {
      setUploading(true);
      setError("");
      await contestService.submitPhoto(contestId, photo.id);
      setShowPhotoLibraryPicker(false);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setError(error.message || "Failed to submit photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className={`${formStyles.button} ${formStyles.primaryButton} flex-1`}
          disabled={uploading}
        >
          Upload New Photo
        </button>
        <span className="text-gray-400 flex items-center">or</span>
        <button
          onClick={() => setShowPhotoLibraryPicker(true)}
          className={`${formStyles.button} ${formStyles.secondaryButton} flex-1`}
          disabled={uploading}
        >
          Choose Existing Photo
        </button>
      </div>

      <PhotoLibraryPicker
        isOpen={showPhotoLibraryPicker}
        onClose={() => setShowPhotoLibraryPicker(false)}
        onSelect={handleExistingPhotoSelect}
        contestId={contestId}
      />

      <PhotoFileUploader
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        contestId={contestId}
        onUploadSuccess={onUploadSuccess}
      />
    </div>
  );
}
