import User from "../database/models/User.js";
import XPTransaction from "../database/models/XPTransaction.js";

class XPService {
  // XP reward amounts for different actions
  static XP_REWARDS = {
    SUBMIT_PHOTO: 25, // Submitting a photo to a contest
    VOTE: 5, // Voting on a photo
    PLACE_1ST: 200, // Winning 1st place
    PLACE_2ND: 150, // Winning 2nd place
    PLACE_3RD: 100, // Winning 3rd place
    TOP_10_PERCENT: 50, // Placing in top 10% of contest
    TOP_25_PERCENT: 25, // Placing in top 25% of contest
  };

  /**
   * Calculate required XP for a given level
   * Uses exponential growth: level^2 * 100
   */
  static getXpForLevel(level) {
    return Math.floor(Math.pow(level, 2) * 100);
  }

  /**
   * Calculate what level a user should be based on their current XP
   */
  static calculateLevelFromXP(currentXP) {
    let level = 0;
    while (this.getXpForLevel(level + 1) <= currentXP) {
      level++;
    }
    return level;
  }

  /**
   * Get XP needed for next level
   */
  static getXpToNextLevel(currentLevel, currentXP) {
    const nextLevelXP = this.getXpForLevel(currentLevel + 1);
    return nextLevelXP - currentXP;
  }

