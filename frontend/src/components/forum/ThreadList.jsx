import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/components/Forum.module.css";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function ThreadList({ threads }) {
  const navigate = useNavigate();

  if (!threads || threads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          No threads found. Be the first to start a discussion!
        </p>
      </div>
    );
  }

  const handleThreadClick = (threadId) => {
    navigate(`/forum/threads/${threadId}`);
  };

  return (
    <div className={styles.threadList}>
      {threads.map((thread) => (
        <div
          key={thread.id}
          className={`${styles.threadCard} ${
            thread.isPinned ? styles.pinnedThread : ""
          }`}
        >
          <div className={styles.threadCardHeader}>
            <h3
              className={styles.threadTitle}
              onClick={() => handleThreadClick(thread.id)}
            >
              {thread.title}
            </h3>
          </div>

          <span className={styles.threadCategory}>{thread.category}</span>

          <p className={styles.threadPreview}>{thread.content}</p>

          <div className={styles.threadMeta}>
            <div className={styles.threadAuthor}>
              <div className="flex items-center mt-2">
                <img
                  src={thread.author?.avatarUrl || "/default-avatar.png"}
                  className="w-6 h-6 rounded-full mr-2"
                  alt={thread.author?.nickname || "User"}
                />
                <span className="text-sm text-gray-600">
                  {thread.author?.nickname || "Anonymous"}
                </span>
              </div>
            </div>

            <div className={styles.threadStats}>
              <div className={styles.statItem}>
                <span>{thread.postCount || 0} replies</span>
              </div>
              <div className={styles.statItem}>
                <span>{thread.viewCount || 0} views</span>
              </div>
              <div className={styles.statItem}>
                <span>
                  Last activity:{" "}
                  {formatDate(thread.lastActivityAt || thread.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
