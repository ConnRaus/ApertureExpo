import express from "express";
import { requireAuth } from "@clerk/express";
import Vote from "../database/models/Vote.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import { Op } from "sequelize";
import sequelize from "../database/config/config.js";
import User from "../database/models/User.js";

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

    // First try to find photos from the direct ContestId relationship
    let contestPhotos = await Photo.findAll({
      where: { ContestId: contestId },
      attributes: ["id"],
      raw: true,
    });

    // If no photos found with direct relationship, try the many-to-many relationship
    if (contestPhotos.length === 0) {
      const contestWithPhotos = await Contest.findByPk(contestId, {
        include: [
          {
            model: Photo,
            as: "Photos",
            through: { attributes: [] },
            attributes: ["id"],
          },
        ],
      });

      if (contestWithPhotos && contestWithPhotos.Photos) {
        contestPhotos = contestWithPhotos.Photos.map((photo) => ({
          id: photo.id,
        }));
      }
    }

    // If still no photos, return empty array
    if (contestPhotos.length === 0) {
      console.log(`No photos found for contest ${contestId}`);
      return res.json([]);
    }

    console.log(
      `Found ${contestPhotos.length} photos for contest ${contestId}`
    );

    // Get photo IDs
    const photoIds = contestPhotos.map((photo) => photo.id);

    // Get total votes and scores for these photos
    const photoStats = await Vote.findAll({
      where: {
        photoId: { [Op.in]: photoIds },
        contestId: contestId,
      },
      attributes: [
        "photoId",
        [sequelize.fn("COUNT", sequelize.col("id")), "voteCount"],
        [sequelize.fn("SUM", sequelize.col("value")), "totalScore"],
        [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
      ],
      group: ["photoId"],
      order: [
        [sequelize.literal("totalScore"), "DESC"],
        [sequelize.literal("voteCount"), "DESC"],
      ],
      limit: parseInt(limit),
      raw: true,
    });

    console.log(
      `Found ${photoStats.length} photos with votes for contest ${contestId}`
    );

    // If no photos have votes, return all photos from the contest without vote data
    if (photoStats.length === 0) {
      const allPhotos = await Photo.findAll({
        where: { id: { [Op.in]: photoIds } },
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "nickname"],
          },
        ],
        attributes: ["id", "title", "thumbnailUrl", "s3Url", "userId"],
        limit: parseInt(limit),
      });

      // Add default vote stats
      const result = allPhotos.map((photo) => {
        const photoData = photo.toJSON();
        return {
          ...photoData,
          voteCount: 0,
          totalScore: 0,
          averageRating: 0,
        };
      });

      console.log(
        `Returning ${result.length} photos without votes for contest ${contestId}`
      );
      return res.json(result);
    }

    // Get full photo details for the top photos
    const topPhotoIds = photoStats.map((stat) => stat.photoId);

    const topPhotos = await Photo.findAll({
      where: { id: { [Op.in]: topPhotoIds } },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "nickname"],
        },
      ],
      attributes: ["id", "title", "thumbnailUrl", "s3Url", "userId"],
    });

    // Combine photo data with vote stats
    const result = topPhotos.map((photo) => {
      const photoData = photo.toJSON();
      const stats = photoStats.find((stat) => stat.photoId === photo.id) || {
        voteCount: 0,
        totalScore: 0,
        averageRating: 0,
      };

      return {
        ...photoData,
        voteCount: parseInt(stats.voteCount || 0),
        totalScore: parseFloat(stats.totalScore || 0),
        averageRating: parseFloat(stats.averageRating || 0),
      };
    });

    // Sort by score and vote count (same order as the initial query)
    result.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.voteCount - a.voteCount;
    });

    console.log(
      `Returning ${result.length} photos with votes for contest ${contestId}`
    );
    res.json(result);
  } catch (error) {
    console.error("Error getting top photos:", error);
    res.status(500).json({ error: "Failed to get top photos" });
  }
});

export default router;
