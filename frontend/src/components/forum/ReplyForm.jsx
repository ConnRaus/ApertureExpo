import React, { useState } from "react";
import styles from "../../styles/components/Forum.module.css";

export function ReplyForm({
  onSubmit,
  initialValue = "",
  buttonText = "Post Reply",
  onCancel,
}) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(content);

      if (!onCancel) {
        // Only clear the content if not in edit mode
        setContent("");
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
    }
  };

  return (
    <div className={styles.replyForm}>
      {!onCancel && <h3 className={styles.replyFormTitle}>Leave a Reply</h3>}
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          disabled={isSubmitting}
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
            className={styles.submitButton}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? "Submitting..." : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
