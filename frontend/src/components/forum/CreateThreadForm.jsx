import React, { useState, useEffect } from "react";
import styles from "../../styles/components/Forum.module.css";
import { useForumService } from "../../hooks";
import { RichTextEditor } from "./RichTextEditor";

export function CreateThreadForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [category, setCategory] = useState("General");
  const [categories, setCategories] = useState([
    "General",
    "Photography",
    "Equipment",
    "Techniques",
    "Feedback",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const forumService = useForumService();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await forumService.fetchCategories();
        if (fetchedCategories && fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
          setCategory(fetchedCategories[0]);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, [forumService]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;
    if (title.length > 200 || content.length > 10000) return;

    setIsSubmitting(true);

    try {
      await onSubmit({ title, content, category, photoId: selectedPhoto?.id });
      resetForm();
    } catch (error) {
      console.error("Error creating thread:", error);
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedPhoto(null);
    setCategory("General");
  };

  return (
    <div>
      <h2 className={styles.formTitle}>Create New Thread</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.formLabel}>
            Title
          </label>
          <div className="relative">
            <input
              type="text"
              id="title"
              className={styles.formInput}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="Thread title"
              disabled={isSubmitting}
              maxLength={200}
              required
            />
            <span className="absolute right-3 bottom-3 text-xs text-gray-400">
              {title.length}/200
            </span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.formLabel}>
            Category
          </label>
          <select
            id="category"
            className={styles.formSelect}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.formLabel}>
            Content
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            onPhotoSelect={setSelectedPhoto}
            selectedPhoto={selectedPhoto}
            placeholder="Write your thoughts here..."
            disabled={isSubmitting}
            minHeight="12rem"
            maxLength={10000}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !title.trim() || !content.trim()}
          >
            {isSubmitting ? "Creating..." : "Create Thread"}
          </button>
        </div>
      </form>
    </div>
  );
}
