// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <SignedIn>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:contestId" element={<EventDetailPage />} />
              <Route path="/users/:userId" element={<UserProfilePage />} />
              <Route
                path="/profile"
                element={<Navigate to={`/users/${useUser()?.id}`} />}
              />
            </Routes>
          </SignedIn>
          <SignedOut>
            <div className="sign-in-container">
              <h1>Photo Contest App</h1>
              <p>Please sign in to continue</p>
              <SignInButton mode="modal">
                <button className="sign-in-button">Sign In</button>
              </SignInButton>
            </div>
          </SignedOut>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
