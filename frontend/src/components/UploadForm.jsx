import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formStyles from "../styles/components/Form.module.css";
import { PhotoSelector } from "./PhotoSelector";
import { useContestService } from "../hooks/useServices";
import { usePhotoUploadForm } from "../hooks/useForm";

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
