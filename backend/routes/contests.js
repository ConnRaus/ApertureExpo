import express from "express";
import { requireAuth } from "@clerk/express";
import Contest from "../database/models/Contest.js";
import Photo from "../database/models/Photo.js";
import Vote from "../database/models/Vote.js";
import { Op } from "sequelize";
import sequelize from "../database/config/config.js";
import User from "../database/models/User.js";

const router = express.Router();

// Create contest
router.post("/contests", requireAuth(), async (req, res) => {
  try {
    const contest = await Contest.create({
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      votingStartDate: req.body.votingStartDate,
      votingEndDate: req.body.votingEndDate,
      maxPhotosPerUser: req.body.maxPhotosPerUser || null,
      status: "upcoming",
    });
    res.json(contest);
  } catch (error) {
    console.error("Error creating contest:", error);
    res
      .status(500)
      .json({ error: "Failed to create contest", details: error.message });
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

    const processedContests = await Promise.all(
      contests.map(async (contest) => {
        const contestData = contest.toJSON();

        // Sync status with phase
        const phase = contestData.phase;
        if (phase === "upcoming" && contestData.status !== "upcoming") {
          await contest.update({ status: "upcoming" });
          contestData.status = "upcoming";
        } else if (phase === "submission" && contestData.status !== "open") {
          await contest.update({ status: "open" });
          contestData.status = "open";
        } else if (phase === "voting" && contestData.status !== "voting") {
          await contest.update({ status: "voting" });
          contestData.status = "voting";
        } else if (
          (phase === "ended" || phase === "processing") &&
          contestData.status !== "completed"
        ) {
          await contest.update({ status: "completed" });
          contestData.status = "completed";
        }

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

        // Get total vote count for the contest
        const voteStats = await Vote.findOne({
          where: { contestId: contest.id },
          attributes: [
            [sequelize.fn("COUNT", sequelize.col("id")), "totalVotes"],
          ],
          raw: true,
        });

        contestData.totalVotes = voteStats ? voteStats.totalVotes : 0;
        contestData.submissionCount = contestData.Photos.length;

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
          // Use nested: false to prevent circular references
          include: [
            {
              model: Vote,
              as: "Votes",
              attributes: ["id", "value"],
              where: { contestId: req.params.id },
              required: false,
            },
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
          nest: false,
        },
      ],
    });

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Convert to plain object to avoid Sequelize circular references
    const contestData = JSON.parse(JSON.stringify(contest));

    // Sync status with phase
    const phase = contestData.phase;
    if (phase === "upcoming" && contestData.status !== "upcoming") {
      await contest.update({ status: "upcoming" });
      contestData.status = "upcoming";
    } else if (phase === "submission" && contestData.status !== "open") {
      await contest.update({ status: "open" });
      contestData.status = "open";
    } else if (phase === "voting" && contestData.status !== "voting") {
      await contest.update({ status: "voting" });
      contestData.status = "voting";
    } else if (
      (phase === "ended" || phase === "processing") &&
      contestData.status !== "completed"
    ) {
      await contest.update({ status: "completed" });
      contestData.status = "completed";
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
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // Merge the photos from both relationships, avoiding duplicates
    // Create a Set of photo IDs from the many-to-many relationship
    const photoIds = new Set(contestData.Photos.map((photo) => photo.id));

    // Add any legacy photos that aren't already included
    legacyPhotos.forEach((photo) => {
      const photoData = photo.toJSON();
      if (!photoIds.has(photoData.id)) {
        contestData.Photos.push(photoData);
      }
    });

    // If we're in the voting phase, get vote counts for each photo
    if (contestData.phase === "voting" || contestData.phase === "ended") {
      try {
        // Instead of using raw SQL, use Sequelize for better table name handling
        const photoIdArray = [...photoIds];

        // Get all votes for these photos in this contest
        const votes = await Vote.findAll({
          where: {
            photoId: { [Op.in]: photoIdArray },
            contestId: contest.id,
          },
          attributes: ["photoId", "value"],
          raw: true,
        });

        // Create a map to aggregate votes by photo
        const photoVotesMap = new Map();

        // Initialize each photo with zero votes
        photoIdArray.forEach((photoId) => {
          photoVotesMap.set(photoId, {
            voteCount: 0,
            totalScore: 0,
            averageRating: 0,
          });
        });

        // Calculate vote stats for each photo
        votes.forEach((vote) => {
          const photoStats = photoVotesMap.get(vote.photoId);
          if (photoStats) {
            photoStats.voteCount++;
            photoStats.totalScore += vote.value;
            photoStats.averageRating =
              photoStats.totalScore / photoStats.voteCount;
          }
        });

        // Add vote counts to each photo
        contestData.Photos = contestData.Photos.map((photo) => {
          const votes = photoVotesMap.get(photo.id) || {
            voteCount: 0,
            averageRating: 0,
            totalScore: 0,
          };

          // Simplify the votes array to prevent circular references
          if (photo.Votes) {
            votes.individualVotes = photo.Votes.map((vote) => ({
              id: vote.id,
              value: vote.value,
            }));
            delete photo.Votes;
          }

          return { ...photo, ...votes };
        });

        // Count total votes for the contest
        const totalVotes = votes.length;
        contestData.totalVotes = totalVotes;

        // Sort photos by votes
        contestData.Photos.sort((a, b) => {
          return (b.totalScore || 0) - (a.totalScore || 0);
        });
      } catch (error) {
        console.error("Error processing votes:", error);
        // Continue without votes if there's an error
      }
    }

    contestData.submissionCount = contestData.Photos.length;

    res.json(contestData);
  } catch (error) {
    console.error("Error fetching contest:", error);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
});

// Update contest
router.put("/contests/:id", requireAuth(), async (req, res) => {
  try {
    const contest = await Contest.findByPk(req.params.id);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Only allow admins to update contest details
    // You might want to implement proper admin checks here

    await contest.update({
      title: req.body.title || contest.title,
      description: req.body.description || contest.description,
      startDate: req.body.startDate || contest.startDate,
      endDate: req.body.endDate || contest.endDate,
      votingStartDate: req.body.votingStartDate || contest.votingStartDate,
      votingEndDate: req.body.votingEndDate || contest.votingEndDate,
      status: req.body.status || contest.status,
    });

    res.json(contest);
  } catch (error) {
    console.error("Error updating contest:", error);
    res
      .status(500)
      .json({ error: "Failed to update contest", details: error.message });
  }
});

export default router;
