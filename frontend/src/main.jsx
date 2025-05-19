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
