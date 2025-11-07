import express from "express";
import { requireAuth } from "@clerk/express";
import XPService from "../services/xpService.js";
import { getAuthFromRequest } from "../utils/auth.js";

const router = express.Router();

// Get current user's XP stats
router.get("/stats", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await XPService.getUserXPStats(auth.userId);
    res.json(stats);
  } catch (error) {
    console.error("Error getting user XP stats:", error);
    res.status(500).json({ error: "Failed to get XP stats" });
  }
});

// Get XP leaderboard with timeframe support
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const timeframe = req.query.timeframe || "all"; // all, monthly, yearly

    // Validate timeframe
    if (!["all", "monthly", "yearly"].includes(timeframe)) {
      return res.status(400).json({
        error: "Invalid timeframe. Use 'all', 'monthly', or 'yearly'",
      });
    }

    const leaderboard = await XPService.getTimeBasedLeaderboard(
      timeframe,
      limit
    );
    res.json({
      timeframe,
      leaderboard,
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

// Get user's XP for specific timeframe
router.get("/user-timeframe/:timeframe", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { timeframe } = req.params;

    // Validate timeframe
    if (!["all", "monthly", "yearly"].includes(timeframe)) {
      return res.status(400).json({
        error: "Invalid timeframe. Use 'all', 'monthly', or 'yearly'",
      });
    }

    const timeframeXP = await XPService.getUserTimeframeXP(
      auth.userId,
      timeframe
    );
    res.json({
      timeframe,
      xp: timeframeXP,
    });
  } catch (error) {
    console.error("Error getting user timeframe XP:", error);
    res.status(500).json({ error: "Failed to get user timeframe XP" });
  }
});

// Get specific user's XP for timeframe (public endpoint)
router.get("/user/:userId/timeframe/:timeframe", async (req, res) => {
  try {
    const { userId, timeframe } = req.params;

    // Validate timeframe
    if (!["all", "monthly", "yearly"].includes(timeframe)) {
      return res.status(400).json({
        error: "Invalid timeframe. Use 'all', 'monthly', or 'yearly'",
      });
    }

    const timeframeXP = await XPService.getUserTimeframeXP(userId, timeframe);
    res.json({
      userId,
      timeframe,
      xp: timeframeXP,
    });
  } catch (error) {
    console.error("Error getting user timeframe XP:", error);
    res.status(500).json({ error: "Failed to get user timeframe XP" });
  }
});

// Get XP rewards information
router.get("/rewards", async (req, res) => {
  try {
    res.json({
      rewards: XPService.XP_REWARDS,
      levelFormula: "level² × 50",
      description: {
        SUBMIT_PHOTO: "Submit a photo to a contest",
        VOTE: "Vote on a photo",
        PLACE_1ST: "1st place",
        PLACE_2ND: "2nd place",
        PLACE_3RD: "3rd place",
        TOP_10_PERCENT: "Top 10% placement",
        TOP_25_PERCENT: "Top 25% placement",
        TOP_50_PERCENT: "Top 50% placement",
      },
      stackingInfo: {
        enabled: true,
        explanation:
          "Contest rewards stack! Winners receive placement bonuses PLUS all percentile rewards they qualify for.",
        examples: [
          {
            placement: "1st Place",
            rewards: ["1st place", "Top 10%", "Top 25%", "Top 50%"],
            total:
              XPService.XP_REWARDS.PLACE_1ST +
              XPService.XP_REWARDS.TOP_10_PERCENT +
              XPService.XP_REWARDS.TOP_25_PERCENT +
              XPService.XP_REWARDS.TOP_50_PERCENT,
          },
          {
            placement: "2nd Place",
            rewards: ["2nd place", "Top 10%", "Top 25%", "Top 50%"],
            total:
              XPService.XP_REWARDS.PLACE_2ND +
              XPService.XP_REWARDS.TOP_10_PERCENT +
              XPService.XP_REWARDS.TOP_25_PERCENT +
              XPService.XP_REWARDS.TOP_50_PERCENT,
          },
          {
            placement: "3rd Place",
            rewards: ["3rd place", "Top 10%", "Top 25%", "Top 50%"],
            total:
              XPService.XP_REWARDS.PLACE_3RD +
              XPService.XP_REWARDS.TOP_10_PERCENT +
              XPService.XP_REWARDS.TOP_25_PERCENT +
              XPService.XP_REWARDS.TOP_50_PERCENT,
          },
          {
            placement: "Top 10%",
            rewards: ["Top 10%", "Top 25%", "Top 50%"],
            total:
              XPService.XP_REWARDS.TOP_10_PERCENT +
              XPService.XP_REWARDS.TOP_25_PERCENT +
              XPService.XP_REWARDS.TOP_50_PERCENT,
          },
          {
            placement: "Top 25%",
            rewards: ["Top 25%", "Top 50%"],
            total:
              XPService.XP_REWARDS.TOP_25_PERCENT +
              XPService.XP_REWARDS.TOP_50_PERCENT,
          },
          {
            placement: "Top 50%",
            rewards: ["Top 50%"],
            total: XPService.XP_REWARDS.TOP_50_PERCENT,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error getting XP rewards info:", error);
    res.status(500).json({ error: "Failed to get XP rewards info" });
  }
});

// Get recent XP transactions for current user
router.get("/transactions/recent", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limit = parseInt(req.query.limit) || 20;
    const transactions = await XPService.getRecentTransactions(
      auth.userId,
      limit
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error getting recent transactions:", error);
    res.status(500).json({ error: "Failed to get recent transactions" });
  }
});

export default router;
