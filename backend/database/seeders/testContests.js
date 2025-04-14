import models from "../models/index.js";
import { randomUUID } from "node:crypto";

const { Contest, sequelize } = models;

export async function seedTestContests() {
  try {
    // Create past contest
    const pastContest = await Contest.create({
      id: randomUUID(),
      title: "Vintage Photography",
      description:
        "Submit your best vintage-style photographs or photos of vintage items.",
      bannerImageUrl:
        "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      votingStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Same as endDate
      votingEndDate: new Date(Date.now()), // 7 days after endDate (today)
      status: "completed",
    });

    // Create upcoming contest
    const upcomingContest = await Contest.create({
      id: randomUUID(),
      title: "Urban Architecture",
      description:
        "Capture stunning architectural details or entire structures in urban environments.",
      bannerImageUrl:
        "https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg",
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      votingStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Same as endDate
      votingEndDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 7 days after endDate
      status: "draft",
    });

    // Create active contest
    const activeContest = await Contest.create({
      id: randomUUID(),
      title: "12-Hour Flash Contest",
      description:
        "A quick contest to test your creativity under time pressure. Submit your best work created in the last 12 hours.",
      bannerImageUrl:
        "https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg",
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      votingStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Same as endDate
      votingEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 7 days after endDate
      status: "active",
    });

    // Create 1-hour challenge
    const oneHourContest = await Contest.create({
      id: randomUUID(),
      title: "1-Hour Challenge",
      description:
        "Take and submit your best shot within a 1-hour timeframe. No editing allowed!",
      bannerImageUrl:
        "https://images.pexels.com/photos/3075988/pexels-photo-3075988.jpeg",
      startDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      endDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      votingStartDate: new Date(Date.now() + 30 * 60 * 1000), // Same as endDate
      votingEndDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
      ), // 7 days after endDate
      status: "active",
    });

    // Create last minute contest
    const lastMinuteContest = await Contest.create({
      id: randomUUID(),
      title: "Last Minute Contest",
      description:
        "Submit your best last-minute photo for this quick challenge.",
      bannerImageUrl:
        "https://images.pexels.com/photos/1028600/pexels-photo-1028600.jpeg",
      startDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      endDate: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now
      votingStartDate: new Date(Date.now() + 3 * 60 * 1000), // Same as endDate
      votingEndDate: new Date(Date.now() + 3 * 60 * 1000 + 3 * 60 * 1000), // 3 minutes after voting start date
      status: "active",
    });

    // Create contest starting in 1 minute
    const startingSoonContest = await Contest.create({
      id: randomUUID(),
      title: "Starting in 1 Minute",
      description: "Get ready for this quick contest starting very soon!",
      bannerImageUrl:
        "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg",
      startDate: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now
      endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      votingStartDate: new Date(Date.now() + 60 * 60 * 1000), // Same as endDate
      votingEndDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
      ), // 7 days after endDate
      status: "draft",
    });

    console.log("Test contests created with IDs:", {
      pastContestId: pastContest.id,
      upcomingContestId: upcomingContest.id,
      activeContestId: activeContest.id,
      oneHourContestId: oneHourContest.id,
      lastMinuteContestId: lastMinuteContest.id,
      startingSoonContestId: startingSoonContest.id,
    });

    return {
      pastContest,
      upcomingContest,
      activeContest,
      oneHourContest,
      lastMinuteContest,
      startingSoonContest,
    };
  } catch (error) {
    console.error("Error seeding test contests:", error);
    throw error;
  }
}
