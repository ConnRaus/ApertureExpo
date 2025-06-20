// backend/server.js
import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import dotenv from "dotenv";
import cors from "cors";
import initializeDatabase from "./database/index.js";
import photoRoutes from "./routes/photos.js";
import contestRoutes from "./routes/contests.js";
import userRoutes from "./routes/users.js";
import voteRoutes from "./routes/votes.js";
import forumRoutes from "./routes/forum.js";
import adminRoutes from "./routes/admin.js";
import commentRoutes from "./routes/comments.js";
import { ensureUserExists } from "./middleware/ensureUserExists.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORS Configuration ---
// Read allowed origins from ENV variable, split by comma, trim whitespace
const allowedOriginsFromEnv = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin); // Filter out empty strings

let allowedOrigins = [...allowedOriginsFromEnv];

// Add localhost defaults if in development
if (process.env.NODE_ENV !== "production") {
  // Allow any local network origin during development
  app.use(
    cors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  console.log("Development mode: CORS is allowing all origins");
} else {
  // Production CORS configuration
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          const msg = `CORS policy does not allow access from the specified Origin: ${origin}`;
          return callback(new Error(msg), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  console.log(
    "Production mode: CORS is restricted to allowed origins:",
    allowedOrigins
  );
}
// --- End CORS Configuration ---

// Clerk middleware setup
app.use(clerkMiddleware());

// Admin routes - these routes check for admin access
app.use("/admin", adminRoutes);

// Comments routes - handle their own authentication per route
app.use("/comments", commentRoutes);

// PUBLIC ROUTES - No authentication required for viewing content
// These routes allow non-signed in users to browse the site
app.use("/", contestRoutes); // Public contest viewing
app.use("/forum", forumRoutes); // Public forum viewing
app.use("/users", userRoutes); // Public user profile viewing

// PROTECTED ROUTES - Authentication required for actions
app.use("/", requireAuth(), ensureUserExists, photoRoutes);
app.use("/", requireAuth(), ensureUserExists, voteRoutes);

// --- Global Error Handler ---
// Must come after all routes and other middleware
app.use((err, req, res, next) => {
  console.error("\n--- Unhandled Error ---");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Request URL:", req.originalUrl);
  console.error("Request Method:", req.method);
  console.error("Error Stack:", err.stack);
  // Send generic error response
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      // Optionally include stack in development
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
  console.error("--- End Unhandled Error ---\n");
});
// --- End Global Error Handler ---

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
      console.log("Server is listening on all network interfaces");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
