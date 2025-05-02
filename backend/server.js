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
import { ensureUserExists } from "./middleware/ensureUserExists.js";
import sequelize from "./database/config/config.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORS Configuration ---
// Read allowed origins from ENV variable, split by comma, trim whitespace
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin); // Filter out empty strings

// Add localhost default if in development and not already present
if (
  process.env.NODE_ENV !== "production" &&
  !allowedOrigins.includes("http://localhost:5173")
) {
  allowedOrigins.push("http://localhost:5173");
}

console.log("Allowed CORS Origins:", allowedOrigins); // Log for debugging

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow if origin is in the allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        const msg = `CORS policy does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
    },
    credentials: true, // Allow cookies/authorization headers
  })
);
// --- End CORS Configuration ---

// Clerk middleware setup
app.use(clerkMiddleware());

// Routes with authentication
app.use("/", requireAuth(), ensureUserExists, photoRoutes);
app.use("/", requireAuth(), ensureUserExists, contestRoutes);
app.use("/", requireAuth(), ensureUserExists, voteRoutes);
app.use("/users", requireAuth(), userRoutes);

// Forum routes with user existence check
app.use("/forum", requireAuth(), ensureUserExists, forumRoutes);

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

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
