import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForumService, useDelayedLoading } from "../hooks";
import { ThreadDetail } from "../components/forum/ThreadDetail";
import styles from "../styles/components/Forum.module.css";
import "../styles/loading.css";

function ThreadDetailPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const forumService = useForumService();
  const shouldShowLoading = useDelayedLoading(isLoading);

  useEffect(() => {
    fetchThreadDetails();
  }, [threadId, currentPage]);

  const fetchThreadDetails = async () => {
    setIsLoading(true);
    try {
      const data = await forumService.fetchThreadDetails(threadId, currentPage);
      setThread(data.thread);
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setTotalPosts(data.totalPosts);
    } catch (error) {
      console.error("Error fetching thread details:", error);
      setError("Failed to load thread details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (threadId, content) => {
    try {
      await forumService.createPost(threadId, content);
      fetchThreadDetails(); // Refresh the thread details
    } catch (error) {
      console.error("Error posting reply:", error);
      setError("Failed to post reply");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={styles.forumContainer}>
      <div className="mb-6">
        <button
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
          onClick={() => navigate("/forum")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
          Back to Forum
        </button>
      </div>

      {shouldShowLoading ? (
        <div className="loading-container">
          <div className="contest-detail-skeleton">
            <div className="banner-skeleton h-32"></div>
            <div className="content-skeleton">
              <div className="title-skeleton w-1/2 h-8 mb-4"></div>
              <div className="text-skeleton w-1/4 mb-6"></div>
              <div className="text-skeleton w-full mb-2"></div>
              <div className="text-skeleton w-full mb-2"></div>
              <div className="text-skeleton w-3/4 mb-6"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ThreadDetail
            thread={thread}
            posts={posts}
            onReply={handleReply}
            totalPosts={totalPosts}
          />

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

export default ThreadDetailPage;
