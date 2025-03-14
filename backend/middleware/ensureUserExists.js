import models from "../database/models/index.js";

const { User } = models;

/**
 * Middleware to ensure a user exists in the database
 * If the user doesn't exist, it creates a minimal user record
 */
export const ensureUserExists = async (req, res, next) => {
  try {
    // Skip if no authenticated user
    if (!req.auth?.userId) {
      return next();
    }

    const userId = req.auth.userId;

    // Check if user exists in database
    let user = await User.findByPk(userId);

    // If user doesn't exist, create a minimal user record
    if (!user) {
      user = await User.create({
        id: userId,
        nickname: "User", // Default nickname
      });
      console.log(`Created new user record for: ${userId}`);
    }

    // Update the req.user object with full user details
    req.user = user.toJSON();

    next();
  } catch (error) {
    console.error("Error in ensureUserExists middleware:", error);
    next(error);
  }
};
