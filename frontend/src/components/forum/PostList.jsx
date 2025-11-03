import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/components/Forum.module.css";
import { useForumService } from "../../hooks";
import { ReplyForm } from "./ReplyForm";
import { FormattedContent } from "./FormattedContent";
import { PhotoLibraryPicker } from "../photos/PhotoLibraryPicker";

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

export function PostList({
  posts: initialPosts,
  currentUserId,
  threadAuthorId,
  onPostUpdate,
  onPhotoClick,
}) {
  const [editingPostId, setEditingPostId] = useState(null);
  const [localPosts, setLocalPosts] = useState(initialPosts || []);
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [editingSelectedPhoto, setEditingSelectedPhoto] = useState(null);
  const forumService = useForumService();

  // Keep local posts in sync with props
  useEffect(() => {
    setLocalPosts(initialPosts || []);
  }, [initialPosts]);

  if (!localPosts || localPosts.length === 0) {
    return null;
  }

  const handleEditPost = async (postId, content, photoId) => {
    try {
      await forumService.updatePost(postId, content, photoId);
      setEditingPostId(null);
      setEditingSelectedPhoto(null);

      // Update the post in the local state immediately
      setLocalPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, content, isEdited: true } : post
        )
      );

      // Call the parent update callback if provided
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await forumService.deletePost(postId);

      // Remove the post from local state immediately
      setLocalPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== postId)
      );

      // Call the parent update callback if provided
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const handlePhotoSelect = (photo) => {
    setEditingSelectedPhoto(photo);
    setShowPhotoLibrary(false);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingSelectedPhoto(null);
  };

  return (
    <>
      <div className={styles.postList}>
        {localPosts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            {editingPostId === post.id ? (
              <ReplyForm
                initialValue={post.content}
                initialPhoto={post.photo}
                buttonText="Save Changes"
                onSubmit={(content, photoId) =>
                  handleEditPost(post.id, content, photoId)
                }
                onCancel={handleCancelEdit}
                onPhotoLibraryOpen={() => setShowPhotoLibrary(true)}
                selectedPhoto={editingSelectedPhoto}
                onPhotoSelect={setEditingSelectedPhoto}
              />
            ) : (
              <>
                <div className={styles.postHeader}>
                  <div className={styles.postAuthor}>
                    <img
                      src={
                        post.author?.avatarUrl ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239CA3AF'%3E%3F%3C/text%3E%3C/svg%3E"
                      }
                      alt={post.author?.nickname || "User"}
                      className={styles.postAuthorAvatar}
                      onError={(e) => {
                        if (!e.target.dataset.errorHandled) {
                          e.target.dataset.errorHandled = "true";
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239CA3AF'%3E%3F%3C/text%3E%3C/svg%3E";
                        }
                      }}
                    />
                    <div className={styles.postAuthorInfo}>
                      <span className={styles.postAuthorName}>
                        <Link
                          to={`/users/${post.author?.id}`}
                          className="hover:text-indigo-600 hover:underline"
                        >
                          {post.author?.nickname || "Anonymous"}
                        </Link>
                        {post.author?.id === threadAuthorId && (
                          <span className="ml-2 text-indigo-400 text-xs">
                            (Thread Author)
                          </span>
                        )}
                      </span>
                      <span className={styles.postDate}>
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {currentUserId === post.author?.id && (
                    <div className={styles.postActions}>
                      <button
                        className={styles.actionButton}
                        title="Edit post"
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditingSelectedPhoto(post.photo);
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
                        title="Delete post"
                        onClick={() => handleDeletePost(post.id)}
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

                <FormattedContent
                  content={post.content}
                  photo={post.photo}
                  onPhotoClick={onPhotoClick}
                />

                {post.isEdited && (
                  <div className={styles.editedTag}>Edited</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Photo Library Picker rendered at PostList level for full-screen display */}
      <PhotoLibraryPicker
        isOpen={showPhotoLibrary}
        onClose={() => setShowPhotoLibrary(false)}
        onSelect={handlePhotoSelect}
      />
    </>
  );
}
