// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import { Navigation, Footer } from "./components/layout/LayoutComponents";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import ForumPage from "./pages/ForumPage";
import ThreadDetailPage from "./pages/ThreadDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <SignedIn>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slugAndId" element={<EventDetailPage />} />
              <Route path="/users/:userId" element={<UserProfilePage />} />
              <Route
                path="/profile"
                element={<Navigate to={`/users/${useUser()?.id}`} />}
              />
              <Route path="/forum" element={<ForumPage />} />
              <Route
                path="/forum/threads/:threadId"
                element={<ThreadDetailPage />}
              />
            </Routes>
          </SignedIn>
          <SignedOut>
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h1 className="text-4xl font-bold mb-4">Photo Contest App</h1>
              <p className="text-gray-400 mb-8 max-w-md">
                Join our community of photographers, share your work, and
                participate in exciting photo contests.
              </p>
              <div className="flex justify-center w-full">
                <SignInButton mode="modal">
                  <button className="sign-in-button">Sign In</button>
                </SignInButton>
              </div>
            </div>
          </SignedOut>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
