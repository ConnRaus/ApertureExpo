import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

function CommentItem({
  comment,
  onReply,
  onDelete,
  onEdit,
  currentUserId,
  isReply = false,
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(comment.Replies?.length > 0);

  const isOwner = comment.userId === currentUserId;
  const timeAgo = getTimeAgo(comment.createdAt);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    onReply(comment.id, replyContent.trim());
    setReplyContent("");
    setIsReplying(false);
    setShowReplies(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    onEdit(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="py-2">
      {/* Header with avatar, name, and time in one compact line */}
      <div className="flex items-center space-x-2 mb-2">
        {/* Small avatar */}
        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          {comment.User?.avatarUrl ? (
            <img
              src={comment.User.avatarUrl}
              alt={comment.User.nickname}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-300">
              {comment.User?.nickname?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
        </div>

        {/* Name and timestamp */}
        <Link
          to={`/users/${comment.userId}`}
          className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {comment.User?.nickname || "Unknown User"}
        </Link>
        <span className="text-gray-400 text-xs flex-shrink-0">•</span>
        <span className="text-gray-400 text-xs truncate">{timeAgo}</span>
      </div>

      {/* Comment content - full width */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mb-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 resize-none lightbox-scrollable break-words text-sm"
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
            }}
            rows="2"
            maxLength={150}
            autoFocus
          />
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              disabled={!editContent.trim()}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p
          className="text-gray-200 text-sm mb-2 leading-relaxed break-words"
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
          }}
        >
          {comment.content}
        </p>
      )}

      {/* Comment actions - compact */}
      {!isEditing && (
        <div className="flex items-center space-x-3 text-xs mb-2">
          {/* Only show Reply button on top-level comments */}
          {!isReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-gray-400 hover:text-blue-300 transition-colors"
            >
              Reply
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-yellow-300 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-gray-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </>
          )}

          {comment.Replies?.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-gray-400 hover:text-blue-300 transition-colors"
            >
              {showReplies ? "Hide" : "Show"} {comment.Replies.length} repl
              {comment.Replies.length === 1 ? "y" : "ies"}
            </button>
          )}
        </div>
      )}

      {/* Reply form - only for top-level comments */}
      {isReplying && !isReply && (
        <form onSubmit={handleReplySubmit} className="mb-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full bg-gray-700 text-white rounded px-3 py-2 resize-none lightbox-scrollable break-words text-sm"
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
            }}
            rows="2"
            maxLength={150}
            autoFocus
          />
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              disabled={!replyContent.trim()}
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReplyContent("");
              }}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Replies - minimal indentation */}
      {showReplies && comment.Replies?.length > 0 && (
        <div className="ml-4 pl-2 border-l border-gray-600 space-y-3">
          {comment.Replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              currentUserId={currentUserId}
              isReply={true} // Mark as reply so no nested reply button shows
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

export function CommentSection({ photoId }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Fetch current user's site profile data
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!user?.id) return;

      try {
        const token = await getToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const profile = await response.json();
          setCurrentUserProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching current user profile:", error);
      }
    };

    fetchCurrentUserProfile();
  }, [user?.id, getToken]);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/comments/photo/${photoId}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (photoId) {
      fetchComments();
    }
  }, [photoId]);

  // Create a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      const apiUrl = `${import.meta.env.VITE_API_URL}/comments`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          photoId,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const newCommentData = await response.json();

      // Ensure user data is present, fallback to current user's site data if missing
      if (!newCommentData.User || !newCommentData.User.nickname) {
        newCommentData.User = {
          id: user.id,
          nickname: currentUserProfile?.nickname || "You",
          avatarUrl: currentUserProfile?.avatarUrl || user.imageUrl,
        };
      }

      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Reply to a comment
  const handleReply = async (parentCommentId, content) => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          photoId,
          content,
          parentCommentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      const replyData = await response.json();

      // Ensure user data is present, fallback to current user's site data if missing
      if (!replyData.User || !replyData.User.nickname) {
        replyData.User = {
          id: user.id,
          nickname: currentUserProfile?.nickname || "You",
          avatarUrl: currentUserProfile?.avatarUrl || user.imageUrl,
        };
      }

      // Add reply to the parent comment
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentCommentId
            ? {
                ...comment,
                Replies: [...(comment.Replies || []), replyData],
              }
            : comment
        )
      );
    } catch (err) {
      console.error("Error posting reply:", err);
      setError("Failed to post reply");
    }
  };

  // Edit a comment
  const handleEdit = async (commentId, content) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to edit comment");
      }

      const updatedComment = await response.json();

      // Ensure user data is present, fallback to current user's site data if missing
      if (!updatedComment.User || !updatedComment.User.nickname) {
        updatedComment.User = {
          id: user.id,
          nickname: currentUserProfile?.nickname || "You",
          avatarUrl: currentUserProfile?.avatarUrl || user.imageUrl,
        };
      }

      // Update comment in state
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            // When updating a parent comment, preserve the existing replies
            return {
              ...updatedComment,
              Replies: comment.Replies || [],
            };
          }
          // Check if it's a reply
          if (comment.Replies) {
            return {
              ...comment,
              Replies: comment.Replies.map((reply) =>
                reply.id === commentId ? updatedComment : reply
              ),
            };
          }
          return comment;
        })
      );
    } catch (err) {
      console.error("Error editing comment:", err);
      setError("Failed to edit comment");
    }
  };

  // Delete a comment
  const handleDelete = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      // Remove comment from state
      setComments((prev) =>
        prev
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            Replies:
              comment.Replies?.filter((reply) => reply.id !== commentId) || [],
          }))
      );
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lightbox-scrollable">
      {/* New comment form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 lightbox-scrollable break-words text-sm"
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
          }}
          rows="2"
          maxLength={150}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">{newComment.length}/150</span>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors ml-3"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3 lightbox-scrollable">
        {comments.length === 0 ? (
          <div className="text-center text-gray-400 py-6">
            <p className="text-sm">No comments yet. Be the first!</p>
          </div>
        ) : (
          <>
            <h4 className="text-base font-medium text-white mb-3">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </h4>
            <div className="space-y-3 lightbox-scrollable">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  currentUserId={user?.id}
                  isReply={false} // Top-level comments
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
