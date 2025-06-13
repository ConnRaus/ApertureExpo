import React from "react";
import { useNavigate, Link } from "react-router-dom";
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
          } cursor-pointer hover:bg-gray-50 transition duration-150 relative`}
          onClick={() => handleThreadClick(thread.id)}
        >
          {/* Main content area - full width */}
          <div className={styles.threadCardHeader}>
            <h3 className={styles.threadTitle}>{thread.title}</h3>
          </div>

          <span className={styles.threadCategory}>{thread.category}</span>

          <p className={styles.threadPreview}>{thread.content}</p>

          <div className={styles.threadMeta}>
            <div className={styles.threadAuthor}>
              <div
                className="flex items-center mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={thread.author?.avatarUrl || "/default-avatar.png"}
                  className="w-6 h-6 rounded-full mr-2"
                  alt={thread.author?.nickname || "User"}
                />
                <Link
                  to={`/users/${thread.author?.id}`}
                  className="text-sm text-gray-400 hover:text-indigo-600 hover:underline"
                >
                  {thread.author?.nickname || "Anonymous"}
                </Link>
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

          {/* Photo thumbnail - absolutely positioned on the right */}
          {thread.photo && (
            <div className="absolute top-4 right-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-600">
                <img
                  src={thread.photo.thumbnailUrl || thread.photo.s3Url}
                  alt={thread.photo.title || "Attached photo"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
