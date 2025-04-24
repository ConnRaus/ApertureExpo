import models from "../models/index.js";
import { randomUUID } from "node:crypto";

const { Contest, sequelize } = models;

export async function seedTestContests() {
  try {
    console.log("Beginning to create test contests...");

    // Create past contest
    console.log("Creating past contest: Vintage Photography");
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
      maxPhotosPerUser: 10, // Limit for past contest
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
      maxPhotosPerUser: 3, // Limit for upcoming contest
      status: "upcoming",
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
      maxPhotosPerUser: 5, // Limit for active contest
      status: "open",
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
      maxPhotosPerUser: 1, // Limit for 1-hour challenge
      status: "open",
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
      maxPhotosPerUser: 2, // Limit for last minute contest
      status: "open",
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
      maxPhotosPerUser: null, // No limit for starting soon contest
      status: "upcoming",
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

// Check if this module is being run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Starting to seed test contests...");
  console.log("Database models:", Object.keys(models));
  console.log("Contest model:", typeof Contest);
  seedTestContests()
    .then((contests) => {
      console.log("Successfully seeded test contests");
      console.log(
        "Created contests:",
        Object.keys(contests).map((key) => contests[key].title)
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to seed test contests:", err);
      process.exit(1);
    });
}
