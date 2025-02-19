import express from "express";
import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import Photo from "../models/Photo.js";
import Contest from "../models/Contest.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Photo upload endpoint
router.post(
  "/upload",
  requireAuth,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { mainUrl, thumbnailUrl } = await uploadToS3(
        req.file,
        `photos/${req.auth.userId}`
      );

      const photo = await Photo.create({
        userId: req.auth.userId,
        title: req.body.title || "Untitled",
        description: req.body.description,
        s3Url: mainUrl,
        thumbnailUrl: thumbnailUrl,
        ContestId: req.body.contestId || null,
      });

      const createdPhoto = await Photo.findByPk(photo.id, {
        include: [Contest],
      });

      res.json({ message: "Photo uploaded successfully", photo: createdPhoto });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: error.message || "Failed to upload photo",
        details: error.stack,
      });
    }
  }
);

// Get user's photos
router.get("/photos", requireAuth, async (req, res) => {
  try {
    const photos = await Photo.findAll({
      where: { userId: req.auth.userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(photos || []);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Update photo
router.put("/photos/:id", requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this photo" });
    }

    await photo.update({
      title: req.body.title,
      description: req.body.description,
    });

    res.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// Delete photo
router.delete("/photos/:id", requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this photo" });
    }

    await deleteFromS3(photo.s3Url);
    await photo.destroy();

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// Submit existing photo to contest
router.post("/photos/:id/submit", requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to submit this photo" });
    }

    // Check if photo is already in the contest
    if (photo.ContestId === req.body.contestId) {
      return res
        .status(400)
        .json({ error: "Photo is already submitted to this contest" });
    }

    // Update the photo with the new contest ID
    await photo.update({ ContestId: req.body.contestId });

    // Fetch the updated photo with contest information
    const updatedPhoto = await Photo.findByPk(photo.id, {
      include: [Contest],
    });

    res.json({
      message: "Photo submitted to contest successfully",
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Error submitting photo to contest:", error);
    res.status(500).json({ error: "Failed to submit photo to contest" });
  }
});

export default router;
