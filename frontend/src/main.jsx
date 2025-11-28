// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import App from "./App";
import "./index.css"; // Tailwind and custom styles

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env.local file");
}

// Register Service Worker for PWA push notifications
if ("serviceWorker" in navigator) {
  // Register immediately, don't wait for load event (important for iOS)
  const registerServiceWorker = async () => {
    try {
      console.log("[PWA] Attempting to register service worker...");
      
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      
      console.log("[PWA] Service worker registered successfully:", registration.scope);
      console.log("[PWA] Service worker state:", registration.active?.state || "not active yet");

      // Check for updates periodically
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("[PWA] Service worker update found");

        newWorker?.addEventListener("statechange", () => {
          console.log("[PWA] Service worker state changed:", newWorker.state);
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[PWA] New service worker installed, refresh to update");
          }
        });
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("[PWA] Service worker is ready");
      
    } catch (error) {
      console.error("[PWA] Service worker registration failed:", error);
      console.error("[PWA] Error details:", error.message);
    }
  };

  // Register on load for best compatibility
  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignOutUrl="/"
    signOutOptions={{
      redirectUrl: "/",
      openInNewTab: false,
    }}
    appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: "#4F46E5",
        colorBackground: "rgb(17, 24, 39)", // Match site's dark blue-gray
        colorText: "#ffffff",
        colorTextSecondary: "#e0e0e0",
        colorInputBackground: "rgba(31, 41, 55, 0.7)", // Match site's lighter blue-gray
        colorInputText: "#ffffff",
        colorAlphaShade: "rgba(17, 24, 39, 0.7)", // Semi-transparent dark blue-gray
      },
    }}
    options={{
      // Enable cross-origin requests
      crossOrigin: true,
      // Allow cookies to be sent with requests
      withCredentials: true,
    }}
  >
    <App />
  </ClerkProvider>
);
