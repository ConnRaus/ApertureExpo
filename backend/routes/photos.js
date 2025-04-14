import express from "express";
import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import PhotoContest from "../database/models/PhotoContest.js";
import { requireAuth } from "@clerk/express";
import { Op } from "sequelize";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Photo upload endpoint
router.post(
  "/upload",
  requireAuth(),
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { mainUrl, thumbnailUrl, metadata } = await uploadToS3(
        req.file,
        `photos/${req.auth.userId}`
      );

      // Create the photo first without the contest association
      const photo = await Photo.create({
        userId: req.auth.userId,
        title: req.body.title || "Untitled",
        description: req.body.description,
        s3Url: mainUrl,
        thumbnailUrl: thumbnailUrl,
        metadata: metadata || null,
      });

      // If a contest ID was provided, associate the photo with that contest using the join table
      if (req.body.contestId) {
        await PhotoContest.create({
          photoId: photo.id,
          contestId: req.body.contestId,
        });
      }

      // Fetch the created photo with the related contests
      const createdPhoto = await Photo.findByPk(photo.id, {
        include: [
          {
            model: Contest,
            as: "Contests",
            through: { attributes: [] },
          },
        ],
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

// Get all photos for the authenticated user
router.get("/photos", requireAuth(), async (req, res) => {
  try {
    const includeContests = req.query.include === "contests";

    const include = [];
    if (includeContests) {
      include.push({
        model: Contest,
        as: "Contests",
        through: { attributes: [] },
      });
    }

    const photos = await Photo.findAll({
      where: { userId: req.auth.userId },
      include,
      order: [["createdAt", "DESC"]],
    });

    // If we need to include the legacy Contest relationship as well
    if (includeContests) {
      // Find photos with the legacy ContestId set
      const photosWithLegacyContests = await Photo.findAll({
        where: {
          userId: req.auth.userId,
          ContestId: { [Op.not]: null },
        },
        include: [
          {
            model: Contest,
            as: "Contest",
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Map of photo IDs to their index in the photos array
      const photoMap = new Map(photos.map((photo, index) => [photo.id, index]));

      // For each photo with a legacy contest, make sure that contest appears in the Contests array
      for (const photo of photosWithLegacyContests) {
        if (photo.Contest && photoMap.has(photo.id)) {
          const index = photoMap.get(photo.id);
          const photoJson = photos[index].toJSON();

          // Ensure the Contests array exists
          if (!photoJson.Contests) {
            photoJson.Contests = [];
            photos[index].dataValues.Contests = [];
          }

          // Check if this contest is already in the Contests array
          const contestExists = photos[index].dataValues.Contests.some(
            (c) => c.id === photo.Contest.id
          );

          if (!contestExists) {
            photos[index].dataValues.Contests.push(photo.Contest);
          }
        }
      }
    }

    res.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Update photo
router.put("/photos/:id", requireAuth(), async (req, res) => {
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
router.delete("/photos/:id", requireAuth(), async (req, res) => {
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
router.post("/photos/:id/submit", requireAuth(), async (req, res) => {
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

    // Check if the contest exists
    const contest = await Contest.findByPk(req.body.contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Check if photo is already in the contest using the join table
    const existingSubmission = await PhotoContest.findOne({
      where: {
        photoId: photo.id,
        contestId: req.body.contestId,
      },
    });

    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: "Photo is already submitted to this contest" });
    }

    // Create a new entry in the PhotoContest join table
    await PhotoContest.create({
      photoId: photo.id,
      contestId: req.body.contestId,
    });

    // Fetch the updated photo with contests information
    const updatedPhoto = await Photo.findByPk(photo.id, {
      include: [
        {
          model: Contest,
          as: "Contests",
          through: { attributes: [] },
        },
      ],
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
