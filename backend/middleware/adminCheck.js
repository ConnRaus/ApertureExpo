import dotenv from "dotenv";
import { getAuthFromRequest } from "../utils/auth.js";

dotenv.config();

export const adminCheck = (req, res, next) => {
  try {
    // Get the current authenticated user from Clerk middleware
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = auth.userId;

    // Get the admin user ID from env variable
    const adminUserId = process.env.ADMIN_USER_ID;

    // Check if the user ID matches the admin ID
    if (userId === adminUserId) {
      // User is admin, proceed to next middleware
      next();
    } else {
      // Not the admin, return forbidden status
      res.status(403).json({
        error: "Unauthorized. Admin access required.",
      });
    }
  } catch (error) {
    console.error("Admin check failed:", error);
    res.status(500).json({
      error: "Admin authorization check failed.",
    });
  }
};
