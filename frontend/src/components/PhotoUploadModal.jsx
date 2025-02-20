import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formStyles from "../styles/components/Form.module.css";
import { useContestService } from "../hooks/useServices";

export function PhotoUploadModal({
  isOpen,
  onClose,
  contestId,
  onUploadSuccess,
}) {
  if (!isOpen) return null;

  // Use refs to prevent re-renders
  const fileRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [showError, setShowError] = useState(false);
  const contestService = useContestService();

  const handleUpload = (e) => {
    e.preventDefault();

    // Check if a file is selected
    if (!photoSelected || !fileRef.current?.files[0]) {
      setShowError(true);
      toast.error("Please select a photo to upload");
      return;
    }

    // Check if title is filled out
    if (!titleRef.current?.value) {
      toast.error("Please enter a title for your photo");
      return;
    }

    uploadPhoto();
  };

  const uploadPhoto = async () => {
    try {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading("Preparing to upload...");

      const formData = new FormData();
      formData.append("photo", fileRef.current.files[0]);
      formData.append("title", titleRef.current.value);
      formData.append("description", descriptionRef.current.value);

      await contestService.uploadNewPhoto(contestId, formData, (progress) => {
        setUploadProgress(progress);
        toast.update(toastId, {
          render: `Uploading: ${Math.round(progress)}%`,
        });
      });

      toast.update(toastId, {
        render: "Photo uploaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      onClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    fileRef.current = e.target;
    setPhotoSelected(!!file);
    setShowError(false);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById("imagePreview");
        preview.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      const preview = document.getElementById("imagePreview");
      preview.style.display = "none";
    }
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 w-full h-full bg-black/50 backdrop-blur-sm"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
      />
      <div
        className="fixed inset-0 w-full h-full flex items-center justify-center"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto flex flex-col border border-gray-700/50">
          <ToastContainer position="bottom-right" />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Upload New Photo
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={uploading}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleUpload} className={formStyles.form} noValidate>
            <div className={formStyles.formGroup}>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="photoUpload"
              />

              <div className="mb-4">
                <label
                  htmlFor="photoUpload"
                  className={`${formStyles.button} ${formStyles.secondaryButton} w-full flex items-center justify-center cursor-pointer`}
                >
                  {photoSelected ? "Change Photo" : "Select Photo"}
                </label>
                {showError && (
                  <p className="mt-2 text-red-400 text-sm">
                    Please select a photo to upload
                  </p>
                )}
              </div>

              <img
                id="imagePreview"
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg mb-4 hidden"
              />

              <label className={formStyles.label}>Title</label>
              <input
                type="text"
                ref={titleRef}
                className={formStyles.input}
                required
                maxLength={100}
                placeholder="Enter photo title"
              />

              <label className={formStyles.label} htmlFor="description">
                Description
              </label>
              <textarea
                ref={descriptionRef}
                id="description"
                className={formStyles.textarea}
                maxLength={500}
                placeholder="Enter photo description (optional)"
              />

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
                  disabled={uploading}
                  className={`${formStyles.button} ${formStyles.primaryButton} flex-1`}
                >
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${formStyles.button} ${formStyles.secondaryButton}`}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
