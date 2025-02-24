// backend/server.js
import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import dotenv from "dotenv";
import cors from "cors";
import { initializeDatabase } from "./database/index.js";
import photoRoutes from "./routes/photos.js";
import contestRoutes from "./routes/contests.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost",
      "http://localhost:80",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Clerk middleware setup
app.use(clerkMiddleware());

// Routes with authentication
app.use("/", requireAuth(), photoRoutes);
app.use("/", requireAuth(), contestRoutes);
app.use("/users", requireAuth(), userRoutes);

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
