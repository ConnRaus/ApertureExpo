// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import { Navigation, Footer } from "./components/layout/LayoutComponents";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import UserProfilePage from "./pages/UserProfilePage";
import ForumPage from "./pages/ForumPage";
import ThreadDetailPage from "./pages/ThreadDetailPage";
import AdminPage from "./pages/AdminPage";
import LandingPage from "./components/landing/LandingPage";

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
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </SignedIn>
          <SignedOut>
            <LandingPage />
          </SignedOut>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
