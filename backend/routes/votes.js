import express from "express";
import { requireAuth } from "@clerk/express";
import Vote from "../database/models/Vote.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import { Op } from "sequelize";
import sequelize from "../database/config/config.js";

const router = express.Router();

// Cast a vote for a photo in a contest
router.post("/votes", requireAuth(), async (req, res) => {
  try {
    const { photoId, contestId, value = 1 } = req.body;
    const userId = req.auth.userId;

    if (!photoId || !contestId) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Both photoId and contestId are required",
      });
    }

    // Validate the vote value
    if (value < 1 || value > 5) {
      return res.status(400).json({
        error: "Invalid vote value",
        details: "Vote value must be between 1 and 5",
      });
    }

    // Check if the photo exists
    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // Check if the contest exists and is in the voting phase
    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Get contest phase
    const now = new Date();
    const votingStartDate = new Date(contest.votingStartDate);
    const votingEndDate = new Date(contest.votingEndDate);

    // Only allow voting if contest is in voting phase
    if (!(now >= votingStartDate && now <= votingEndDate)) {
      return res.status(403).json({
        error: "Voting not allowed",
        details: "Contest is not in the voting phase",
        phase: contest.phase,
      });
    }

    // Check if the photo is submitted to the contest
    const isInContest = await photo.getContests({
      where: { id: contestId },
    });

    // Also check legacy contest relationship
    const isInLegacyContest = photo.ContestId === contestId;

    if (isInContest.length === 0 && !isInLegacyContest) {
      return res.status(400).json({
        error: "Photo not in contest",
        details: "The photo is not part of this contest",
      });
    }

    // Check if user has already voted for this photo in this contest
    const existingVote = await Vote.findOne({
      where: {
        userId,
        photoId,
        contestId,
      },
    });

    if (existingVote) {
      // Update existing vote
      await existingVote.update({
        value,
        votedAt: new Date(),
      });

      return res.json({
        message: "Vote updated successfully",
        vote: existingVote,
      });
    }

    // Create new vote
    const vote = await Vote.create({
      userId,
      photoId,
      contestId,
      value,
    });

    res.status(201).json({
      message: "Vote cast successfully",
      vote,
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

// Get votes for a specific photo
router.get("/photos/:photoId/votes", async (req, res) => {
  try {
    const { photoId } = req.params;
    const { contestId } = req.query;

    const whereClause = { photoId };
    if (contestId) {
      whereClause.contestId = contestId;
    }

    // Count votes and calculate average rating
    const votes = await Vote.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
        [sequelize.fn("SUM", sequelize.col("value")), "totalValue"],
      ],
      raw: true,
    });

    res.json({
      photoId,
      contestId: contestId || null,
      votes: votes[0] || { count: 0, averageRating: 0, totalValue: 0 },
    });
  } catch (error) {
    console.error("Error getting votes:", error);
    res.status(500).json({ error: "Failed to get votes" });
  }
});

// Get user's votes in a contest
router.get("/users/votes", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { contestId } = req.query;

    const whereClause = { userId };
    if (contestId) {
      whereClause.contestId = contestId;
    }

    const votes = await Vote.findAll({
      where: whereClause,
      include: [
        {
          model: Photo,
          as: "Photo",
          attributes: ["id", "title", "thumbnailUrl"],
        },
        {
          model: Contest,
          as: "Contest",
          attributes: ["id", "title"],
        },
      ],
    });

    res.json(votes);
  } catch (error) {
    console.error("Error getting user votes:", error);
    res.status(500).json({ error: "Failed to get user votes" });
  }
});

// Get top-voted photos in a contest
router.get("/contests/:contestId/top-photos", async (req, res) => {
  try {
    const { contestId } = req.params;
    const { limit = 10 } = req.query;

    // Check if contest exists
    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Get all photos in the contest
    const photos = await Photo.findAll({
      include: [
        {
          model: Vote,
          as: "Votes",
          where: { contestId },
          required: false,
          attributes: [],
        },
      ],
      where: {
        [Op.or]: [
          { ContestId: contestId }, // Legacy relationship
          {
            "$Votes.contestId$": contestId, // Photos with votes in this contest
          },
        ],
      },
      attributes: [
        "id",
        "title",
        "thumbnailUrl",
        "s3Url",
        "userId",
        [sequelize.fn("COUNT", sequelize.col("Votes.id")), "voteCount"],
        [sequelize.fn("AVG", sequelize.col("Votes.value")), "averageRating"],
        [sequelize.fn("SUM", sequelize.col("Votes.value")), "totalScore"],
      ],
      group: ["Photo.id"],
      order: [
        [sequelize.literal("totalScore"), "DESC"],
        [sequelize.literal("voteCount"), "DESC"],
      ],
      limit: parseInt(limit),
    });

    res.json(photos);
  } catch (error) {
    console.error("Error getting top photos:", error);
    res.status(500).json({ error: "Failed to get top photos" });
  }
});

export default router;
