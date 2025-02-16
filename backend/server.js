// backend/server.js
import express from "express";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/database.js";
import Contest from "./models/Contest.js";
import Photo from "./models/Photo.js";
import photoRoutes from "./routes/photos.js";
import contestRoutes from "./routes/contests.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
const defaultOrigins = [
  "http://localhost",
  "http://localhost:80",
  "http://127.0.0.1",
  "http://127.0.0.1:80",
];

const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? [...defaultOrigins, ...process.env.CORS_ORIGINS.split(",")]
    : defaultOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.options("*", cors(corsOptions));

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

// Initialize database and associations
const initializeDatabase = async () => {
  try {
    Contest.hasMany(Photo);
    Photo.belongsTo(Contest);
    await sequelize.sync({ alter: true });
    console.log("Database synchronized");
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  }
};

initializeDatabase();

// Routes
app.use("/", photoRoutes);
app.use("/", contestRoutes);
app.use("/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message || "Something broke!" });
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
