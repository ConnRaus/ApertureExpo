import React, { useState, useEffect } from "react";
import { useForumService, useDelayedLoading } from "../hooks";
import styles from "../styles/components/Forum.module.css";
import { ThreadList } from "../components/forum/ThreadList";
import { CreateThreadForm } from "../components/forum/CreateThreadForm";
import LoadingSpinner from "../components/LoadingSpinner";

function ForumPage() {
  const [threads, setThreads] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);

  const forumService = useForumService();
  const shouldShowLoading = useDelayedLoading(isLoading);

  useEffect(() => {
    fetchThreads();
    fetchCategories();
  }, [currentPage, selectedCategory]);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const data = await forumService.fetchThreads(
        currentPage,
        10,
        selectedCategory
      );
      setThreads(data.threads);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setError("Failed to load forum threads");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await forumService.fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateThread = async (threadData) => {
    try {
      await forumService.createThread(
        threadData.title,
        threadData.content,
        threadData.category
      );
      setShowCreateForm(false);
      fetchThreads(); // Refresh the thread list
    } catch (error) {
      console.error("Error creating thread:", error);
      setError("Failed to create thread");
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (showCreateForm) {
    return (
      <div className={styles.forumContainer}>
        <CreateThreadForm
          onSubmit={handleCreateThread}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className={styles.forumContainer}>
      <div className={styles.forumHeader}>
        <h1 className={styles.forumTitle}>Photography Forum</h1>
        <div className={styles.forumAction}>
          <button
            className="sign-in-button"
            onClick={() => setShowCreateForm(true)}
          >
            New Thread
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.categoryFilter}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryPill} ${
                selectedCategory === category ? styles.categoryPillActive : ""
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {shouldShowLoading ? (
        <div className="py-12">
          <LoadingSpinner size="lg" message="Loading forum threads..." />
        </div>
      ) : (
        <>
          <ThreadList threads={threads} />

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageButton} ${
                  currentPage === 1 ? styles.pageButtonDisabled : ""
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    className={`${styles.pageButton} ${
                      currentPage === page ? styles.pageButtonActive : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className={`${styles.pageButton} ${
                  currentPage === totalPages ? styles.pageButtonDisabled : ""
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ForumPage;
