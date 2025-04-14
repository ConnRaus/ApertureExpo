import models from "../models/index.js";
import sequelize from "../config/config.js";
import crypto from "crypto";

const { Contest } = models;

export async function seedTestContests() {
  try {
    // Get the current timestamp
    const now = new Date();

    // 1. Past contest (ended)
    const pastContestId = crypto.randomUUID();
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

    // 2. Upcoming contest (future - 14 days)
    const upcomingContestId = crypto.randomUUID();
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

    // 3. Active contest with 12 hours remaining
    const shortContestId = crypto.randomUUID();
    const shortContest = await Contest.create({
      id: shortContestId,
      title: "12-Hour Flash Contest",
      description:
        "A quick contest that will end in just 12 hours! Capture something spontaneous and share it now.",
      bannerImageUrl:
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      endDate: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours from now
      status: "active",
    });

    // 4. Active contest with 1 hour remaining
    const veryShortContestId = crypto.randomUUID();
    const veryShortContest = await Contest.create({
      id: veryShortContestId,
      title: "1-Hour Challenge",
      description:
        "You only have one hour to participate! Show us what you can do in this extremely short challenge.",
      bannerImageUrl: "https://wallpapershome.com/images/pages/pic_h/12465.jpg",
      startDate: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      endDate: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      status: "active",
    });

    // 5. Active contest with 1 minute remaining
    const expiringContestId = crypto.randomUUID();
    const expiringContest = await Contest.create({
      id: expiringContestId,
      title: "Last Minute Contest",
      description:
        "This contest is about to end! Just one minute remaining to submit your entry.",
      bannerImageUrl:
        "https://images.unsplash.com/photo-1472162314594-eca3c3d90df1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      startDate: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      endDate: new Date(now.getTime() + 60 * 1000), // 1 minute from now
      status: "active",
    });

    // 6. Contest starting in 1 minute
    const startingSoonContestId = crypto.randomUUID();
    const startingSoonContest = await Contest.create({
      id: startingSoonContestId,
      title: "Starting in 1 Minute",
      description:
        "This contest is about to begin! Just one minute until submissions open.",
      bannerImageUrl:
        "https://images.unsplash.com/photo-1502920514313-52581002a659?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      startDate: new Date(now.getTime() + 60 * 1000), // 1 minute from now
      endDate: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      status: "draft", // Use "draft" instead of "upcoming"
    });

    console.log("Test contests created successfully:", {
      past: pastContestId,
      upcoming: upcomingContestId,
      shortContest: shortContestId,
      veryShortContest: veryShortContestId,
      expiringContest: expiringContestId,
      startingSoonContest: startingSoonContestId,
    });

    return {
      pastContestId,
      upcomingContest,
      shortContest,
      veryShortContest,
      expiringContest,
      startingSoonContest,
    };
  } catch (error) {
    console.error("Error creating test contests:", error);
    throw error;
  }
}
