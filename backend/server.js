// backend/server.js
import express from "express";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
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
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    req.headers.authorization = authHeader.replace("Bearer ", "");
  }
  next();
});

app.use(
  ClerkExpressWithAuth({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

// Routes
app.use("/", photoRoutes);
app.use("/", contestRoutes);
app.use("/users", userRoutes);

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
