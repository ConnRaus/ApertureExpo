import React, { useState, useEffect } from "react";
import { usePushNotifications } from "../../hooks";

/**
 * Push Notification Prompt Component
 * 
 * Shows a prompt to enable push notifications.
 * iOS Note: For iOS, the app must be installed (Add to Home Screen) for push to work.
 * The permission request MUST be triggered by a user gesture (click/tap).
 */
function PushNotificationPrompt({ 
  variant = "banner", // "banner", "inline", "button"
  onSubscribed,
  onDismissed,
  className = ""
}) {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    isInstalledPWA,
    canSubscribe,
    subscribe,
  } = usePushNotifications();

  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem("aperture_push_prompt_dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleEnableClick = async () => {
    // On iOS, if not installed as PWA, show instructions
    if (isIOS && !isInstalledPWA) {
      setShowIOSInstructions(true);
      return;
    }

    const result = await subscribe();
    
    if (result.success) {
      onSubscribed?.();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("aperture_push_prompt_dismissed", "true");
    onDismissed?.();
  };

  // Don't show if not supported, already subscribed, permission denied, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || isDismissed) {
    return null;
  }

  // iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">
            📱 Enable Notifications on iOS
          </h3>
          <p className="text-gray-300 mb-4">
            To receive push notifications on your iPhone or iPad, you need to add Aperture Expo to your Home Screen first:
          </p>
          <ol className="text-gray-300 space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm">1</span>
              <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm">2</span>
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm">3</span>
              <span>Open the app from your Home Screen</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm">4</span>
              <span>Then enable notifications from the notification bell</span>
            </li>
          </ol>
          <div className="flex gap-3">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Button variant - simple enable button
  if (variant === "button") {
    return (
      <button
        onClick={handleEnableClick}
        disabled={isLoading || !canSubscribe}
        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {isLoading ? "Enabling..." : "Enable Notifications"}
      </button>
    );
  }

  // Inline variant - small inline prompt
  if (variant === "inline") {
    return (
      <div className={`flex items-center justify-between gap-3 p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <span className="text-sm text-gray-200">Enable push notifications?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnableClick}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? "..." : "Enable"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-2 py-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Banner variant (default) - full-width banner
  return (
    <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-medium">Stay updated with push notifications!</p>
            <p className="text-sm text-indigo-100">
              Get notified about contest results, comments, and more.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnableClick}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Enabling..." : "Enable Notifications"}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-indigo-200 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {error && (
        <div className="max-w-7xl mx-auto mt-2">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}

export default PushNotificationPrompt;

