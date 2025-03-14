import models from "../database/models/index.js";
import { clerkClient } from "@clerk/express";

const { User } = models;

/**
 * Middleware to ensure a user exists in the database
 * If the user doesn't exist, it creates a user record with data from Clerk
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

    // If user doesn't exist, create a user record with Clerk data
    if (!user) {
      try {
        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);

        // Extract user details
        const nickname =
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.username || clerkUser.firstName || "User";

        // Create new user with Clerk data
        user = await User.create({
          id: userId,
          nickname,
          bio: "",
          bannerImage: "", // Keep banner image empty, don't use profile image
        });

        console.log(
          `Created new user record for: ${userId} with name: ${nickname}`
        );
      } catch (createError) {
        // If error is due to duplicate key, the user was created in another request
        // Try to fetch the user one more time
        if (createError.name === "SequelizeUniqueConstraintError") {
          user = await User.findByPk(userId);

          // If we still can't find the user, something else is wrong
          if (!user) {
            throw createError;
          }

          console.log(`User ${userId} already exists, using existing record`);
        } else {
          // For any other error, pass it along
          throw createError;
        }
      }
    }

    // Update the req.user object with full user details
    req.user = user.toJSON();

    next();
  } catch (error) {
    console.error("Error in ensureUserExists middleware:", error);
    next(error);
  }
};

/**
 * Helper function to get Clerk user image
 */
async function getClerkUserImage(userId) {
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    return clerkUser.imageUrl || null;
  } catch (error) {
    console.error("Error fetching Clerk user image:", error);
    return null;
  }
}
