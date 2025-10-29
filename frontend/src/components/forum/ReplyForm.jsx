import React, { useState, useEffect } from "react";
import styles from "../../styles/components/Forum.module.css";
import { RichTextEditor } from "./RichTextEditor";

export function ReplyForm({
  onSubmit,
  initialValue = "",
  initialPhoto = null,
  buttonText = "Post Reply",
  onCancel,
  onPhotoLibraryOpen,
  selectedPhoto: externalSelectedPhoto,
  onPhotoSelect: externalOnPhotoSelect,
}) {
  const [content, setContent] = useState(initialValue);
  const [selectedPhoto, setSelectedPhoto] = useState(
    externalSelectedPhoto || initialPhoto
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected photo when external prop changes
  useEffect(() => {
    if (externalSelectedPhoto !== undefined) {
      setSelectedPhoto(externalSelectedPhoto);
    }
  }, [externalSelectedPhoto]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;
    if (content.length > 5000) return;

    setIsSubmitting(true);

    try {
      await onSubmit(content, selectedPhoto?.id);

      if (!onCancel) {
        // Only clear the content if not in edit mode
        setContent("");
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setContent("");
      setSelectedPhoto(null);
    }
  };

  const handlePhotoSelect = (photo) => {
    if (externalOnPhotoSelect) {
      // Use external photo management
      externalOnPhotoSelect(photo);
    } else {
      // Use internal photo management
      setSelectedPhoto(photo);
    }
  };

  return (
    <div className={styles.replyForm}>
      {!onCancel && <h3 className={styles.replyFormTitle}>Leave a Reply</h3>}
      <form onSubmit={handleSubmit}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          onPhotoSelect={handlePhotoSelect}
          selectedPhoto={selectedPhoto}
          placeholder="Write your thoughts here..."
          disabled={isSubmitting}
          maxLength={5000}
          onPhotoLibraryOpen={onPhotoLibraryOpen}
        />
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {onCancel ? "Cancel" : "Clear"}
          </button>
          <button
            type="submit"
            className={`submit-button ${styles.submitButton}`}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? "Submitting..." : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
