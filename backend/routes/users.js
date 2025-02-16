import express from "express";
import User from "../models/User.js";
import Photo from "../models/Photo.js";
import Contest from "../models/Contest.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Get user profile
router.get("/:userId/profile", requireAuth, async (req, res) => {
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
      include: [Contest],
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
router.put("/:userId/profile", requireAuth, async (req, res) => {
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

export default router;
