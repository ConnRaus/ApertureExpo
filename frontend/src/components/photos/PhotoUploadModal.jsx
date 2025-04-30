import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formStyles from "../../styles/components/Form.module.css";
import { useContestService } from "../../hooks";

export function PhotoUploadModal({
  isOpen,
  onClose,
  contestId,
  onUploadSuccess,
}) {
  if (!isOpen) return null;

  // Use refs to prevent re-renders
  const fileRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showError, setShowError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const contestService = useContestService();

  // Effect to reset form state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setPhotoSelected(false);
      setShowError(false);
      setUploading(false);
      setUploadProgress(0);
      // Reset file input visually if possible
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } else {
      // Optional: Clean up preview URL when modal closes to free memory
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl); // Only if previewUrl is an Object URL
        setPreviewUrl(null);
      }
    }
  }, [isOpen]);

  // List of accepted image MIME types and extensions
  const ACCEPTED_TYPES = {
    // Standard web formats
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/heic": [".heic"],
    // Common RAW formats
    "image/x-canon-cr2": [".cr2"],
    "image/x-nikon-nef": [".nef"],
    "image/x-sony-arw": [".arw"],
    "image/x-adobe-dng": [".dng"],
    "image/x-olympus-orf": [".orf"],
    "image/x-panasonic-rw2": [".rw2"],
    "image/x-fuji-raf": [".raf"],
    "image/x-nikon-nrw": [".nrw"],
  };

  const isAcceptedFileType = (file) => {
    // Check MIME type first
    if (ACCEPTED_TYPES[file.type]) return true;

    // If MIME type check fails, check file extension
    const extension = "." + file.name.split(".").pop().toLowerCase();
    return Object.values(ACCEPTED_TYPES).flat().includes(extension);
  };

  const validateAndProcessFile = (file) => {
    if (!file) return false;

    if (!isAcceptedFileType(file)) {
      const acceptedExtensions = Object.values(ACCEPTED_TYPES)
        .flat()
        .join(", ");
      toast.error(
        `Unsupported file type. Please upload one of the following: ${acceptedExtensions}`
      );
      return false;
    }

    // For now, only allow web-compatible formats
    // In the future, we could add RAW conversion here
    if (
      !file.type.startsWith("image/jpeg") &&
      !file.type.startsWith("image/png") &&
      !file.type.startsWith("image/webp")
    ) {
      toast.error(
        "Currently only JPEG, PNG, and WebP files are supported. RAW file support coming soon!"
      );
      return false;
    }

    return true;
  };

  const handleUpload = (e) => {
    e.preventDefault();

    if (!previewUrl || !selectedFile) {
      setShowError(true);
      toast.error("Please select a photo to upload");
      return;
    }

    // Check title state
    if (!title) {
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
      formData.append("photo", selectedFile);
      formData.append("title", title);
      formData.append("description", description);

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
    if (!file) {
      // If no file was selected (user cancelled), keep the existing selection
      return;
    }

    if (!validateAndProcessFile(file)) {
      e.target.value = ""; // Reset file input
      return;
    }

    fileRef.current = e.target;
    setPhotoSelected(true);
    setSelectedFile(file);
    setShowError(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!validateAndProcessFile(file)) {
      return;
    }

    // Create a new DataTransfer object and add our file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Create a new file input event
    const fileInput = document.getElementById("photoUpload");
    fileInput.files = dataTransfer.files;

    // Store the file directly
    setSelectedFile(file);
    setPhotoSelected(true);

    // Trigger the file change handler
    handleFileChange({ target: fileInput });
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
              <label
                htmlFor="photoUpload"
                className={`${formStyles.label} cursor-pointer block mb-2`}
              >
                Select Photo
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  showError ? "border-red-500" : "border-gray-600"
                } ${
                  isDragging
                    ? "border-indigo-500 bg-gray-700/50"
                    : "border-gray-600 hover:border-gray-500 bg-gray-700/20"
                } transition-colors`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  id="photoUpload"
                  ref={fileRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-60 mx-auto mb-4 rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("photoUpload").click()
                      }
                      className="absolute bottom-2 right-2 text-sm px-2 py-1 bg-gray-600/70 text-white rounded hover:bg-gray-500/70"
                      disabled={uploading}
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <label htmlFor="photoUpload" className="cursor-pointer">
                    <p className="text-gray-400">
                      {isDragging
                        ? "Drop photo here"
                        : "Drag & drop or click to select"}
                    </p>
                  </label>
                )}
              </div>
              {showError && (
                <p className="text-red-500 text-sm mt-1">
                  Please select a photo.
                </p>
              )}
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="photoTitle" className={formStyles.label}>
                Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="photoTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 25))}
                  placeholder="Enter photo title"
                  className={formStyles.input}
                  maxLength={25}
                  disabled={uploading}
                />
                <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {title.length}/25
                </span>
              </div>
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="photoDescription" className={formStyles.label}>
                Description (optional)
              </label>
              <div className="relative">
                <textarea
                  id="photoDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 150))}
                  placeholder="Enter photo description"
                  className={formStyles.textarea}
                  maxLength={150}
                  disabled={uploading}
                />
                <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {description.length}/150
                </span>
              </div>
            </div>

            <div className="mt-6">
              {uploading && (
                <div className="w-full bg-gray-600 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              <button
                type="submit"
                className={`${formStyles.button} ${formStyles.primaryButton} w-full`}
                disabled={uploading || !photoSelected}
              >
                {uploading
                  ? `Uploading... ${Math.round(uploadProgress)}%`
                  : "Upload Photo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
