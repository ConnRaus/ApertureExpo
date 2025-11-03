import express from "express";
import models from "../database/models/index.js";
import { requireAuth, clerkClient } from "@clerk/express";
import { ensureUserExists } from "../middleware/ensureUserExists.js";
import { getUserIdFromRequest } from "../utils/auth.js";
import { Op } from "sequelize";
import NotificationService from "../services/notificationService.js";

const { Comment, Photo, User } = models;
const router = express.Router();

// Cache for user images with a shorter expiry
const userImageCache = new Map();
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * Helper function to add Clerk image URL to a user object
 */
const addClerkImageToUser = async (user) => {
  if (!user) return user;

  const userId = user.id;

  try {
    // Check if we have a cached image URL that's not expired
    const cachedData = userImageCache.get(userId);
    const now = Date.now();

    // Use cache if it exists, isn't expired, and isn't due for a refresh check
    if (
      cachedData &&
      now - cachedData.timestamp < CACHE_EXPIRY &&
      now - cachedData.lastFetchTime < REFRESH_THRESHOLD
    ) {
      // Add the avatar URL without modifying other fields
      return {
        ...user,
        avatarUrl: cachedData.imageUrl,
      };
    }

    // If cache exists but due for refresh check, use cached value but trigger background refresh
    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
      // Schedule async refresh without waiting for it
      setTimeout(async () => {
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          const newImageUrl = clerkUser.imageUrl || null;

          // Only update cache if image URL has changed
          if (newImageUrl !== cachedData.imageUrl) {
            userImageCache.set(userId, {
              imageUrl: newImageUrl,
              timestamp: Date.now(),
              lastFetchTime: Date.now(),
            });
          }
        } catch (error) {
          console.error(`Background refresh error for ${userId}:`, error);
        }
      }, 0);

      // Add the avatar URL without modifying other fields
      return {
        ...user,
        avatarUrl: cachedData.imageUrl,
      };
    }

    // Fetch from Clerk if not cached or expired
    const clerkUser = await clerkClient.users.getUser(userId);
    const imageUrl = clerkUser.imageUrl || null;

    // Cache the image URL with current timestamp
    userImageCache.set(userId, {
      imageUrl,
      timestamp: Date.now(),
      lastFetchTime: Date.now(),
    });

    // Add the avatar URL without modifying other fields
    return {
      ...user,
      avatarUrl: imageUrl,
    };
  } catch (error) {
    console.error(`Error fetching Clerk data for user ${userId}:`, error);

    // If there's an error but we have cached data, use it
    const cachedData = userImageCache.get(userId);
    if (cachedData) {
      return {
        ...user,
        avatarUrl: cachedData.imageUrl,
      };
    }

    return user; // Return user without image in case of error
  }
};

/**
 * Transform comments with Clerk data
 */
const transformCommentsWithClerkData = async (comments) => {
  const transformedComments = [];

  for (const comment of comments) {
    const commentData = comment.toJSON ? comment.toJSON() : comment;

    if (commentData.User) {
      commentData.User = await addClerkImageToUser(commentData.User);
    }

    // Transform replies too
    if (commentData.Replies && commentData.Replies.length > 0) {
      const transformedReplies = [];
      for (const reply of commentData.Replies) {
        const replyData = reply.toJSON ? reply.toJSON() : reply;
        if (replyData.User) {
          replyData.User = await addClerkImageToUser(replyData.User);
        }
        transformedReplies.push(replyData);
      }
      commentData.Replies = transformedReplies;
    }

    transformedComments.push(commentData);
  }

  return transformedComments;
};

// Get comments for a specific photo
router.get("/photo/:photoId", async (req, res) => {
  try {
    const { photoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Check if photo exists
    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Get top-level comments (no parent) with their replies
    const comments = await Comment.findAndCountAll({
      where: {
        photoId,
        parentCommentId: null, // Only top-level comments
      },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "nickname"],
        },
        {
          model: Comment,
          as: "Replies",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Transform comments with Clerk data
    const transformedComments = await transformCommentsWithClerkData(
      comments.rows
    );

    res.json({
      comments: transformedComments,
      pagination: {
        page,
        limit,
        totalComments: comments.count,
        totalPages: Math.ceil(comments.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new comment
router.post("/", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const { photoId, content, parentCommentId } = req.body;
    const userId = getUserIdFromRequest(req);

    // Validate required fields
    if (!photoId || !content) {
      return res.status(400).json({
        message: "Photo ID and content are required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    // Check if photo exists
    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // If it's a reply, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findByPk(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      // Ensure parent comment is for the same photo
      if (parentComment.photoId !== photoId) {
        return res.status(400).json({
          message: "Parent comment is not for this photo",
        });
      }
    }

    // Create the comment
    const comment = await Comment.create({
      userId,
      photoId,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
    });

    // Send notification based on comment type
    if (parentCommentId) {
      // This is a reply to another comment
      const parentComment = await Comment.findByPk(parentCommentId);
      if (parentComment) {
        await NotificationService.notifyCommentReply(
          parentCommentId,
          parentComment.userId,
          userId
        );
      }
    } else {
      // This is a new comment on a photo
      await NotificationService.notifyPhotoComment(
        photoId,
        photo.userId,
        userId
      );
    }

    // Fetch the created comment with user info
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // Transform comment with Clerk data to get avatar
    const transformedComment = await addClerkImageToUser(commentWithUser.User);
    const responseComment = commentWithUser.toJSON();
    responseComment.User = transformedComment;

    res.status(201).json(responseComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a comment
router.put("/:commentId", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    // Find the comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      return res.status(403).json({
        message: "You can only edit your own comments",
      });
    }

    // Update the comment
    await comment.update({ content: content.trim() });

    // Fetch updated comment with user info
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // Transform comment with Clerk data to get avatar
    const transformedUser = await addClerkImageToUser(updatedComment.User);
    const responseComment = updatedComment.toJSON();
    responseComment.User = transformedUser;

    res.json(responseComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a comment
router.delete(
  "/:commentId",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = getUserIdFromRequest(req);

      if (!userId) {
        return res.status(401).json({
          message: "User authentication required",
        });
      }

      // Find the comment
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns the comment
      if (comment.userId !== userId) {
        return res.status(403).json({
          message: "You can only delete your own comments",
        });
      }

      // Delete the comment (CASCADE will handle replies)
      await comment.destroy();

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get comment count for a photo
router.get("/photo/:photoId/count", async (req, res) => {
  try {
    const { photoId } = req.params;

    // Check if photo exists
    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const count = await Comment.count({
      where: { photoId },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error getting comment count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
