import models from "../models/index.js";
import sequelize from "../config/config.js";
import crypto from "crypto";

const { Contest } = models;

export async function seedTestContests() {
  try {
    // Generate UUIDs for our contests
    const pastContestId = crypto.randomUUID();
    const upcomingContestId = crypto.randomUUID();

    // Get the current timestamp
    const now = new Date();

    // For the past contest, we need to bypass the model validations
    // by using a raw SQL query or Sequelize's direct query method
    await sequelize.query(`
      INSERT INTO "Contests" (
        "id", "title", "description", "bannerImageUrl", 
        "startDate", "endDate", "status", "createdAt", "updatedAt"
      ) VALUES (
        '${pastContestId}',
        'Vintage Photography',
        'A look back at classic photography techniques and styles. Share your best vintage-style photos!',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
        '${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()}',
        '${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}',
        'completed',
        '${now.toISOString()}',
        '${now.toISOString()}'
      )
    `);

    // For the upcoming contest, we can still use the model since future dates are valid
    const upcomingContest = await Contest.create({
      id: upcomingContestId,
      title: "Urban Architecture",
      description:
        "Showcase the best architectural photography from your city. Modern buildings, historic structures, or unique urban details.",
      bannerImageUrl:
        "https://images.unsplash.com/photo-1517713982677-4b66332f98de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "draft", // This will be overridden by our date-based calculation
    });

    console.log("Test contests created successfully:", {
      past: pastContestId,
      upcoming: upcomingContestId,
    });

    return {
      pastContestId,
      upcomingContest,
    };
  } catch (error) {
    console.error("Error creating test contests:", error);
    throw error;
  }
}
