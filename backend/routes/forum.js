import express from "express";
import models from "../database/models/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const { ForumThread, ForumPost, User } = models;

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

    res.json({
      threads: threadsWithCounts,
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
    const categories = await ForumThread.findAll({
      attributes: ["category"],
      group: ["category"],
    });
    res.json(categories.map((c) => c.category));
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
      ],
    });

    res.json({
      thread,
      posts,
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
router.post("/threads", requireAuth, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const thread = await ForumThread.create({
      title,
      content,
      category: category || "General",
      userId,
    });

    // Fetch the created thread with author information
    const threadWithAuthor = await ForumThread.findByPk(thread.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
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
router.post("/threads/:threadId/posts", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

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
      userId,
      threadId,
    });

    // Update the thread's last activity timestamp
    await thread.update({ lastActivityAt: new Date() });

    // Fetch the created post with author information
    const postWithAuthor = await ForumPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
        },
      ],
    });

    res.status(201).json(postWithAuthor);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Update a thread (title, content, or category)
router.put("/threads/:threadId", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.id;

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
    });

    res.json(thread);
  } catch (error) {
    console.error("Error updating thread:", error);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Update a post
router.put("/posts/:postId", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

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
      isEdited: true,
    });

    // Fetch updated post with author
    const updatedPost = await ForumPost.findByPk(postId, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "nickname"],
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
router.delete("/threads/:threadId", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

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
router.delete("/posts/:postId", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

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
router.patch("/threads/:threadId/pin", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { isPinned } = req.body;
    const userId = req.user.id;

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
router.patch("/threads/:threadId/lock", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { isLocked } = req.body;
    const userId = req.user.id;

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

export default router;