  /**
   * Enrich user data with calculated XP stats
   * This is the SINGLE SOURCE OF TRUTH for XP calculations
   * Use this method whenever returning user data to ensure consistency
   */
  static enrichUserWithXPData(user) {
    if (!user || typeof user.xp === "undefined") {
      return user;
    }

    const currentXP = user.xp || 0;
    const calculatedLevel = this.calculateLevelFromXP(currentXP);
    const currentLevelXP = this.getXpForLevel(calculatedLevel);
    const nextLevelXP = this.getXpForLevel(calculatedLevel + 1);
    const xpInCurrentLevel = currentXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentXP;
    const progressPercent =
      (xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100;

    return {
      ...user,
      level: calculatedLevel, // Override with calculated level
      xp: currentXP,
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent: Math.round(progressPercent * 100) / 100,
    };
  }

  /**
   * Award XP to a user and handle level-ups
   */
  static async awardXP(
    userId,
    xpAmount,
    reason = "",
    actionType,
    contestId = null,
    photoId = null
  ) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const oldLevel = user.level;
      const newXP = user.xp + xpAmount;
      const newLevel = this.calculateLevelFromXP(newXP);

      // Update user's total XP and level
      await user.update({
        xp: newXP,
        level: newLevel,
      });

      // Log the XP transaction for time-based leaderboards
      await XPTransaction.create({
        userId,
        xpAmount,
        reason,
        actionType,
        contestId,
        photoId,
        awardedAt: new Date(),
      });

      const leveledUp = newLevel > oldLevel;

      return {
        success: true,
        xpAwarded: xpAmount,
        newXP,
        oldLevel,
        newLevel,
        leveledUp,
        reason,
      };
    } catch (error) {
      console.error("Error awarding XP:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deduct XP from a user and handle level-downs
   */
  static async deductXP(
    userId,
    xpAmount,
    reason = "",
    actionType,
    contestId = null,
    photoId = null
  ) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const oldLevel = user.level;
      const newXP = Math.max(0, user.xp - xpAmount); // Don't let XP go below 0
      const newLevel = this.calculateLevelFromXP(newXP);

      // Update user's total XP and level
      await user.update({
        xp: newXP,
        level: newLevel,
      });

      // Log the XP transaction as a negative amount
      await XPTransaction.create({
        userId,
        xpAmount: -xpAmount, // Negative to indicate deduction
        reason,
        actionType,
        contestId,
        photoId,
        awardedAt: new Date(),
      });

      const leveledDown = newLevel < oldLevel;

      return {
        success: true,
        xpDeducted: xpAmount,
        newXP,
        oldLevel,
        newLevel,
        leveledDown,
        reason,
      };
    } catch (error) {
      console.error("Error deducting XP:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Award XP for submitting a photo to a contest
   */
  static async awardSubmissionXP(userId, contestId = null, photoId = null) {
    return await this.awardXP(
      userId,
      this.XP_REWARDS.SUBMIT_PHOTO,
      "Photo submission",
      "SUBMIT_PHOTO",
      contestId,
      photoId
    );
  }

  /**
   * Award XP for voting on a photo
   */
  static async awardVoteXP(userId, contestId = null, photoId = null) {
    return await this.awardXP(
      userId,
      this.XP_REWARDS.VOTE,
      "Vote cast",
      "VOTE",
      contestId,
      photoId
    );
  }

  /**
   * Award XP based on contest placement
   */
  static async awardPlacementXP(
    userId,
    placement,
    totalParticipants,
    contestId = null,
    photoId = null
  ) {
    let xpAmount = 0;
    let reason = "";
    let actionType = "";

    if (placement === 1) {
      xpAmount = this.XP_REWARDS.PLACE_1ST;
      reason = "1st place finish";
      actionType = "PLACE_1ST";
    } else if (placement === 2) {
      xpAmount = this.XP_REWARDS.PLACE_2ND;
      reason = "2nd place finish";
      actionType = "PLACE_2ND";
    } else if (placement === 3) {
      xpAmount = this.XP_REWARDS.PLACE_3RD;
      reason = "3rd place finish";
      actionType = "PLACE_3RD";
    } else {
      // Calculate percentage-based rewards
      const percentile = (placement / totalParticipants) * 100;

      if (percentile <= 10) {
        xpAmount = this.XP_REWARDS.TOP_10_PERCENT;
        reason = "Top 10% finish";
        actionType = "TOP_10_PERCENT";
      } else if (percentile <= 25) {
        xpAmount = this.XP_REWARDS.TOP_25_PERCENT;
        reason = "Top 25% finish";
        actionType = "TOP_25_PERCENT";
      }
    }

    if (xpAmount > 0) {
      return await this.awardXP(
        userId,
        xpAmount,
        reason,
        actionType,
        contestId,
        photoId
      );
    }

    return {
      success: true,
      xpAwarded: 0,
      reason: "No XP reward for this placement",
    };
  }

  /**
   * Get user's XP stats including progress to next level
   */
  static async getUserXPStats(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Always recalculate level based on current XP to handle stale data
      const calculatedLevel = this.calculateLevelFromXP(user.xp);

      // If the stored level is wrong, update it
      if (user.level !== calculatedLevel) {
        await user.update({ level: calculatedLevel });
      }

      const currentLevelXP = this.getXpForLevel(calculatedLevel);
      const nextLevelXP = this.getXpForLevel(calculatedLevel + 1);
      const xpInCurrentLevel = user.xp - currentLevelXP;
      const xpNeededForNextLevel = nextLevelXP - user.xp;
      const progressPercent =
        (xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100;

      return {
        level: calculatedLevel,
        totalXP: user.xp,
        currentLevelXP,
        nextLevelXP,
        xpInCurrentLevel,
        xpNeededForNextLevel,
        progressPercent: Math.round(progressPercent * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting user XP stats:", error);
      throw error;
    }
  }

  /**
   * Award placement XP to all participants in a completed contest
   */
  static async awardContestPlacementXP(contestId) {
    try {
      // Import dynamically to avoid circular dependencies
      const { default: Contest } = await import(
        "../database/models/Contest.js"
      );
      const { default: Photo } = await import("../database/models/Photo.js");
      const { default: Vote } = await import("../database/models/Vote.js");
      const { default: PhotoContest } = await import(
        "../database/models/PhotoContest.js"
      );
      const { Op } = await import("sequelize");

      // Get all photos in the contest with their vote totals
      const photosInContest = await Photo.findAll({
        include: [
          {
            model: Contest,
            as: "Contests",
            where: { id: contestId },
            through: { attributes: [] },
          },
          {
            model: Vote,
            as: "Votes",
            attributes: ["value"],
            where: { contestId },
            required: false,
          },
        ],
      });

      // Also get legacy photos with ContestId
      const legacyPhotos = await Photo.findAll({
        where: { ContestId: contestId },
        include: [
          {
            model: Vote,
            as: "Votes",
            attributes: ["value"],
            where: { contestId },
            required: false,
          },
        ],
      });

      // Combine and deduplicate photos
      const allPhotos = [...photosInContest, ...legacyPhotos];
      const uniquePhotos = allPhotos.reduce((acc, photo) => {
        if (!acc.find((p) => p.id === photo.id)) {
          acc.push(photo);
        }
        return acc;
      }, []);

      if (uniquePhotos.length === 0) {
        console.log(`No photos found for contest ${contestId}`);
        return { success: true, message: "No photos in contest" };
      }

      // Calculate total votes for each photo
      const photoScores = uniquePhotos.map((photo) => {
        const totalVotes = photo.Votes.reduce(
          (sum, vote) => sum + vote.value,
          0
        );
        return {
          userId: photo.userId,
          photoId: photo.id,
          totalVotes,
          voteCount: photo.Votes.length,
        };
      });

      // Sort by total votes (descending), then by vote count as tiebreaker
      photoScores.sort((a, b) => {
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        return b.voteCount - a.voteCount;
      });

      // Award XP based on placement
      const results = [];
      const totalParticipants = photoScores.length;

      for (let i = 0; i < photoScores.length; i++) {
        const placement = i + 1;
        const { userId } = photoScores[i];

        const xpResult = await this.awardPlacementXP(
          userId,
          placement,
          totalParticipants,
          contestId,
          photoScores[i].photoId
        );
        results.push({
          userId,
          placement,
          ...xpResult,
        });
      }

      console.log(
        `Awarded placement XP for contest ${contestId} to ${results.length} participants`
      );
      return { success: true, results };
    } catch (error) {
      console.error("Error awarding contest placement XP:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get time-based XP totals for users
   */
  static async getTimeBasedLeaderboard(timeframe = "all", limit = 50) {
    try {
      const { Op } = await import("sequelize");
      const { clerkClient } = await import("@clerk/express");
      const sequelize = User.sequelize;

      let whereClause = {};

      // Calculate date range based on timeframe
      if (timeframe === "monthly") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.awardedAt = {
          [Op.gte]: startOfMonth,
        };
      } else if (timeframe === "yearly") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        whereClause.awardedAt = {
          [Op.gte]: startOfYear,
        };
      }
      // For 'all' timeframe, no date restriction

      if (timeframe === "all") {
        // Use existing all-time leaderboard from User model
        const users = await User.findAll({
          attributes: ["id", "nickname", "level", "xp"],
          order: [
            ["xp", "DESC"], // Order by XP, level will be calculated
          ],
          limit,
          where: {
            nickname: {
              [Op.ne]: null,
            },
          },
        });

        // Fetch avatars for all users in parallel
        const usersWithAvatars = await Promise.all(
          users.map(async (user, index) => {
            const userData = user.toJSON ? user.toJSON() : user;
            const enrichedUser = this.enrichUserWithXPData(userData);

            // Fetch Clerk avatar
            let avatarUrl = null;
            try {
              const clerkUser = await clerkClient.users.getUser(
                enrichedUser.id
              );
              avatarUrl = clerkUser.imageUrl || null;
            } catch (err) {
              // Continue without avatar if Clerk fetch fails
            }

            return {
              rank: index + 1,
              userId: enrichedUser.id,
              nickname: enrichedUser.nickname,
              avatarUrl,
              level: enrichedUser.level, // Calculated level
              xp: enrichedUser.xp,
              timeframeXP: enrichedUser.xp, // For all-time, total XP = timeframe XP
            };
          })
        );

        return usersWithAvatars;
      } else {
        // For monthly/yearly, calculate from transactions
        // First get the timeframe XP totals
        const timeframeXP = await XPTransaction.findAll({
          attributes: [
            "userId",
            [sequelize.fn("SUM", sequelize.col("xpAmount")), "timeframeXP"],
          ],
          where: whereClause,
          group: ["userId"],
          order: [[sequelize.fn("SUM", sequelize.col("xpAmount")), "DESC"]],
          limit,
          raw: true,
        });

        // Get user data for those users
        const userIds = timeframeXP.map((result) => result.userId);
        const users = await User.findAll({
          attributes: ["id", "nickname", "level", "xp"],
          where: {
            id: {
              [Op.in]: userIds,
            },
            nickname: {
              [Op.ne]: null,
            },
          },
        });

        // Create a map for quick lookup
        const userMap = {};
        users.forEach((user) => {
          const userData = user.toJSON ? user.toJSON() : user;
          userMap[user.id] = userData;
        });

        // Combine the data and fetch avatars
        const leaderboardWithAvatars = await Promise.all(
          timeframeXP
            .filter((result) => userMap[result.userId]) // Only include users with valid data
            .map(async (result, index) => {
              const user = userMap[result.userId];
              const enrichedUser = this.enrichUserWithXPData(user);

              // Fetch Clerk avatar
              let avatarUrl = null;
              try {
                const clerkUser = await clerkClient.users.getUser(
                  result.userId
                );
                avatarUrl = clerkUser.imageUrl || null;
              } catch (err) {
                // Continue without avatar if Clerk fetch fails
              }

              return {
                rank: index + 1,
                userId: result.userId,
                nickname: enrichedUser.nickname,
                avatarUrl,
                level: enrichedUser.level, // Calculated level
                xp: enrichedUser.xp, // Total all-time XP
                timeframeXP: parseInt(result.timeframeXP) || 0, // XP for this timeframe
              };
            })
        );

        return leaderboardWithAvatars;
      }
    } catch (error) {
      console.error(`Error getting ${timeframe} leaderboard:`, error);
      throw error;
    }
  }

  /**
   * Get leaderboard of users by level and XP (legacy method - now uses timeframe)
   */
  static async getLeaderboard(limit = 50) {
    return await this.getTimeBasedLeaderboard("all", limit);
  }

  /**
   * Get recent XP transactions for a user
   */
  static async getRecentTransactions(userId, limit = 20) {
    try {
      const transactions = await XPTransaction.findAll({
        where: { userId },
        order: [["awardedAt", "DESC"]],
        limit,
        include: [
          {
            model: (await import("../database/models/Contest.js")).default,
            as: "Contest",
            attributes: ["id", "title"],
            required: false,
          },
        ],
      });

      return transactions.map((t) => ({
        id: t.id,
        xpAmount: t.xpAmount,
        reason: t.reason,
        actionType: t.actionType,
        contestId: t.contestId,
        contestTitle: t.Contest?.title,
        photoId: t.photoId,
        awardedAt: t.awardedAt,
      }));
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      throw error;
    }
  }

  /**
   * Get user's XP stats for a specific timeframe
   */
  static async getUserTimeframeXP(userId, timeframe = "all") {
    try {
      const { Op } = await import("sequelize");
      const sequelize = User.sequelize;

      if (timeframe === "all") {
        const user = await User.findByPk(userId);
        return user ? user.xp : 0;
      }

      let whereClause = { userId };

      if (timeframe === "monthly") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.awardedAt = {
          [Op.gte]: startOfMonth,
        };
      } else if (timeframe === "yearly") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        whereClause.awardedAt = {
          [Op.gte]: startOfYear,
        };
      }

      const result = await XPTransaction.findOne({
        attributes: [
          [sequelize.fn("SUM", sequelize.col("xpAmount")), "timeframeXP"],
        ],
        where: whereClause,
      });

      return parseInt(result?.dataValues?.timeframeXP) || 0;
    } catch (error) {
      console.error(`Error getting user ${timeframe} XP:`, error);
      return 0;
    }
  }
}

export default XPService;
