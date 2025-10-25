// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import { Navigation, Footer } from "./components/layout/LayoutComponents";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import UserProfilePage from "./pages/UserProfilePage";
import ForumPage from "./pages/ForumPage";
import ThreadDetailPage from "./pages/ThreadDetailPage";
import AdminPage from "./pages/AdminPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LandingPage from "./components/landing/LandingPage";

// Component to handle homepage logic
function HomePageHandler() {
  return (
    <>
      <SignedIn>
        <HomePage />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Routes>
            {/* Homepage shows landing page for non-signed in users, dashboard for signed in */}
            <Route path="/" element={<HomePageHandler />} />

            {/* Routes accessible to everyone */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slugAndId" element={<EventDetailPage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route
              path="/forum/threads/:threadId"
              element={<ThreadDetailPage />}
            />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Routes that require authentication */}
            <Route
              path="/profile"
              element={
                <SignedIn>
                  <Navigate to={`/users/${useUser()?.id}`} />
                </SignedIn>
              }
            />
            <Route
              path="/admin"
              element={
                <SignedIn>
                  <AdminPage />
                </SignedIn>
              }
            />

            {/* Landing page route for marketing */}
            <Route path="/welcome" element={<LandingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
