import React, { useState } from "react";
import styles from "../../styles/components/Forum.module.css";

export function ReplyForm({
  onSubmit,
  initialValue = "",
  buttonText = "Post Reply",
}) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(content);
      setContent("");
    } catch (error) {
      console.error("Error submitting reply:", error);
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.replyForm}>
      <h3 className={styles.replyFormTitle}>Leave a Reply</h3>
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
            onClick={() => setContent("")}
            disabled={isSubmitting || !content.trim()}
          >
            Clear
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? "Posting..." : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
