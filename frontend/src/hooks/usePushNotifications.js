import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import NotificationService from "../services/NotificationService";

/**
 * Detect if running on a mobile device
 */
function isMobileDevice() {
  // Check for mobile user agent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  
  // Also check for touch capability and screen size as fallback
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobileUA || (isTouchDevice && isSmallScreen);
}

/**
 * Custom hook for managing PWA push notifications
 * Handles permission requests, subscription management, and status tracking
 * 
 * Note: Push notifications are only shown/available on mobile devices
 */
export function usePushNotifications() {
  const { getToken, isSignedIn } = useAuth();
  
  // State
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInstalledPWA, setIsInstalledPWA] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check support and current status on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if on mobile device first - push notifications are mobile-only
        const mobile = isMobileDevice();
        setIsMobile(mobile);
        
        // If not on mobile, skip all push notification setup
        if (!mobile) {
          console.log("[usePushNotifications] Desktop detected, push notifications disabled");
          setIsLoading(false);
          return;
        }

        // Check if installed as PWA
        const installed = NotificationService.isInstalledPWA();
        setIsInstalledPWA(installed);

        // Check if push is supported
        const supported = NotificationService.isPushSupported();
        setIsSupported(supported);

        console.log("[usePushNotifications] Support check:", { supported, installed, mobile });

        // Get current permission status
        if ("Notification" in window) {
          const currentPermission = NotificationService.getPermissionStatus();
          setPermission(currentPermission);
          console.log("[usePushNotifications] Permission status:", currentPermission);
        }

        // Check if already subscribed (only if fully supported)
        if (supported && "PushManager" in window) {
          try {
            const subscribed = await NotificationService.isSubscribedToPush();
            setIsSubscribed(subscribed);
            console.log("[usePushNotifications] Subscription status:", subscribed);
          } catch (subErr) {
            console.log("[usePushNotifications] Could not check subscription (SW may not be ready yet)");
          }
        }
      } catch (err) {
        console.error("Error checking push notification support:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait a bit for service worker to potentially initialize
    const timer = setTimeout(checkSupport, 500);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSignedIn) {
      setError("You must be signed in to enable notifications");
      return { success: false, reason: "not_signed_in" };
    }

    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return { success: false, reason: "unsupported" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const result = await NotificationService.setupPushNotifications(token);

      if (result.success) {
        setIsSubscribed(true);
        setPermission("granted");
      } else {
        setError(result.message);
        if (result.reason === "permission_denied") {
          setPermission("denied");
        }
      }

      return result;
    } catch (err) {
      console.error("Error subscribing to push notifications:", err);
      setError(err.message);
      return { success: false, reason: "error", message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, isSupported, getToken]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSignedIn) {
      return { success: false, reason: "not_signed_in" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      await NotificationService.unsubscribeFromPush(token);
      setIsSubscribed(false);
      return { success: true };
    } catch (err) {
      console.error("Error unsubscribing from push notifications:", err);
      setError(err.message);
      return { success: false, reason: "error", message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSignedIn || !isSubscribed) {
      return { success: false };
    }

    try {
      const token = await getToken();
      const result = await NotificationService.sendTestPush(token);
      return result;
    } catch (err) {
      console.error("Error sending test notification:", err);
      return { success: false, error: err.message };
    }
  }, [isSignedIn, isSubscribed, getToken]);

  // Refresh subscription status
  const refreshStatus = useCallback(async () => {
    if (!isSupported) return;

    try {
      const subscribed = await NotificationService.isSubscribedToPush();
      setIsSubscribed(subscribed);

      const currentPermission = NotificationService.getPermissionStatus();
      setPermission(currentPermission);
    } catch (err) {
      console.error("Error refreshing push status:", err);
    }
  }, [isSupported]);

  return {
    // Status
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    isInstalledPWA,
    isMobile,
    
    // Computed - all require mobile device
    canSubscribe: isMobile && isSupported && !isSubscribed && permission !== "denied",
    shouldPrompt: isMobile && isSupported && !isSubscribed && permission === "default" && isSignedIn,
    
    // Show "Add to Home Screen" prompt: mobile browser, not installed as PWA
    shouldShowInstallPrompt: isMobile && !isInstalledPWA && isSignedIn,
    
    // Show notification toggle: mobile PWA only
    shouldShowNotificationToggle: isMobile && isInstalledPWA,
    
    // Actions
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus,
  };
}

export default usePushNotifications;

