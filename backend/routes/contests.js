import express from "express";
import { requireAuth } from "@clerk/express";
import Contest from "../database/models/Contest.js";
import Photo from "../database/models/Photo.js";
import { Op } from "sequelize";

const router = express.Router();

// Create contest
router.post("/contests", requireAuth(), async (req, res) => {
  try {
    const contest = await Contest.create({
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: "active",
    });
    res.json(contest);
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({ error: "Failed to create contest" });
  }
});

// Get all contests
router.get("/contests", async (req, res) => {
  try {
    const contests = await Contest.findAll({
      include: [
        {
          model: Photo,
          as: "Photos",
          through: { attributes: [] },
          attributes: ["id", "title", "s3Url", "thumbnailUrl", "userId"],
        },
      ],
      order: [["startDate", "ASC"]],
    });

    // Calculate the contest status based on current time vs start/end dates
    const now = new Date();
    const processedContests = await Promise.all(
      contests.map(async (contest) => {
        const contestData = contest.toJSON();
        const startDate = new Date(contestData.startDate);
        const endDate = new Date(contestData.endDate);

        // Get any legacy photos for this contest
        const legacyPhotos = await Photo.findAll({
          where: {
            ContestId: contest.id,
          },
          attributes: ["id", "title", "s3Url", "thumbnailUrl", "userId"],
        });

        // Create a Set of photo IDs from the many-to-many relationship
        const photoIds = new Set(contestData.Photos.map((photo) => photo.id));

        // Add any legacy photos that aren't already included
        legacyPhotos.forEach((photo) => {
          if (!photoIds.has(photo.id)) {
            contestData.Photos.push(photo.toJSON());
          }
        });

        // Determine contest status based on dates
        if (now < startDate) {
          contestData.status = "upcoming";
        } else if (now >= startDate && now <= endDate) {
          contestData.status = "active";
        } else {
          contestData.status = "ended";
        }

        return contestData;
      })
    );

    res.json(processedContests || []);
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

// Get contest by ID
router.get("/contests/:id", async (req, res) => {
  try {
    const contest = await Contest.findByPk(req.params.id, {
      include: [
        {
          model: Photo,
          as: "Photos",
          through: { attributes: [] },
          attributes: [
            "id",
            "title",
            "s3Url",
            "thumbnailUrl",
            "userId",
            "createdAt",
            "description",
          ],
        },
      ],
    });

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Also get any legacy photos that might be associated through the old ContestId relationship
    const legacyPhotos = await Photo.findAll({
      where: {
        ContestId: contest.id,
      },
      attributes: [
        "id",
        "title",
        "s3Url",
        "thumbnailUrl",
        "userId",
        "createdAt",
        "description",
      ],
    });

    // Merge the photos from both relationships, avoiding duplicates
    const contestData = contest.toJSON();

    // Create a Set of photo IDs from the many-to-many relationship
    const photoIds = new Set(contestData.Photos.map((photo) => photo.id));

    // Add any legacy photos that aren't already included
    legacyPhotos.forEach((photo) => {
      if (!photoIds.has(photo.id)) {
        contestData.Photos.push(photo.toJSON());
      }
    });

    // Calculate the contest status based on current time vs start/end dates
    const now = new Date();
    const startDate = new Date(contestData.startDate);
    const endDate = new Date(contestData.endDate);

    // Determine contest status based on dates
    if (now < startDate) {
      contestData.status = "upcoming";
    } else if (now >= startDate && now <= endDate) {
      contestData.status = "active";
    } else {
      contestData.status = "ended";
    }

    res.json(contestData);
  } catch (error) {
    console.error("Error fetching contest:", error);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
});

export default router;
