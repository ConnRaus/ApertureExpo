import express from "express";
import multer from "multer";
import User from "../database/models/User.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import { requireAuth, clerkClient } from "@clerk/express";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import { ensureUserExists } from "../middleware/ensureUserExists.js";
import { getAuthFromRequest } from "../utils/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply the ensureUserExists middleware to all user routes
router.use(ensureUserExists);

// Get the current user's profile with Clerk data
router.get("/me", async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = auth.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch Clerk user data to get the profile image
    const clerkUser = await clerkClient.users.getUser(userId);

    // Combine DB user with Clerk data
    const userData = user.toJSON();
    userData.avatarUrl = clerkUser.imageUrl || null;
    userData.fullName =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || clerkUser.firstName || userData.nickname;

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get a user's profile by ID with Clerk data
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = user.toJSON();

    // If the requested user is the current user or a public user,
    // try to fetch their Clerk profile image
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      userData.avatarUrl = clerkUser.imageUrl || null;
    } catch (err) {
      // If we can't get Clerk data, just continue without the avatar
      // console.log(`Could not fetch Clerk data for user ${userId}`);
    }

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update the current user's profile (PROTECTED)
router.put("/me", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = auth.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user fields
    const { nickname, bio, bannerImage } = req.body;
    if (nickname !== undefined) {
      user.nickname = nickname;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (bannerImage !== undefined) {
      user.bannerImage = bannerImage;
    }

    await user.save();

    // Get updated user with Clerk data
    const updatedUser = user.toJSON();

    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      updatedUser.avatarUrl = clerkUser.imageUrl || null;
    } catch (err) {
      // If we can't get Clerk data, just continue
      // console.log(`Could not fetch Clerk data for user ${userId}`);
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get a user's photos
router.get("/:userId/photos", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25; // 25 photos per page
    const offset = (page - 1) * limit;

    // First get total count
    const totalPhotos = await Photo.count({
      where: { userId },
    });

    // Then get paginated photos
    const photos = await Photo.findAll({
      where: { userId },
      attributes: [
        "id",
        "title",
        "description",
        "s3Url",
        "thumbnailUrl",
        "userId",
        "createdAt",
        "updatedAt",
        "metadata",
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      photos,
      pagination: {
        page,
        limit,
        totalPhotos,
        totalPages: Math.ceil(totalPhotos / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get user profile (PUBLIC - no auth required for viewing)
router.get("/:userId/profile", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25; // 25 photos per page
    const offset = (page - 1) * limit;

    let user = await User.findByPk(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add Clerk image URL to the user profile
    let userProfile = user.toJSON();
    try {
      // Get user data from Clerk
      const clerkUser = await clerkClient.users.getUser(user.id);
      // Add avatar URL to the profile
      userProfile.avatarUrl = clerkUser.imageUrl || null;
    } catch (clerkError) {
      // Continue without avatar if Clerk fetch fails
      // console.error(`Could not fetch Clerk data for user ${user.id}:`, clerkError);
      userProfile.avatarUrl = null;
    }

    // Get total photo count for pagination
    const totalPhotos = await Photo.count({
      where: { userId: req.params.userId },
    });

    // Get paginated photos
    const photos = await Photo.findAll({
      where: { userId: req.params.userId },
      attributes: [
        "id",
        "title",
        "description",
        "s3Url",
        "thumbnailUrl",
        "userId",
        "createdAt",
        "updatedAt",
        "metadata",
        "ContestId",
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: Contest,
          as: "Contest",
        },
      ],
    });

    res.json({
      profile: userProfile,
      photos: photos || [],
      pagination: {
        page,
        limit,
        totalPhotos,
        totalPages: Math.ceil(totalPhotos / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile
router.put("/:userId/profile", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.params.userId !== auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this profile" });
    }

    let user = await User.findByPk(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create update object with only the fields that are provided
    const updateData = {};
    if (req.body.nickname !== undefined)
      updateData.nickname = req.body.nickname;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;

    // Explicitly handle the bannerImage field, even if it's an empty string
    // This allows users to remove their banner image if desired
    if (req.body.bannerImage !== undefined) {
      updateData.bannerImage = req.body.bannerImage;
    }

    // Update the user record
    await user.update(updateData);

    // Fetch the updated user to ensure we have the latest data
    const updatedUser = await User.findByPk(req.params.userId);

    // Add Clerk image URL to response
    let userResponse = updatedUser.toJSON();
    try {
      const clerkUser = await clerkClient.users.getUser(updatedUser.id);
      userResponse.avatarUrl = clerkUser.imageUrl || null;
    } catch (clerkError) {
      // If we can't get Clerk data, just continue
      // console.error(`Could not fetch Clerk data:`, clerkError);
      userResponse.avatarUrl = null;
    }

    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

// Upload banner image
router.post(
  "/:userId/banner",
  requireAuth(),
  upload.single("banner"),
  async (req, res) => {
    try {
      const auth = getAuthFromRequest(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (req.params.userId !== auth.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this profile" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get the user and check if they have an existing banner
      let user = await User.findByPk(req.params.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If there's an existing banner image, only delete it if it's in the banners directory
      if (user.bannerImage) {
        // Check if the current banner is from the banners directory
        const isBannerImage = user.bannerImage.includes(
          `/photos/${req.params.userId}/banners/`
        );
        if (isBannerImage) {
          try {
            await deleteFromS3(user.bannerImage);
          } catch (deleteError) {
            // Continue with upload even if delete fails
            // console.error("Error deleting old banner:", deleteError);
          }
        }
      }

      // Upload new banner to S3
      const result = await uploadToS3(
        req.file,
        `photos/${auth.userId}/banners`,
        { generateThumbnail: false }
      );

      if (!result || !result.mainUrl) {
        return res.status(500).json({
          error: "Failed to upload banner: S3 did not return a valid URL",
        });
      }

      const mainUrl = result.mainUrl;

      // Update user with new banner image
      await user.update({ bannerImage: mainUrl });

      // Return updated user with the banner URL
      const response = {
        id: user.id,
        nickname: user.nickname,
        bio: user.bio,
        bannerImage: mainUrl,
      };

      res.json(response);
    } catch (error) {
      console.error("Error uploading banner:", error);
      res
        .status(500)
        .json({ error: "Failed to upload banner: " + error.message });
    }
  }
);

// Public route to get user profile info by ID
router.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Try getting user from our database first
    const dbUser = await User.findByPk(userId);

    let clerkUser = null;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      // Only log if the DB user wasn't found either
      if (!dbUser) {
        // console.log(`Could not fetch Clerk data for user ${userId}`);
      }
      // Don't throw an error, just proceed without Clerk data
    }

    if (!dbUser && !clerkUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prioritize DB data, fill in from Clerk if missing
    const profileData = {
      id: userId,
      nickname:
        dbUser?.nickname || clerkUser?.username || `User ${userId.slice(0, 6)}`,
      bio: dbUser?.bio || "",
      bannerImage: dbUser?.bannerImage || "",
      avatarUrl: clerkUser?.imageUrl || dbUser?.avatarUrl || null, // Use Clerk image first
    };

    res.json(profileData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Route to get the current authenticated user's details
router.get("/users/me", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = auth.userId;
    const dbUser = await User.findByPk(userId);

    let clerkUser = null;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      // console.log(`Could not fetch Clerk data for user ${userId}`);
      // Don't fail the request if Clerk fetch fails, use DB data
    }

    if (!dbUser) {
      // This should ideally not happen if ensureUserExists middleware is working
      console.error(`DB User not found for authenticated user: ${userId}`);
      return res.status(404).json({ error: "User profile not found in DB" });
    }

    const profileData = {
      id: userId,
      nickname: dbUser.nickname,
      bio: dbUser.bio,
      bannerImage: dbUser.bannerImage,
      avatarUrl: clerkUser?.imageUrl || dbUser.avatarUrl || null, // Use Clerk image first
    };

    res.json(profileData);
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile (nickname, bio, bannerImage)
router.put("/users/me", requireAuth(), async (req, res) => {
  // ... (keep logs inside this route if needed) ...
});

export default router;
