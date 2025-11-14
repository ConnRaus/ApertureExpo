import express from "express";
import { requireAuth } from "@clerk/express";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import PhotoContest from "../database/models/PhotoContest.js";
import { getAuthFromRequest } from "../utils/auth.js";
import emailService from "../services/emailService.js";

const router = express.Router();

// Report a photo
router.post("/photos/:photoId/report", requireAuth(), async (req, res) => {
  try {
    const { photoId } = req.params;
    const { reason, customReason, contestId } = req.body;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Validate reason value
    const validReasons = [
      "off_topic",
      "inappropriate",
      "spam",
      "copyright",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid reason" });
    }

    // If reason is "other", customReason should be provided
    if (reason === "other" && !customReason) {
      return res.status(400).json({
        error: "Custom reason is required when reason is 'other'",
      });
    }

    // Get auth object
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const reporterId = auth.userId;
    const reporterEmail = auth.sessionClaims?.email || null;

    // Find the photo
    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // Get contest information if contestId is provided, otherwise try to find it
    let foundContestId = contestId;
    let contestTitle = null;
    
    if (foundContestId) {
      const contest = await Contest.findByPk(foundContestId);
      if (contest) {
        contestTitle = contest.title;
      }
    } else {
      // Try to find if photo is in any contest
      const photoContest = await PhotoContest.findOne({
        where: { photoId },
        include: [{ model: Contest, attributes: ["id", "title"] }],
      });
      if (photoContest && photoContest.Contest) {
        foundContestId = photoContest.Contest.id;
        contestTitle = photoContest.Contest.title;
      }
    }

    // Build photo URL - construct based on your frontend URL structure
    const frontendUrl =
      process.env.FRONTEND_URL || process.env.CORS_ALLOWED_ORIGINS?.split(",")[0] || "http://localhost:80";
    const photoUrl = `${frontendUrl}/users/${photo.userId}?photoId=${photoId}`;

    // Send email report
    await emailService.sendPhotoReport({
      photoId,
      photoUrl,
      reason,
      customReason,
      contestId: foundContestId || null,
      contestTitle,
      reporterId,
      reporterEmail,
      photoOwnerId: photo.userId,
    });

    res.json({
      success: true,
      message: "Photo report submitted successfully",
    });
  } catch (error) {
    console.error("Error reporting photo:", error);
    res.status(500).json({
      error: "Failed to submit photo report",
      message: error.message,
    });
  }
});

export default router;

