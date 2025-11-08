import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import imageCompression from "browser-image-compression";
import formStyles from "../../styles/components/Form.module.css";
import { useContestService } from "../../hooks";

export function PhotoFileUploader({
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
  const [compressing, setCompressing] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
      setErrorMessage("");
      setUploading(false);
      setCompressing(false);
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
      setErrorMessage(
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
      setErrorMessage(
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
      setErrorMessage("Please select a photo to upload");
      return;
    }

    // Check title state
    if (!title) {
      setErrorMessage("Please enter a title for your photo");
      return;
    }

    setErrorMessage("");
    uploadPhoto();
  };

  const uploadPhoto = async () => {
    try {
      setErrorMessage("");

      // Step 1: Compress the image on client side
      setCompressing(true);
      const originalSize = (selectedFile.size / 1024 / 1024).toFixed(2);
      console.log(`Original image size: ${originalSize}MB`);

      const options = {
        maxSizeMB: 2, // Max 2MB after compression
        maxWidthOrHeight: undefined, // Don't touch resolution
        useWebWorker: true, // Use web worker to avoid blocking UI
        fileType: "image/jpeg", // Always convert to JPEG
      };

      const compressedFile = await imageCompression(selectedFile, options);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      console.log(
        `Compressed image size: ${compressedSize}MB (${Math.round(
          (compressedSize / originalSize) * 100
        )}% of original)`
      );

      setCompressing(false);

      // Step 2: Upload the compressed image
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("photo", compressedFile, selectedFile.name);
      formData.append("title", title);
      formData.append("description", description);

      await contestService.uploadNewPhoto(contestId, formData, (progress) => {
        setUploadProgress(progress);
      });

      onClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setErrorMessage(
        error.message || "Failed to upload photo. Please try again."
      );
    } finally {
      setUploading(false);
      setCompressing(false);
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Upload New Photo
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={uploading || compressing}
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
                className={`border-2 border-dashed rounded-lg text-center ${
                  showError ? "border-red-500" : "border-gray-600"
                } ${
                  isDragging
                    ? "border-indigo-500 bg-gray-700/50"
                    : "border-gray-600 hover:border-gray-500 bg-gray-700/20"
                } transition-colors relative cursor-pointer min-h-[15rem] flex items-center justify-center`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                // Make the whole div clickable if no preview
                onClick={() => {
                  if (!previewUrl && !uploading && !compressing) {
                    document.getElementById("photoUpload").click();
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  id="photoUpload"
                  ref={fileRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading || compressing}
                />
                {previewUrl ? (
                  <div
                    className="absolute inset-0 w-full h-full rounded-lg bg-gray-900 overflow-hidden cursor-pointer group"
                    onClick={(e) => {
                      if (!uploading && !compressing) {
                        e.stopPropagation(); // Prevent triggering parent div's onClick if needed
                        document.getElementById("photoUpload").click();
                      }
                    }}
                    title="Click to change photo"
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-75"
                    />
                  </div>
                ) : (
                  // Label removed, text centered directly in the div
                  <p className="text-gray-400 p-6">
                    {isDragging
                      ? "Drop photo here"
                      : "Drag & drop or click to select"}
                  </p>
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
                  disabled={uploading || compressing}
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
                  disabled={uploading || compressing}
                />
                <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {description.length}/150
                </span>
              </div>
            </div>

            <div className="mt-6">
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {errorMessage}
                </div>
              )}
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
                disabled={uploading || compressing || !photoSelected}
              >
                {compressing
                  ? "Compressing..."
                  : uploading
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
