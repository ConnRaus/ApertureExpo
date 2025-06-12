import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formStyles from "../../styles/components/Form.module.css";
import { PhotoLibraryPicker } from "../photos/PhotoLibraryPicker";
import { PhotoFileUploader } from "../photos/PhotoFileUploader";
import { useContestService } from "../../hooks";

export function UploadForm({ onUploadSuccess, contestId }) {
  const [showPhotoLibraryPicker, setShowPhotoLibraryPicker] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const contestService = useContestService();

  const handleExistingPhotoSelect = async (photo) => {
    try {
      setUploading(true);
      const toastId = toast.loading("Submitting photo to contest...");
      await contestService.submitPhoto(contestId, photo.id);
      toast.update(toastId, {
        render: "Photo submitted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setShowPhotoLibraryPicker(false);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to submit photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="bottom-right" />

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
