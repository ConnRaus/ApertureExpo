import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import styles from "../../styles/components/Forum.module.css";
import { PostList } from "./PostList";
import { ReplyForm } from "./ReplyForm";
import { FormattedContent } from "./FormattedContent";
import { RichTextEditor } from "./RichTextEditor";
import { PhotoLibraryPicker } from "../photos/PhotoLibraryPicker";
import { Lightbox } from "../photos/Lightbox";
import { LightboxConfigs } from "../photos/LightboxConfigs";
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

  const [localThread, setLocalThread] = useState(thread);
  const [localPosts, setLocalPosts] = useState(initialPosts || []);
  const [localTotalPosts, setLocalTotalPosts] = useState(
    initialTotalPosts || 0
  );
  const [isEditing, setIsEditing] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [editingSelectedPhoto, setEditingSelectedPhoto] = useState(null);
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const isThreadOwner = user?.id === localThread?.author?.id;

  // Keep local state in sync with props
  useEffect(() => {
    if (thread) {
      setLocalThread(thread);
    }
  }, [thread]);

  useEffect(() => {
    if (initialPosts) {
      setLocalPosts(initialPosts);
    }
  }, [initialPosts]);

  useEffect(() => {
    if (initialTotalPosts !== undefined) {
      setLocalTotalPosts(initialTotalPosts);
    }
  }, [initialTotalPosts]);

  // Early return if no thread data
  if (!localThread) {
    return <div>Loading...</div>;
  }

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

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(0);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setSelectedPhotoIndex(-1);
  };

  const handleEditThread = async () => {
    try {
      await forumService.updateThread(localThread.id, {
        title: threadTitle,
        content: threadContent,
        photoId: editingSelectedPhoto?.id,
      });
      setIsEditing(false);
      setEditingSelectedPhoto(null);

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

  const handleLocalReply = async (content, photoId) => {
    try {
      await onReply(localThread.id, content, photoId);
      // Refresh data locally after reply
      await refreshThreadData();
    } catch (error) {
      console.error("Error handling reply:", error);
    }
  };

  const handlePhotoSelect = (photo) => {
    setEditingSelectedPhoto(photo);
    setShowPhotoLibrary(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingSelectedPhoto(null);
  };

  return (
    <div>
      <div className={styles.threadDetail}>
        {isEditing ? (
          <div className={styles.editThreadForm}>
            <div className="relative">
              <input
                type="text"
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value.slice(0, 200))}
                className={styles.formInput}
                placeholder="Thread title"
                maxLength={200}
              />
              <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                {threadTitle.length}/200
              </span>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <RichTextEditor
                value={threadContent}
                onChange={setThreadContent}
                onPhotoSelect={setEditingSelectedPhoto}
                selectedPhoto={editingSelectedPhoto}
                placeholder="Write your thread content here..."
                minHeight="10rem"
                maxLength={10000}
                onPhotoLibraryOpen={() => setShowPhotoLibrary(true)}
              />
            </div>
            <div className={styles.buttonGroup} style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelEdit}
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
                        setEditingSelectedPhoto(localThread.photo);
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
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239CA3AF'%3E%3F%3C/text%3E%3C/svg%3E"
                    }
                    alt={localThread.author?.nickname || "User"}
                    className={styles.authorAvatar}
                    onError={(e) => {
                      if (!e.target.dataset.errorHandled) {
                        e.target.dataset.errorHandled = "true";
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239CA3AF'%3E%3F%3C/text%3E%3C/svg%3E";
                      }
                    }}
                  />
                  <div>
                    <span className={styles.authorName}>
                      <Link
                        to={`/users/${localThread.author?.id}`}
                        className="hover:text-indigo-600 hover:underline"
                      >
                        {localThread.author?.nickname || "Anonymous"}
                      </Link>
                    </span>
                    <div className="text-sm text-gray-400">
                      {formatDate(localThread.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <FormattedContent
              content={localThread.content}
              photo={localThread.photo}
              onPhotoClick={handlePhotoClick}
            />
          </>
        )}
      </div>

      {localTotalPosts > 0 && (
        <>
          <h3 className={styles.postCount}>
            {localTotalPosts} {localTotalPosts === 1 ? "Reply" : "Replies"}
          </h3>

          <PostList
            posts={localPosts}
            currentUserId={user?.id}
            threadAuthorId={localThread.author?.id}
            onPostUpdate={handlePostUpdate}
            onPhotoClick={handlePhotoClick}
          />
        </>
      )}

      {user && (
        <ReplyForm
          onSubmit={handleLocalReply}
          threadId={localThread.id}
          buttonText="Post Reply"
        />
      )}

      {/* Photo Library Picker rendered at ThreadDetail level for full-screen display */}
      <PhotoLibraryPicker
        isOpen={showPhotoLibrary}
        onClose={() => setShowPhotoLibrary(false)}
        onSelect={handlePhotoSelect}
      />

      {/* Lightbox rendered at this level, outside of post containers */}
      {selectedPhoto && (
        <Lightbox
          photos={[selectedPhoto]}
          selectedIndex={selectedPhotoIndex}
          onClose={closeLightbox}
          config={LightboxConfigs.forum}
        />
      )}
    </div>
  );
}
