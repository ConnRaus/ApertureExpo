import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import NotificationService from "../../services/NotificationService";
import { usePushNotifications } from "../../hooks";
import styles from "./NotificationBell.module.css";

function NotificationBell() {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Push notification state - only relevant on mobile
  const {
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    isLoading: pushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    shouldShowNotificationToggle,
    shouldShowInstallPrompt,
    isMobile,
    isInstalledPWA,
  } = usePushNotifications();

  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showInstallInstructions) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = "";
        document.body.style.width = "";
      };
    }
  }, [showInstallInstructions]);

  // Bottom sheet swipe-to-dismiss state
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const handleSheetTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleSheetTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY.current;
    // Only allow dragging down (positive delta)
    setSheetDragY(Math.max(0, delta));
  };

  const handleSheetTouchEnd = () => {
    setIsDragging(false);
    // If dragged more than 100px down, dismiss
    if (sheetDragY > 100) {
      setShowInstallInstructions(false);
    }
    setSheetDragY(0);
  };

  // Fetch unread count periodically
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchUnreadCount = async () => {
      try {
        const token = await getToken();
        const count = await NotificationService.getUnreadCount(token);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen && isSignedIn) {
      fetchNotifications();
    }
  }, [isOpen, isSignedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await NotificationService.getNotifications(token);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = await getToken();

      // Mark as read
      if (!notification.read) {
        await NotificationService.markAsRead(notification.id, token);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }

      // Navigate to the link if it exists
      if (notification.link) {
        setIsOpen(false);
        navigate(notification.link);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getToken();
      await NotificationService.markAllAsRead(token);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const token = await getToken();
      await NotificationService.deleteNotification(notificationId, token);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(
        (n) => n.id === notificationId
      );
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type, title) => {
    // Check title for voting started messages
    if (title && title.includes("Voting")) {
      return "🗳️";
    }

    switch (type) {
      case "contest_ended":
        return "🏆";
      case "forum_reply":
        return "💬";
      case "contest_winner":
        return "🥇";
      default:
        return "📢";
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className={styles.notificationBell} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {/* Install Instructions Bottom Sheet - rendered via Portal to escape any parent transforms */}
      {showInstallInstructions &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: 99998,
                opacity: Math.max(0, 1 - sheetDragY / 200),
                transition: isDragging ? "none" : "opacity 0.2s ease-out",
                touchAction: "none",
                overscrollBehavior: "contain",
              }}
              onClick={() => setShowInstallInstructions(false)}
              onTouchMove={(e) => e.preventDefault()}
            />
            {/* Bottom Sheet */}
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                transform: `translateY(${sheetDragY}px)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                pointerEvents: "auto",
                backgroundColor: "rgb(31, 41, 55)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              {/* Main content container */}
              <div
                style={{
                  backgroundColor: "rgb(31, 41, 55)",
                  borderTopLeftRadius: "1rem",
                  borderTopRightRadius: "1rem",
                  padding: "1.5rem",
                  paddingBottom:
                    "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  paddingLeft: "max(1.5rem, env(safe-area-inset-left, 0px))",
                  paddingRight: "max(1.5rem, env(safe-area-inset-right, 0px))",
                  boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* Handle bar - drag area */}
                <div
                  onTouchStart={handleSheetTouchStart}
                  onTouchMove={handleSheetTouchMove}
                  onTouchEnd={handleSheetTouchEnd}
                  style={{
                    padding: "0.5rem 0",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  <div
                    style={{
                      width: "3rem",
                      height: "4px",
                      backgroundColor: "rgb(75, 85, 99)",
                      borderRadius: "9999px",
                      margin: "0 auto 0.5rem auto",
                    }}
                  />
                </div>

                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "0.75rem",
                  }}
                >
                  📱 {isIOS ? "Add to Home Screen" : "Install the App"}
                </h3>
                <p
                  style={{
                    color: "rgb(209, 213, 219)",
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  To receive push notifications, install Aperture Expo first:
                </p>
                <ol
                  style={{
                    color: "rgb(209, 213, 219)",
                    fontSize: "0.875rem",
                    marginBottom: "1.25rem",
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  {(isIOS
                    ? [
                        {
                          num: 1,
                          text: (
                            <>
                              Tap the <strong>Share</strong> button at the
                              bottom of Safari
                            </>
                          ),
                        },
                        {
                          num: 2,
                          text: (
                            <>
                              Scroll down and tap{" "}
                              <strong>"Add to Home Screen"</strong>
                            </>
                          ),
                        },
                        { num: 3, text: "Open the app from your Home Screen" },
                        {
                          num: 4,
                          text: "Enable notifications from the bell icon",
                        },
                      ]
                    : [
                        {
                          num: 1,
                          text: (
                            <>
                              Tap the <strong>menu (⋮)</strong> button in your
                              browser
                            </>
                          ),
                        },
                        {
                          num: 2,
                          text: (
                            <>
                              Tap <strong>"Install app"</strong> or{" "}
                              <strong>"Add to Home screen"</strong>
                            </>
                          ),
                        },
                        { num: 3, text: "Open the app from your Home Screen" },
                        {
                          num: 4,
                          text: "Enable notifications from the bell icon",
                        },
                      ]
                  ).map((step) => (
                    <li
                      key={step.num}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "rgb(79, 70, 229)",
                          color: "white",
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "9999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "0.75rem",
                        }}
                      >
                        {step.num}
                      </span>
                      <span>{step.text}</span>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => setShowInstallInstructions(false)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgb(79, 70, 229)",
                    color: "white",
                    borderRadius: "0.75rem",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </>,
          document.body
        )}

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                className={styles.markAllReadButton}
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Push Notification Toggle - Only shown in mobile PWA */}
          {shouldShowNotificationToggle && (
            <div className={styles.pushToggle}>
              <div className={styles.pushToggleInfo}>
                <span className={styles.pushToggleIcon}>🔔</span>
                <span className={styles.pushToggleText}>
                  {pushSubscribed
                    ? "Push notifications enabled"
                    : "Enable push notifications"}
                </span>
              </div>
              {pushPermission === "denied" ? (
                <span className={styles.pushDenied}>Blocked</span>
              ) : (
                <button
                  className={`${styles.pushToggleButton} ${
                    pushSubscribed ? styles.pushEnabled : ""
                  }`}
                  onClick={async () => {
                    if (pushSubscribed) {
                      await unsubscribeFromPush();
                    } else {
                      await subscribeToPush();
                    }
                  }}
                  disabled={pushLoading}
                >
                  {pushLoading ? "..." : pushSubscribed ? "On" : "Off"}
                </button>
              )}
            </div>
          )}

          {/* Install App Prompt - Only shown on mobile browser (not installed as PWA) */}
          {shouldShowInstallPrompt && (
            <div className={styles.pushToggle}>
              <div className={styles.pushToggleInfo}>
                <span className={styles.pushToggleIcon}>📲</span>
                <span className={styles.pushToggleText}>
                  Install app for push notifications
                </span>
              </div>
              <button
                className={styles.pushToggleButton}
                onClick={() => setShowInstallInstructions(true)}
              >
                How?
              </button>
            </div>
          )}

          <div className={styles.notificationList}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${
                    notification.read ? styles.read : styles.unread
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.type, notification.title)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div className={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    <div className={styles.notificationTime}>
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) =>
                      handleDeleteNotification(notification.id, e)
                    }
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
