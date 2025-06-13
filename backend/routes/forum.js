import express from "express";
import models from "../database/models/index.js";
import { requireAuth, clerkClient } from "@clerk/express";
import { getUserIdFromRequest } from "../utils/auth.js";

const router = express.Router();
const { ForumThread, ForumPost, User, Photo } = models;

// Cache for user images with a shorter expiry
const userImageCache = new Map();
const CACHE_EXPIRY = 60 * 1000; // 1 minute in milliseconds
const REFRESH_THRESHOLD = 10 * 60 * 1000; // Force refresh after 10 minutes

// Constants for forum categories
const FORUM_CATEGORIES = [
  "General",
  "Photography Tips",
  "Equipment",
  "Contest Discussion",
  "Post-Processing",
  "Critique & Feedback",
  "Other",
];

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
 * Transform an array of threads with Clerk data
 */
const transformThreadsWithClerkData = async (threads) => {
  const transformedThreads = [];

  for (const thread of threads) {
    const threadData = thread.toJSON ? thread.toJSON() : thread;

    if (threadData.author) {
      // Save the original ID and nickname to ensure they're preserved
      const authorId = threadData.author.id;
      const authorNickname = threadData.author.nickname;

      threadData.author = await addClerkImageToUser(threadData.author);

      // Ensure the ID and nickname are preserved
      threadData.author.id = authorId;
      threadData.author.nickname = authorNickname;
    }

    // Add Clerk image to photo author if photo exists
    if (threadData.photo && threadData.photo.User) {
      const photoAuthorId = threadData.photo.User.id;
      const photoAuthorNickname = threadData.photo.User.nickname;

      threadData.photo.User = await addClerkImageToUser(threadData.photo.User);

      // Ensure the ID and nickname are preserved
      threadData.photo.User.id = photoAuthorId;
      threadData.photo.User.nickname = photoAuthorNickname;
    }

    transformedThreads.push(threadData);
  }

  return transformedThreads;
};

/**
 * Transform an array of posts with Clerk data
 */
const transformPostsWithClerkData = async (posts) => {
  const transformedPosts = [];

  for (const post of posts) {
    const postData = post.toJSON ? post.toJSON() : post;
    if (postData.author) {
      postData.author = await addClerkImageToUser(postData.author);
    }
    // Add Clerk image to photo author if photo exists
    if (postData.photo && postData.photo.User) {
      const photoAuthorId = postData.photo.User.id;
      const photoAuthorNickname = postData.photo.User.nickname;

      postData.photo.User = await addClerkImageToUser(postData.photo.User);

      // Ensure the ID and nickname are preserved
      postData.photo.User.id = photoAuthorId;
      postData.photo.User.nickname = photoAuthorNickname;
    }
    transformedPosts.push(postData);
  }

  return transformedPosts;
};

// Get all forum threads (with pagination)
router.get("/threads", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category || null;

    const whereClause = category ? { category } : {};

    const { count, rows: threads } = await ForumThread.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [
        ["isPinned", "DESC"],
        ["lastActivityAt", "DESC"],
      ],
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    // For each thread, get the count of posts
    const threadsWithCounts = await Promise.all(
      threads.map(async (thread) => {
        const postCount = await ForumPost.count({
          where: { threadId: thread.id },
        });
        return {
          ...thread.toJSON(),
          postCount,
        };
      })
    );

    // Transform threads with Clerk data
    const transformedThreads = await transformThreadsWithClerkData(
      threadsWithCounts
    );

    res.json({
      threads: transformedThreads,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalThreads: count,
    });
  } catch (error) {
    console.error("Error fetching forum threads:", error);
    res.status(500).json({ error: "Failed to fetch forum threads" });
  }
});

