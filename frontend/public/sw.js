// Service Worker for Aperture Expo PWA
// Handles push notifications and offline caching

const CACHE_NAME = "aperture-expo-v2";
const OFFLINE_URL = "/";

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching offline page");
      return cache.addAll([
        OFFLINE_URL,
        "/Logo192.png",
        "/Logo512.png",
        "/LogoTransparent.ico",
      ]);
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Ensure service worker takes control immediately
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  let data = {
    title: "Aperture Expo",
    body: "You have a new notification",
    icon: "/Logo192.png",
    badge: "/Logo192.png",
    tag: "default",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
      };
    } catch (e) {
      console.error("[Service Worker] Error parsing push data:", e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    // iOS specific - these help with iOS notification display
    renotify: true,
    silent: false,
    actions: [
      {
        action: "open",
        title: "Open",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).catch((err) => {
      console.error("[Service Worker] Error showing notification:", err);
    })
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event.notification.tag);

  event.notification.close();

  // Handle action buttons
  if (event.action === "dismiss") {
    return;
  }

  // Get the URL to open from the notification data
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open with the app
      for (const client of windowClients) {
        // If we have an existing window, focus it and navigate
        if ("focus" in client) {
          return client.focus().then((focusedClient) => {
            if ("navigate" in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event.notification.tag);
});

// Push subscription change event - handle when browser changes the subscription
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[Service Worker] Push subscription changed");

  event.waitUntil(
    // Re-subscribe with the new subscription
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        // The VAPID key will need to be fetched from the server
        // This is a fallback mechanism
      })
      .then((subscription) => {
        console.log("[Service Worker] Re-subscribed:", subscription.endpoint);
        // You would typically send this new subscription to your server here
        // But since we don't have direct access to the API, 
        // the main app should handle re-subscription on next load
      })
      .catch((err) => {
        console.error("[Service Worker] Failed to re-subscribe:", err);
      })
  );
});

// Fetch event - minimal handler, don't interfere with API requests
// We're not doing aggressive caching to avoid interfering with dynamic content
self.addEventListener("fetch", (event) => {
  // Don't intercept anything - let all requests pass through normally
  // This service worker is primarily for push notifications
  return;
});

console.log("[Service Worker] Script loaded");

