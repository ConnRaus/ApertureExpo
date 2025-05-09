import dotenv from "dotenv";

dotenv.config();

export const adminCheck = (req, res, next) => {
  try {
    // Get the current authenticated user from Clerk middleware
    const userId = req.auth.userId;

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
