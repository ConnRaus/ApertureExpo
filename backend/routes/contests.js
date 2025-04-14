import express from "express";
import { requireAuth } from "@clerk/express";
import Contest from "../database/models/Contest.js";
import Photo from "../database/models/Photo.js";

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
          attributes: ["id", "title", "s3Url", "thumbnailUrl", "userId"],
        },
      ],
      order: [["startDate", "ASC"]],
    });

    // Calculate the contest status based on current time vs start/end dates
    const now = new Date();
    const processedContests = contests.map((contest) => {
      const contestData = contest.toJSON();
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

      return contestData;
    });

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

    // Calculate the contest status based on current time vs start/end dates
    const contestData = contest.toJSON();
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
