import express from "express";
import multer from "multer";
import User from "../database/models/User.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import { requireAuth, clerkClient } from "@clerk/express";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import { ensureUserExists } from "../middleware/ensureUserExists.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply the ensureUserExists middleware to all user routes
router.use(ensureUserExists);

// Get the current user's profile with Clerk data
router.get("/me", async (req, res) => {
  try {
    const userId = req.auth.userId;

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
      console.log(`Could not fetch Clerk data for user ${userId}`);
    }

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update the current user's profile
router.put("/me", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { nickname, bio, bannerImage } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user fields
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
      console.log(`Could not fetch Clerk data for user ${userId}`);
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
    const photos = await Photo.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.json(photos);
  } catch (error) {
    console.error("Error fetching user photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get user profile
router.get("/:userId/profile", requireAuth(), async (req, res) => {
  try {
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
      console.error(
        `Could not fetch Clerk data for user ${user.id}:`,
        clerkError
      );
      // Continue without avatar if Clerk fetch fails
      userProfile.avatarUrl = null;
    }

    const photos = await Photo.findAll({
      where: { userId: req.params.userId },
      order: [["createdAt", "DESC"]],
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
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile
router.put("/:userId/profile", requireAuth(), async (req, res) => {
  try {
    if (req.params.userId !== req.auth.userId) {
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
      console.error(`Could not fetch Clerk data:`, clerkError);
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
      if (req.params.userId !== req.auth.userId) {
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
            console.error("Error deleting old banner:", deleteError);
            // Continue with upload even if delete fails
          }
        }
      }

      // Upload new banner to S3
      const result = await uploadToS3(
        req.file,
        `photos/${req.auth.userId}/banners`,
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

export default router;
