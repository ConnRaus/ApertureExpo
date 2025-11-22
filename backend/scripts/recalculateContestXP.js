import initializeDatabase, { sequelize } from "../database/index.js";
import XPService from "../services/xpService.js";
import XPTransaction from "../database/models/XPTransaction.js";
import User from "../database/models/User.js";
import { Op } from "sequelize";

/**
 * Script to recalculate XP for a contest
 * 
 * This script:
 * 1. Finds all placement-related XP transactions for the contest
 * 2. Deducts those XP amounts from users
 * 3. Deletes those transactions
 * 4. Recalculates correct placements using average rating
 * 5. Awards correct XP based on new placements
 * 6. Recalculates all affected users' total XP and levels from all transactions
 * 
 * Usage: node scripts/recalculateContestXP.js <contestId>
 */

async function recalculateContestXP(contestId) {
  try {
    console.log(`\n=== Recalculating XP for contest ${contestId} ===\n`);

    // Step 1: Find all placement-related XP transactions for this contest
    // Note: Only using enum values that exist in the database
    const placementActionTypes = [
      "PLACE_1ST",
      "PLACE_2ND",
      "PLACE_3RD",
      "TOP_10_PERCENT",
      "TOP_25_PERCENT",
      "TOP_50_PERCENT",
      "PARTICIPATION",
    ];
    
    // Also find transactions by contestId and reason text (in case some were stored differently)
    // This catches any placement-related transactions regardless of actionType
    const placementReasons = [
      "1st place",
      "2nd place",
      "3rd place",
      "Top 10%",
      "Top 25%",
      "Top 50%",
      "Contest participation",
    ];

    // Find transactions by actionType (valid enum values)
    const transactionsByType = await XPTransaction.findAll({
      where: {
        contestId,
        actionType: {
          [Op.in]: placementActionTypes,
        },
      },
    });
    
    // Also find transactions by reason text to catch any edge cases
    const transactionsByReason = await XPTransaction.findAll({
      where: {
        contestId,
        [Op.or]: placementReasons.map(reason => ({
          reason: {
            [Op.like]: `%${reason}%`
          }
        })),
      },
    });
    
    // Combine and deduplicate
    const allTransactionIds = new Set();
    const oldTransactions = [];
    
    [...transactionsByType, ...transactionsByReason].forEach(tx => {
      if (!allTransactionIds.has(tx.id)) {
        allTransactionIds.add(tx.id);
        oldTransactions.push(tx);
      }
    });

    console.log(`Found ${oldTransactions.length} placement XP transactions to remove`);

    // Step 2: Deduct XP from users and track affected users (only if there are transactions to remove)
    const affectedUserIds = new Set();
    let deletedCount = 0;

    if (oldTransactions.length > 0) {
      const userDeductions = new Map(); // userId -> total XP to deduct

      for (const transaction of oldTransactions) {
        const userId = transaction.userId;
        const xpAmount = transaction.xpAmount;

        affectedUserIds.add(userId);

        // Track total deduction per user
        if (!userDeductions.has(userId)) {
          userDeductions.set(userId, 0);
        }
        userDeductions.set(userId, userDeductions.get(userId) + xpAmount);
      }

      console.log(`\nAffected users: ${affectedUserIds.size}`);
      console.log("Deducting XP from users...");

      // Deduct XP from each affected user
      for (const [userId, totalDeduction] of userDeductions.entries()) {
        const user = await User.findByPk(userId);
        if (!user) {
          console.warn(`Warning: User ${userId} not found, skipping deduction`);
          continue;
        }

        const oldXP = user.xp;
        const newXP = Math.max(0, oldXP - totalDeduction);
        const newLevel = XPService.calculateLevelFromXP(newXP);

        await user.update({
          xp: newXP,
          level: newLevel,
        });

        console.log(
          `  User ${userId}: ${oldXP} XP -> ${newXP} XP (deducted ${totalDeduction})`
        );
      }

      // Step 3: Delete old transactions by their IDs (safer than querying again)
      const transactionIdsToDelete = oldTransactions.map(tx => tx.id);
      deletedCount = await XPTransaction.destroy({
        where: {
          id: {
            [Op.in]: transactionIdsToDelete,
          },
        },
      });

      console.log(`\nDeleted ${deletedCount} old XP transactions`);
    } else {
      console.log("No existing placement XP transactions found. Will proceed with recalculation anyway.");
    }

    // Step 4: Recalculate correct placements and award XP
    console.log("\nRecalculating placements using average rating...");
    const awardResult = await XPService.awardContestPlacementXP(contestId);

    if (!awardResult.success) {
      throw new Error(`Failed to award placement XP: ${awardResult.error}`);
    }

    console.log(
      `Awarded placement XP to ${awardResult.results?.length || 0} participants`
    );

    // Add any new users who received XP to the affected users set
    if (awardResult.results) {
      awardResult.results.forEach((result) => {
        if (result.userId) {
          affectedUserIds.add(result.userId);
        }
      });
    }

    // Step 5: Recalculate all affected users' total XP from all transactions
    if (affectedUserIds.size > 0) {
      console.log("\nRecalculating user totals from all transactions...");

      for (const userId of affectedUserIds) {
        // Get all XP transactions for this user
        const allTransactions = await XPTransaction.findAll({
          where: { userId },
          attributes: ["xpAmount"],
        });

        // Sum all XP amounts
        const totalXP = allTransactions.reduce(
          (sum, t) => sum + (t.xpAmount || 0),
          0
        );

        // Calculate level from total XP
        const calculatedLevel = XPService.calculateLevelFromXP(totalXP);

        // Update user
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({
            xp: totalXP,
            level: calculatedLevel,
          });

          console.log(
            `  User ${userId}: Total XP = ${totalXP}, Level = ${calculatedLevel}`
          );
        }
      }
    } else {
      console.log("\nNo users to recalculate totals for.");
    }

    console.log("\n=== Recalculation complete! ===\n");
    console.log("Summary:");
    console.log(`  - Removed ${deletedCount} old transactions`);
    console.log(`  - Recalculated XP for ${affectedUserIds.size} users`);
    console.log(`  - Awarded new placement XP to ${awardResult.results?.length || 0} participants`);

  } catch (error) {
    console.error("\nError recalculating contest XP:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const contestId = process.argv[2];

  if (!contestId) {
    console.error("Usage: node scripts/recalculateContestXP.js <contestId>");
    console.error("Example: node scripts/recalculateContestXP.js 6c9ef0d9-4308-4193-97e3-773f294b594a");
    process.exit(1);
  }

  try {
    // Initialize database connection
    await initializeDatabase();
    console.log("Database connected");

    // Run the recalculation
    await recalculateContestXP(contestId);

    // Close database connection
    await sequelize.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run if called directly
// Check if this file is being run directly (not imported)
const isMainModule = process.argv[1] && process.argv[1].endsWith("recalculateContestXP.js");
if (isMainModule) {
  main();
}

export { recalculateContestXP };

