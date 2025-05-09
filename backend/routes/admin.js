// backend/routes/admin.js
import express from "express";
import { requireAuth } from "@clerk/express";
import { adminCheck } from "../middleware/adminCheck.js";
import Contest from "../database/models/Contest.js";

const router = express.Router();

// Apply auth check and admin check to all routes in this router
router.use(requireAuth(), adminCheck);

// GET all contests (for admin view)
router.get("/contests", async (req, res) => {
  try {
    const contests = await Contest.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(contests);
  } catch (error) {
    console.error("Error fetching contests for admin:", error);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

// GET a single contest by ID
router.get("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    const contest = await Contest.findByPk(contestId);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    res.json(contest);
  } catch (error) {
    console.error("Error fetching contest for admin:", error);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
});

// CREATE a new contest
router.post("/contests", async (req, res) => {
  try {
    const {
      title,
      description,
      bannerImageUrl,
      startDate,
      endDate,
      votingStartDate,
      votingEndDate,
      maxPhotosPerUser,
      status,
    } = req.body;

    // Basic validation
    if (
      !title ||
      !startDate ||
      !endDate ||
      !votingStartDate ||
      !votingEndDate
    ) {
      return res.status(400).json({
        error: "Missing required fields for contest creation",
      });
    }

    const newContest = await Contest.create({
      title,
      description,
      bannerImageUrl,
      startDate,
      endDate,
      votingStartDate,
      votingEndDate,
      maxPhotosPerUser: maxPhotosPerUser || null,
      status: status || undefined, // Use model default if not specified
    });

    res.status(201).json(newContest);
  } catch (error) {
    console.error("Error creating contest:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors.map((e) => e.message),
      });
    }
    res.status(500).json({ error: "Failed to create contest" });
  }
});

// UPDATE a contest
router.put("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    const {
      title,
      description,
      bannerImageUrl,
      startDate,
      endDate,
      votingStartDate,
      votingEndDate,
      maxPhotosPerUser,
      status,
    } = req.body;

    const contest = await Contest.findByPk(contestId);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Update the contest with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (bannerImageUrl !== undefined)
      updateData.bannerImageUrl = bannerImageUrl;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (votingStartDate !== undefined)
      updateData.votingStartDate = votingStartDate;
    if (votingEndDate !== undefined) updateData.votingEndDate = votingEndDate;
    if (maxPhotosPerUser !== undefined)
      updateData.maxPhotosPerUser = maxPhotosPerUser;
    if (status !== undefined) updateData.status = status;

    await contest.update(updateData);

    res.json(await contest.reload());
  } catch (error) {
    console.error("Error updating contest:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors.map((e) => e.message),
      });
    }
    res.status(500).json({ error: "Failed to update contest" });
  }
});

// DELETE a contest
router.delete("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    const contest = await Contest.findByPk(contestId);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    await contest.destroy();
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting contest:", error);
    res.status(500).json({ error: "Failed to delete contest" });
  }
});

export default router;
