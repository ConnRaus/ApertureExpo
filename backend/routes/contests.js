import express from "express";
import { requireAuth } from "@clerk/express";
import Contest from "../database/models/Contest.js";
import Photo from "../database/models/Photo.js";
import Vote from "../database/models/Vote.js";
import { Op } from "sequelize";
import sequelize from "../database/config/config.js";
import User from "../database/models/User.js";
import { getAuthFromRequest } from "../utils/auth.js";

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
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
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
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "nickname"],
            },
          ],
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
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25; // 25 photos per page
    const offset = (page - 1) * limit;

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
            "metadata",
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
        "metadata",
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

    // Create a combined list of all unique photo IDs for this contest
    const allPhotoIds = new Set(contestData.Photos.map((p) => p.id));
    legacyPhotos.forEach((p) => allPhotoIds.add(p.id));
    const finalPhotoIds = Array.from(allPhotoIds);

    // Filter the contestData.Photos to include only those in finalPhotoIds (removes potential duplicates before counting)
    contestData.Photos = contestData.Photos.filter((p) =>
      allPhotoIds.has(p.id)
    );

    // Count total photos *after* merging and deduplication
    const totalPhotos = finalPhotoIds.length;

    // --- Sort photos by createdAt DESC by default ---
    contestData.Photos.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    // --- End default sorting ---

    // --- Get user-specific submission count if authenticated ---
    let userSubmissionCount = 0;
    try {
      const auth = getAuthFromRequest(req);
      if (auth && auth.userId) {
        // Count photos in the final list that belong to the current user
        userSubmissionCount = contestData.Photos.filter(
          (p) => p.userId === auth.userId
        ).length;
      }
    } catch (authError) {
      // If auth extraction fails, just continue with userSubmissionCount = 0
      console.log(
        "Auth extraction failed, continuing without user submission count"
      );
    }
    // --- End user-specific submission count ---

    // If we're in the voting phase, get vote counts for each photo
    if (contestData.phase === "voting" || contestData.phase === "ended") {
      try {
        // Instead of using raw SQL, use Sequelize for better table name handling
        const photoIdArray = [...finalPhotoIds];

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

        // Sort photos based on phase
        contestData.Photos.sort((a, b) => {
          if (contestData.phase === "voting") {
            // During voting, sort by lowest score first
            return (a.totalScore || 0) - (b.totalScore || 0);
          } else {
            // After voting (ended phase), sort by highest score first
            return (b.totalScore || 0) - (a.totalScore || 0);
          }
        });
      } catch (error) {
        console.error("Error processing votes:", error);
        // Continue without votes if there's an error
      }
    }

    contestData.submissionCount = totalPhotos;
    contestData.userSubmissionCount = userSubmissionCount;

    // Apply pagination to photos array *after* all processing and sorting
    const paginatedPhotos = contestData.Photos.slice(offset, offset + limit);

    // Return pagination metadata along with contest data
    res.json({
      ...contestData,
      Photos: paginatedPhotos,
      pagination: {
        page,
        limit,
        totalPhotos,
        totalPages: Math.ceil(totalPhotos / limit),
      },
    });
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

// Get top-voted photos in a contest
router.get("/contests/:contestId/top-photos", async (req, res) => {
  try {
    const { contestId } = req.params;
    // We ignore the requested limit for now, as we need to handle ties correctly.
    // We might fetch more than 3 initially to find the 3rd place score.

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // --- Find all photos associated with the contest ---
    let directPhotos = await Photo.findAll({
      where: { ContestId: contestId },
      attributes: ["id"],
      raw: true,
    });
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
    let manyToManyPhotos =
      contestWithPhotos?.Photos?.map((p) => ({ id: p.id })) || [];
    const allPhotoIds = [
      ...new Set([
        ...directPhotos.map((p) => p.id),
        ...manyToManyPhotos.map((p) => p.id),
      ]),
    ];

    if (allPhotoIds.length === 0) {
      return res.json([]);
    }
    // --- End find all photos ---

    // Get votes for ALL these photos
    const votes = await Vote.findAll({
      where: {
        photoId: { [Op.in]: allPhotoIds },
        contestId: contestId,
      },
      attributes: ["photoId", "value"],
      raw: true,
    });

    // Get full photo details for ALL photos
    const photos = await Photo.findAll({
      where: { id: { [Op.in]: allPhotoIds } },
      include: [{ model: User, as: "User", attributes: ["id", "nickname"] }],
      attributes: ["id", "title", "thumbnailUrl", "s3Url", "userId"],
    });

    // Calculate stats for ALL photos
    const photoStatsMap = new Map();
    allPhotoIds.forEach((photoId) => {
      photoStatsMap.set(photoId, {
        voteCount: 0,
        totalScore: 0,
        averageRating: 0,
      });
    });

    votes.forEach((vote) => {
      const stats = photoStatsMap.get(vote.photoId);
      if (stats) {
        stats.voteCount++;
        stats.totalScore += vote.value;
      }
    });

    // Calculate average rating after counting votes
    photoStatsMap.forEach((stats) => {
      if (stats.voteCount > 0) {
        stats.averageRating = stats.totalScore / stats.voteCount;
      }
    });

    // Combine photo data with vote stats for ALL photos
    const allPhotosWithStats = photos.map((photo) => {
      const photoData = photo.toJSON();
      const stats = photoStatsMap.get(photo.id) || {
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

    // Sort ALL photos by score and vote count
    allPhotosWithStats.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.voteCount - a.voteCount; // Secondary sort by vote count
    });

    // Assign ranks correctly, handling ties
    let currentRank = 0;
    let lastScore = -Infinity; // Use -Infinity to handle potential zero/negative scores correctly
    let photosProcessedForRank = 0;
    const rankedPhotos = allPhotosWithStats.map((photo) => {
      photosProcessedForRank++;
      if (photo.totalScore < lastScore) {
        // Only update rank if the score is lower than the previous photo's score
        currentRank = photosProcessedForRank;
      } else if (lastScore === -Infinity) {
        // First photo always gets rank 1
        currentRank = 1;
      }
      // If score is same as last, currentRank remains unchanged

      lastScore = photo.totalScore;
      return { ...photo, rank: currentRank };
    });

    // Filter to include only photos with rank 1, 2, or 3
    const finalWinners = rankedPhotos.filter((p) => p.rank <= 3);

    res.json(finalWinners);
  } catch (error) {
    console.error(
      `Error getting top photos for contest ${req.params.contestId}:`,
      error
    );
    res.status(500).json({ error: "Failed to get top photos" });
  }
});

export default router;
