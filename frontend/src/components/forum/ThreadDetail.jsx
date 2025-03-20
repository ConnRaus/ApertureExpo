import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/components/Forum.module.css";
import { PostList } from "./PostList";
import { ReplyForm } from "./ReplyForm";
import { useForumService } from "../../hooks";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export function ThreadDetail({
  thread,
  posts: initialPosts,
  onReply,
  totalPosts: initialTotalPosts,
  onThreadUpdate,
  onThreadDelete,
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const forumService = useForumService();
  const [isEditing, setIsEditing] = useState(false);
  const [threadTitle, setThreadTitle] = useState(thread?.title || "");
  const [threadContent, setThreadContent] = useState(thread?.content || "");
  const [localThread, setLocalThread] = useState(thread);
  const [localPosts, setLocalPosts] = useState(initialPosts);
  const [localTotalPosts, setLocalTotalPosts] = useState(initialTotalPosts);
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep local state in sync with props
  useEffect(() => {
    setLocalThread(thread);
    setLocalPosts(initialPosts);
    setLocalTotalPosts(initialTotalPosts);
  }, [thread, initialPosts, initialTotalPosts]);

  // Function to fetch the latest thread data
  const refreshThreadData = async () => {
    try {
      const threadData = await forumService.fetchThreadDetails(thread.id);
      setLocalThread(threadData.thread);
      setLocalPosts(threadData.posts);
      setLocalTotalPosts(threadData.totalPosts);

      // Also notify parent if callback exists
      if (onThreadUpdate) {
        onThreadUpdate();
      }
    } catch (error) {
      console.error("Error refreshing thread data:", error);
    }
  };

  if (!localThread) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Thread not found</p>
      </div>
    );
  }

  const isThreadOwner = user?.id === localThread.author?.id;

  const handleEditThread = async () => {
    try {
      await forumService.updateThread(localThread.id, {
        title: threadTitle,
        content: threadContent,
      });
      setIsEditing(false);

      // Immediately refresh data after update
      await refreshThreadData();
    } catch (error) {
      console.error("Error updating thread:", error);
      alert("Failed to update thread");
    }
  };

  const handleDeleteThread = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this thread? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await forumService.deleteThread(localThread.id);
      if (onThreadDelete) {
        onThreadDelete();
      } else {
        navigate("/forum");
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      alert("Failed to delete thread");
    }
  };

  const handlePostUpdate = async () => {
    await refreshThreadData();
  };

  const handleLocalReply = async (threadId, content) => {
    try {
      await onReply(threadId, content);
      // Refresh data locally after reply
      await refreshThreadData();
    } catch (error) {
      console.error("Error handling reply:", error);
    }
  };

  return (
    <div>
      <div className={styles.threadDetail}>
        {isEditing ? (
          <div className={styles.editThreadForm}>
            <input
              type="text"
              value={threadTitle}
              onChange={(e) => setThreadTitle(e.target.value)}
              className={styles.formInput}
            />
            <textarea
              value={threadContent}
              onChange={(e) => setThreadContent(e.target.value)}
              className={styles.textarea}
              style={{ marginTop: "1rem", minHeight: "10rem" }}
            />
            <div className={styles.buttonGroup} style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitButton}
                onClick={handleEditThread}
                disabled={!threadTitle.trim() || !threadContent.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.threadDetailHeader}>
              <div className="flex justify-between items-start">
                <h1 className={styles.threadDetailTitle}>
                  {localThread.title}
                </h1>
                {isThreadOwner && (
                  <div className={styles.postActions}>
                    <button
                      className={styles.actionButton}
                      title="Edit thread"
                      onClick={() => {
                        setThreadTitle(localThread.title);
                        setThreadContent(localThread.content);
                        setIsEditing(true);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                      </svg>
                    </button>
                    <button
                      className={styles.actionButton}
                      title="Delete thread"
                      onClick={handleDeleteThread}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                        <path
                          fillRule="evenodd"
                          d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.threadDetailMeta}>
                <div className={styles.threadAuthor}>
                  <img
                    src={
                      localThread.author?.avatarUrl ||
                      "https://via.placeholder.com/30"
                    }
                    alt={localThread.author?.nickname || "User"}
                    className={styles.authorAvatar}
                  />
                  <Link
                    to={`/users/${localThread.author?.id}`}
                    className={`${styles.authorName} hover:text-indigo-600 hover:underline`}
                  >
                    {localThread.author?.nickname || "Anonymous"}
                  </Link>
                </div>
                <div>
                  <span className={styles.threadCategory}>
                    {localThread.category}
                  </span>
                  <span className="ml-4 text-gray-400">
                    Posted: {formatDate(localThread.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.threadContent}>{localThread.content}</div>
          </>
        )}
      </div>

      {localPosts && localPosts.length > 0 && (
        <>
          <h2 className={styles.postCount}>
            {localTotalPosts} {localTotalPosts === 1 ? "Reply" : "Replies"}
          </h2>
          <PostList
            posts={localPosts}
            currentUserId={user?.id}
            threadAuthorId={localThread.author?.id}
            onPostUpdate={handlePostUpdate}
          />
        </>
      )}

      {!localThread.isLocked && !isEditing && (
        <ReplyForm
          onSubmit={(content) => handleLocalReply(localThread.id, content)}
        />
      )}

      {localThread.isLocked && (
        <div className="text-center py-4 text-gray-400">
          This thread is locked. No new replies can be posted.
        </div>
      )}
    </div>
  );
}