// Get thread categories
router.get("/categories", async (req, res) => {
  try {
    // Return predefined categories instead of querying the database
    res.json(FORUM_CATEGORIES);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get a specific thread with its posts
router.get("/threads/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Increment view count
    await ForumThread.increment("viewCount", { where: { id: threadId } });

    // Get thread details
    const thread = await ForumThread.findByPk(threadId, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Get posts for the thread with pagination
    const { count, rows: posts } = await ForumPost.findAndCountAll({
      where: { threadId },
      limit,
      offset,
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    // Transform thread data with Clerk image
    const threadData = thread.toJSON();

    // Make sure thread author data is correct
    if (threadData.author) {
      // Save the original ID and nickname to ensure they're preserved
      const authorId = threadData.author.id;
      const authorNickname = threadData.author.nickname;

      threadData.author = await addClerkImageToUser(threadData.author);

      // Ensure the ID and nickname are preserved
      threadData.author.id = authorId;
      threadData.author.nickname = authorNickname;
    }

    // Add Clerk image to thread photo author if photo exists
    if (threadData.photo && threadData.photo.User) {
      const photoAuthorId = threadData.photo.User.id;
      const photoAuthorNickname = threadData.photo.User.nickname;

      threadData.photo.User = await addClerkImageToUser(threadData.photo.User);

      // Ensure the ID and nickname are preserved
      threadData.photo.User.id = photoAuthorId;
      threadData.photo.User.nickname = photoAuthorNickname;
    }

    // Transform posts with Clerk data
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        const postData = post.toJSON();

        if (postData.author) {
          // Save the original ID and nickname to ensure they're preserved
          const authorId = postData.author.id;
          const authorNickname = postData.author.nickname;

          postData.author = await addClerkImageToUser(postData.author);

          // Ensure the ID and nickname are preserved
          postData.author.id = authorId;
          postData.author.nickname = authorNickname;
        }
        return postData;
      })
    );

    res.json({
      thread: threadData,
      posts: transformedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPosts: count,
    });
  } catch (error) {
    console.error("Error fetching thread details:", error);
    res.status(500).json({ error: "Failed to fetch thread details" });
  }
});

// Create a new thread
router.post("/threads", requireAuth(), async (req, res) => {
  try {
    const { title, content, category, photoId } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (!FORUM_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const thread = await ForumThread.create({
      title,
      content,
      category,
      photoId,
      userId,
    });

    // Fetch the created thread with author information and photo
    const threadWithAuthor = await ForumThread.findByPk(thread.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    res.status(201).json(threadWithAuthor);
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// Create a new post in a thread
router.post("/threads/:threadId/posts", requireAuth(), async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, photoId } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Check if thread exists and is not locked
    const thread = await ForumThread.findByPk(threadId);

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    if (thread.isLocked) {
      return res.status(403).json({ error: "Thread is locked" });
    }

    const post = await ForumPost.create({
      content,
      photoId,
      userId,
      threadId,
    });

    // Update the thread's last activity timestamp
    await thread.update({ lastActivityAt: new Date() });

    // Fetch the created post with author information and photo
    const postWithAuthor = await ForumPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    // Add Clerk image to author
    const postData = postWithAuthor.toJSON();

    if (postData.author) {
      // Save the original ID and nickname
      const authorId = postData.author.id;
      const authorNickname = postData.author.nickname;

      postData.author = await addClerkImageToUser(postData.author);

      // Ensure the ID and nickname are preserved
      postData.author.id = authorId;
      postData.author.nickname = authorNickname;
    }

    // Add Clerk image to photo author if photo exists
    if (postData.photo && postData.photo.User) {
      const photoAuthorId = postData.photo.User.id;
      const photoAuthorNickname = postData.photo.User.nickname;

      postData.photo.User = await addClerkImageToUser(postData.photo.User);

      // Ensure the ID and nickname are preserved
      postData.photo.User.id = photoAuthorId;
      postData.photo.User.nickname = photoAuthorNickname;
    }

    res.status(201).json(postData);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Update a thread (title, content, or category)
router.put("/threads/:threadId", requireAuth(), async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, content, category, photoId } = req.body;
    const userId = getUserIdFromRequest(req);

    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Only allow the thread author to update it
    if (thread.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await thread.update({
      title: title || thread.title,
      content: content || thread.content,
      category: category || thread.category,
      photoId: photoId !== undefined ? photoId : thread.photoId,
    });

    // Fetch updated thread with author and photo
    const updatedThread = await ForumThread.findByPk(threadId, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    res.json(updatedThread);
  } catch (error) {
    console.error("Error updating thread:", error);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Update a post
router.put("/posts/:postId", requireAuth(), async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, photoId } = req.body;
    const userId = getUserIdFromRequest(req);

    const post = await ForumPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Only allow the post author to update it
    if (post.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await post.update({
      content,
      photoId,
      isEdited: true,
    });

    // Fetch updated post with author and photo
    const updatedPost = await ForumPost.findByPk(postId, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
        {
          model: Photo,
          as: "photo",
          attributes: [
            "id",
            "title",
            "description",
            "thumbnailUrl",
            "s3Url",
            "userId",
            "metadata",
          ],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
        },
      ],
    });

    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Delete a thread
router.delete("/threads/:threadId", requireAuth(), async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = getUserIdFromRequest(req);

    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Only allow the thread author to delete it
    if (thread.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await thread.destroy();
    res.json({ message: "Thread deleted successfully" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// Delete a post
router.delete("/posts/:postId", requireAuth(), async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = getUserIdFromRequest(req);

    const post = await ForumPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Only allow the post author to delete it
    if (post.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await post.destroy();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Pin or unpin a thread (admin only)
router.patch("/threads/:threadId/pin", requireAuth(), async (req, res) => {
  try {
    const { threadId } = req.params;
    const { isPinned } = req.body;
    const userId = getUserIdFromRequest(req);

    // Here you would check if the user is an admin
    // For now, we'll just update based on the request

    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    await thread.update({ isPinned });
    res.json(thread);
  } catch (error) {
    console.error("Error updating thread pin status:", error);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Lock or unlock a thread (admin only)
router.patch("/threads/:threadId/lock", requireAuth(), async (req, res) => {
  try {
    const { threadId } = req.params;
    const { isLocked } = req.body;
    const userId = getUserIdFromRequest(req);

    // Here you would check if the user is an admin
    // For now, we'll just update based on the request

    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    await thread.update({ isLocked });
    res.json(thread);
  } catch (error) {
    console.error("Error updating thread lock status:", error);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Clear profile image cache for a user
router.post("/clear-image-cache", requireAuth(), async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    // Remove from cache
    userImageCache.delete(userId);

    // Fetch fresh image
    const clerkUser = await clerkClient.users.getUser(userId);
    const imageUrl = clerkUser.imageUrl || null;

    // Update cache with new data
    userImageCache.set(userId, {
      imageUrl,
      timestamp: Date.now(),
      lastFetchTime: Date.now(),
    });

    res.json({
      success: true,
      message: "Image cache cleared and refreshed",
      imageUrl,
    });
  } catch (error) {
    console.error("Error clearing image cache:", error);
    res.status(500).json({ error: "Failed to clear image cache" });
  }
});

export default router;
