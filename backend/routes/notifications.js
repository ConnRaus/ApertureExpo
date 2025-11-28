import express from "express";
import { requireAuth } from "@clerk/express";
import models from "../database/models/index.js";
import { ensureUserExists } from "../middleware/ensureUserExists.js";
import NotificationService from "../services/notificationService.js";
import PushNotificationService from "../services/pushNotificationService.js";
import { getUserIdFromRequest } from "../utils/auth.js";

const {
  Notification,
  Contest,
  ForumThread,
  ForumPost,
  User,
  PushSubscription,
} = models;
const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      console.error("[Notifications] No userId found!");
      return res.status(401).json({ error: "Unauthorized - no userId" });
    }

    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 50, // Limit to last 50 notifications
      include: [
        {
          model: Contest,
          as: "Contest",
          attributes: ["id", "title"],
        },
        {
          model: ForumThread,
          as: "ForumThread",
          attributes: ["id", "title"],
        },
      ],
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count for the authenticated user
router.get(
  "/unread-count",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);

      if (!userId) {
        console.error("[Notifications] No userId found!");
        return res.status(401).json({ error: "Unauthorized - no userId" });
      }

      const count = await Notification.count({
        where: {
          userId,
          read: false,
        },
      });

      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  }
);

// Mark a notification as read
router.put("/:id/read", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.update({ read: true });

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/read-all", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    await Notification.update(
      { read: true },
      {
        where: {
          userId,
          read: false,
        },
      }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Delete a notification
router.delete("/:id", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.destroy();

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Create a notification (admin or system use)
router.post("/", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const { userId, type, title, message, link, contestId, threadId, postId } =
      req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        error: "Missing required fields: userId, title, message",
      });
    }

    const notification = await Notification.create({
      userId,
      type: type || "general",
      title,
      message,
      link,
      contestId,
      threadId,
      postId,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Test endpoint: Manually trigger contest ended notifications
router.post(
  "/test/contest-ended/:contestId",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const { contestId } = req.params;

      console.log(
        `[TEST] Manually triggering contest ended notifications for contest ${contestId}`
      );

      const result = await NotificationService.notifyContestEnded(contestId);

      if (result && result.success) {
        res.json({
          success: true,
          message: `Created ${result.count} notifications for contest ${contestId}`,
          count: result.count,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result?.error || "Failed to create notifications",
        });
      }
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ error: "Failed to trigger notifications" });
    }
  }
);

// Test endpoint: Manually trigger voting started notifications
router.post(
  "/test/voting-started/:contestId",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const { contestId } = req.params;

      console.log(
        `[TEST] Manually triggering voting started notifications for contest ${contestId}`
      );

      const result = await NotificationService.notifyContestVotingStarted(
        contestId
      );

      if (result && result.success) {
        res.json({
          success: true,
          message: `Created ${result.count} voting notifications for contest ${contestId}`,
          count: result.count,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result?.error || "Failed to create notifications",
        });
      }
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ error: "Failed to trigger notifications" });
    }
  }
);

// ============================================
// PUSH NOTIFICATION SUBSCRIPTION ENDPOINTS
// ============================================

// Get VAPID public key (needed by frontend to subscribe)
router.get("/push/vapid-public-key", (req, res) => {
  const publicKey = PushNotificationService.getPublicKey();

  if (!publicKey) {
    return res.status(503).json({
      error: "Push notifications are not configured on the server",
      configured: false,
    });
  }

  res.json({
    publicKey,
    configured: true,
  });
});

// Subscribe to push notifications
router.post(
  "/push/subscribe",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { subscription, deviceId } = req.body;

      if (!subscription) {
        return res
          .status(400)
          .json({ error: "Subscription object is required" });
      }

      const userAgent = req.headers["user-agent"] || null;

      const savedSubscription = await PushNotificationService.saveSubscription(
        userId,
        subscription,
        userAgent,
        deviceId
      );

      res.json({
        success: true,
        message: "Successfully subscribed to push notifications",
        subscriptionId: savedSubscription.id,
      });
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      res
        .status(500)
        .json({ error: "Failed to subscribe to push notifications" });
    }
  }
);

// Unsubscribe from push notifications
router.post(
  "/push/unsubscribe",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
      }

      const removed = await PushNotificationService.removeSubscription(
        endpoint
      );

      res.json({
        success: true,
        removed,
        message: removed
          ? "Successfully unsubscribed from push notifications"
          : "Subscription not found",
      });
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      res
        .status(500)
        .json({ error: "Failed to unsubscribe from push notifications" });
    }
  }
);

// Get push notification status for the current user
router.get(
  "/push/status",
  requireAuth(),
  ensureUserExists,
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);

      const subscriptionCount =
        await PushNotificationService.getSubscriptionCount(userId);
      const isConfigured = PushNotificationService.isConfigured();

      res.json({
        configured: isConfigured,
        subscribed: subscriptionCount > 0,
        subscriptionCount,
      });
    } catch (error) {
      console.error("Error getting push status:", error);
      res.status(500).json({ error: "Failed to get push notification status" });
    }
  }
);

// Test endpoint: Send a test push notification to the current user
router.post("/push/test", requireAuth(), ensureUserExists, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    const result = await PushNotificationService.sendNotification(userId, {
      title: "Test Notification",
      body: "This is a test push notification from Aperture Expo!",
      link: "/",
      tag: "test-notification",
    });

    res.json({
      success: true,
      message: "Test notification sent",
      result,
    });
  } catch (error) {
    console.error("Error sending test push notification:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
