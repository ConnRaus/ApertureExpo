import webpush from "web-push";
import models from "../database/models/index.js";

const { PushSubscription } = models;

// Configure web-push with VAPID keys
// You need to generate these keys and add them to your .env file
// Generate with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

// Only configure if keys are present
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("[PushNotificationService] VAPID keys configured successfully");
} else {
  console.warn(
    "[PushNotificationService] VAPID keys not configured. Push notifications will not work. " +
      "Generate keys with: npx web-push generate-vapid-keys"
  );
}

class PushNotificationService {
  /**
   * Check if push notifications are configured
   */
  static isConfigured() {
    return !!(vapidPublicKey && vapidPrivateKey);
  }

  /**
   * Get the public VAPID key (needed by frontend to subscribe)
   */
  static getPublicKey() {
    return vapidPublicKey;
  }

  /**
   * Save or update a push subscription for a user
   */
  static async saveSubscription(
    userId,
    subscription,
    userAgent = null,
    deviceId = null
  ) {
    try {
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new Error("Invalid subscription object");
      }

      const { endpoint, keys } = subscription;
      const { p256dh, auth } = keys;

      if (!p256dh || !auth) {
        throw new Error("Missing subscription keys");
      }

      // Check if this endpoint already exists
      const existing = await PushSubscription.findOne({
        where: { endpoint },
      });

      if (existing) {
        // Update the existing subscription
        await existing.update({
          userId,
          p256dh,
          auth,
          userAgent,
          deviceId,
          active: true,
        });
        console.log(
          `[PushNotificationService] Updated subscription for user ${userId}`
        );
        return existing;
      }

      // Create new subscription
      const newSubscription = await PushSubscription.create({
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent,
        deviceId,
        active: true,
      });

      console.log(
        `[PushNotificationService] Created new subscription for user ${userId}`
      );
      return newSubscription;
    } catch (error) {
      console.error(
        "[PushNotificationService] Error saving subscription:",
        error
      );
      throw error;
    }
  }

  /**
   * Remove a push subscription
   */
  static async removeSubscription(endpoint) {
    try {
      const subscription = await PushSubscription.findOne({
        where: { endpoint },
      });

      if (subscription) {
        await subscription.destroy();
        console.log("[PushNotificationService] Removed subscription");
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        "[PushNotificationService] Error removing subscription:",
        error
      );
      throw error;
    }
  }

  /**
   * Remove all subscriptions for a user
   */
  static async removeUserSubscriptions(userId) {
    try {
      const result = await PushSubscription.destroy({
        where: { userId },
      });

      console.log(
        `[PushNotificationService] Removed ${result} subscriptions for user ${userId}`
      );
      return result;
    } catch (error) {
      console.error(
        "[PushNotificationService] Error removing user subscriptions:",
        error
      );
      throw error;
    }
  }

  /**
   * Send a push notification to a specific user
   */
  static async sendToUser(userId, payload) {
    if (!this.isConfigured()) {
      console.warn(
        "[PushNotificationService] Cannot send push - VAPID not configured"
      );
      return { success: false, reason: "not_configured" };
    }

    try {
      // Get all active subscriptions for the user
      const subscriptions = await PushSubscription.findAll({
        where: {
          userId,
          active: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(
          `[PushNotificationService] No active subscriptions for user ${userId}`
        );
        return { success: true, sent: 0 };
      }

      const payloadString = JSON.stringify(payload);
      const results = [];

      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payloadString);

          // Update last push timestamp
          await sub.update({ lastPushAt: new Date() });

          results.push({ success: true, subscriptionId: sub.id });
          console.log(
            `[PushNotificationService] Sent push to subscription ${sub.id}`
          );
        } catch (pushError) {
          console.error(
            `[PushNotificationService] Error sending to subscription ${sub.id}:`,
            pushError.message
          );

          // If subscription is invalid (410 Gone or 404 Not Found), mark as inactive
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            await sub.update({ active: false });
            console.log(
              `[PushNotificationService] Marked subscription ${sub.id} as inactive`
            );
          }

          results.push({
            success: false,
            subscriptionId: sub.id,
            error: pushError.message,
            statusCode: pushError.statusCode,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `[PushNotificationService] Sent ${successCount}/${results.length} push notifications to user ${userId}`
      );

      return {
        success: true,
        sent: successCount,
        total: results.length,
        results,
      };
    } catch (error) {
      console.error("[PushNotificationService] Error sending to user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a push notification to multiple users
   */
  static async sendToUsers(userIds, payload) {
    if (!this.isConfigured()) {
      console.warn(
        "[PushNotificationService] Cannot send push - VAPID not configured"
      );
      return { success: false, reason: "not_configured" };
    }

    const results = [];
    for (const userId of userIds) {
      const result = await this.sendToUser(userId, payload);
      results.push({ userId, ...result });
    }

    const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);
    console.log(
      `[PushNotificationService] Sent ${totalSent} push notifications to ${userIds.length} users`
    );

    return {
      success: true,
      totalSent,
      userCount: userIds.length,
      results,
    };
  }

  /**
   * Send a notification with standard format
   * This is the main method to use when creating notifications
   */
  static async sendNotification(
    userId,
    { title, body, icon, badge, link, tag, data = {} }
  ) {
    const payload = {
      title,
      body,
      icon: icon || "/Logo192.png",
      badge: badge || "/Logo192.png",
      tag: tag || `notification-${Date.now()}`,
      data: {
        ...data,
        url: link || "/",
        timestamp: Date.now(),
      },
      // iOS specific options
      requireInteraction: false,
      renotify: true,
    };

    return this.sendToUser(userId, payload);
  }

  /**
   * Get subscription count for a user
   */
  static async getSubscriptionCount(userId) {
    try {
      const count = await PushSubscription.count({
        where: {
          userId,
          active: true,
        },
      });
      return count;
    } catch (error) {
      console.error(
        "[PushNotificationService] Error getting subscription count:",
        error
      );
      return 0;
    }
  }

  /**
   * Check if a user has any active subscriptions
   */
  static async hasActiveSubscription(userId) {
    const count = await this.getSubscriptionCount(userId);
    return count > 0;
  }
}

export default PushNotificationService;
