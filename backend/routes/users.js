import express from "express";
import multer from "multer";
import User from "../database/models/User.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import { requireAuth } from "@clerk/express";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get user profile
router.get("/:userId/profile", requireAuth(), async (req, res) => {
  try {
    let user = await User.findByPk(req.params.userId);

    if (!user) {
      user = await User.create({
        id: req.params.userId,
        nickname: null,
        bio: null,
        bannerImage: null,
      });
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
      profile: user,
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
      user = await User.create({
        id: req.params.userId,
        nickname: req.body.nickname,
        bio: req.body.bio,
        bannerImage: req.body.bannerImage,
      });
    } else {
      await user.update({
        nickname: req.body.nickname,
        bio: req.body.bio,
        bannerImage: req.body.bannerImage,
      });
    }

    // Fetch the updated user to ensure we have the latest data
    const updatedUser = await User.findByPk(req.params.userId);
    res.json(updatedUser);
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

      // If there's an existing banner image, only delete it if it's in the banners directory
      if (user && user.bannerImage) {
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
      const s3Url = await uploadToS3(
        req.file,
        `photos/${req.auth.userId}/banners`,
        { generateThumbnail: false }
      );

      // Create or update user with new banner image
      if (!user) {
        user = await User.create({
          id: req.params.userId,
          nickname: null,
          bio: null,
          bannerImage: s3Url,
        });
      } else {
        await user.update({ bannerImage: s3Url });
      }

      res.json({ bannerImage: s3Url });
    } catch (error) {
      console.error("Error uploading banner:", error);
      res.status(500).json({ error: "Failed to upload banner image" });
    }
  }
);

export default router;
