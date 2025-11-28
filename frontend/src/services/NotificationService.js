const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Convert a base64 string to Uint8Array (needed for applicationServerKey)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationService {
  /**
   * Get all notifications for the authenticated user
   */
  static async getNotifications(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread-count`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId, token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      return await response.json();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      return await response.json();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId, token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // ============================================
  // PUSH NOTIFICATION METHODS
  // ============================================

  /**
   * Check if the browser supports push notifications
   * On iOS, we check more leniently since PushManager may not be available
   * until the service worker is registered
   */
  static isPushSupported() {
    // Basic requirement: service workers must be supported
    if (!("serviceWorker" in navigator)) {
      console.log("[NotificationService] Service workers not supported");
      return false;
    }

    // Push notifications require HTTPS (except on localhost)
    const isSecure = window.location.protocol === "https:" || 
                     window.location.hostname === "localhost" ||
                     window.location.hostname === "127.0.0.1";
    
    if (!isSecure) {
      console.log("[NotificationService] Push requires HTTPS. Current protocol:", window.location.protocol);
      return false;
    }

    // On iOS, we allow showing the toggle even if PushManager isn't available yet
    // because it becomes available once the service worker is registered
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                         window.navigator.standalone === true;
    
    if (isIOS) {
      // On iOS, only show if installed as PWA (standalone mode)
      // PushManager may not be available until SW is ready
      console.log("[NotificationService] iOS detected. Standalone:", isStandalone);
      return isStandalone && "Notification" in window;
    }

    // For non-iOS browsers, check full support
    const supported = "PushManager" in window && "Notification" in window;
    console.log("[NotificationService] Push supported:", supported);
    return supported;
  }

  /**
   * Check if we're running as an installed PWA
   * Important for iOS which requires the app to be installed for push to work
   */
  static isInstalledPWA() {
    // Check if running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    return isStandalone;
  }

  /**
   * Get the current notification permission status
   */
  static getPermissionStatus() {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from the user
   * Must be called in response to a user gesture on iOS
   */
  static async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      console.log("[NotificationService] Permission result:", permission);
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      throw error;
    }
  }

  /**
   * Get the VAPID public key from the server
   */
  static async getVapidPublicKey() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/push/vapid-public-key`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get VAPID key");
      }

      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error("Error getting VAPID public key:", error);
      throw error;
    }
  }

  /**
   * Register the service worker if not already registered
   */
  static async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not supported");
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("[NotificationService] Service worker registered:", registration.scope);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      return registration;
    } catch (error) {
      console.error("Error registering service worker:", error);
      throw error;
    }
  }

  /**
   * Get the current service worker registration
   */
  static async getServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error("Error getting service worker registration:", error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   * This should be called after the user grants permission
   */
  static async subscribeToPush(token) {
    if (!this.isPushSupported()) {
      throw new Error("Push notifications are not supported");
    }

    try {
      // Ensure service worker is registered
      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        throw new Error("Service worker not registered");
      }

      // Get the VAPID public key from the server
      const vapidPublicKey = await this.getVapidPublicKey();
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not available");
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("[NotificationService] Push subscription created:", subscription.endpoint);

      // Send the subscription to the server
      const response = await fetch(`${API_BASE_URL}/notifications/push/subscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceId: this.getDeviceId(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription to server");
      }

      const data = await response.json();
      console.log("[NotificationService] Subscription saved to server:", data);

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(token) {
    try {
      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        return false;
      }

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from server
      await fetch(`${API_BASE_URL}/notifications/push/unsubscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      console.log("[NotificationService] Unsubscribed from push notifications");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  /**
   * Check if currently subscribed to push notifications
   */
  static async isSubscribedToPush() {
    try {
      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking push subscription:", error);
      return false;
    }
  }

  /**
   * Get push notification status from server
   */
  static async getPushStatus(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/push/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get push status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting push status:", error);
      throw error;
    }
  }

  /**
   * Send a test push notification
   */
  static async sendTestPush(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/push/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to send test notification");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending test push:", error);
      throw error;
    }
  }

  /**
   * Generate or retrieve a device ID for this browser
   * Used to prevent duplicate subscriptions per device
   */
  static getDeviceId() {
    let deviceId = localStorage.getItem("aperture_device_id");
    if (!deviceId) {
      deviceId = "device_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("aperture_device_id", deviceId);
    }
    return deviceId;
  }

  /**
   * Full push notification setup flow
   * Call this to handle the entire subscription process
   */
  static async setupPushNotifications(token) {
    // Check support
    if (!this.isPushSupported()) {
      return {
        success: false,
        reason: "unsupported",
        message: "Push notifications are not supported in this browser",
      };
    }

    // Request permission
    const permission = await this.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        reason: "permission_denied",
        message: "Notification permission was denied",
      };
    }

    // Subscribe to push
    try {
      const subscription = await this.subscribeToPush(token);
      return {
        success: true,
        subscription,
        message: "Successfully subscribed to push notifications",
      };
    } catch (error) {
      return {
        success: false,
        reason: "subscription_failed",
        message: error.message,
      };
    }
  }
}

export default NotificationService;
