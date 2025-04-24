import models from "../models/index.js";
import { randomUUID } from "node:crypto";

const { Contest, sequelize } = models;

export async function seedTestContests() {
  try {
    console.log("Beginning to create test contests...");

    // Create basic contests (from defaultData.js)
    console.log("Creating basic contests (Red and Blue)...");

    // Red contest
    const contest1StartDate = new Date();
    const contest1EndDate = new Date(contest1StartDate);
    contest1EndDate.setDate(contest1EndDate.getDate() + 14); // 2 weeks after start
    const contest1VotingStartDate = new Date(contest1EndDate);
    const contest1VotingEndDate = new Date(contest1VotingStartDate);
    contest1VotingEndDate.setDate(contest1VotingEndDate.getDate() + 7); // 1 week after submission ends

    const redContest = await Contest.create({
      id: randomUUID(),
      title: "Things That Are Red",
      description:
        "Submit your best photographs featuring the color red as the primary subject or dominant color in the composition.",
      bannerImageUrl:
        "https://images.pexels.com/photos/3652898/pexels-photo-3652898.jpeg",
      startDate: contest1StartDate,
      endDate: contest1EndDate,
      votingStartDate: contest1VotingStartDate,
      votingEndDate: contest1VotingEndDate,
      maxPhotosPerUser: 3,
      status: "open",
    });

    // Blue contest
    const contest2StartDate = new Date();
    contest2StartDate.setDate(contest2StartDate.getDate() + 21); // 3 weeks from now
    const contest2EndDate = new Date(contest2StartDate);
    contest2EndDate.setDate(contest2EndDate.getDate() + 14); // 2 weeks after start
    const contest2VotingStartDate = new Date(contest2EndDate);
    const contest2VotingEndDate = new Date(contest2VotingStartDate);
    contest2VotingEndDate.setDate(contest2VotingEndDate.getDate() + 7); // 1 week after submission ends

    const blueContest = await Contest.create({
      id: randomUUID(),
      title: "Things That Are Blue",
      description:
        "Submit your best photographs featuring the color blue as the primary subject or dominant color in the composition.",
      bannerImageUrl:
        "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1386&ixlib=rb-4.0.3",
      startDate: contest2StartDate,
      endDate: contest2EndDate,
      votingStartDate: contest2VotingStartDate,
      votingEndDate: contest2VotingEndDate,
      maxPhotosPerUser: 2,
      status: "upcoming",
    });

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
      maxPhotosPerUser: 5,
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
      maxPhotosPerUser: 4,
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
      maxPhotosPerUser: 2,
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
      maxPhotosPerUser: 1,
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
      maxPhotosPerUser: 3,
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
      votingEndDate: new Date(Date.now() + 60 * 60 * 1000 + 1 * 60 * 1000), // Changed: only 1 minute after voting starts
      maxPhotosPerUser: 5,
      status: "upcoming",
    });

    console.log("Test contests created with IDs:", {
      redContestId: redContest.id,
      blueContestId: blueContest.id,
      pastContestId: pastContest.id,
      upcomingContestId: upcomingContest.id,
      activeContestId: activeContest.id,
      oneHourContestId: oneHourContest.id,
      lastMinuteContestId: lastMinuteContest.id,
      startingSoonContestId: startingSoonContest.id,
    });

    return {
      redContest,
      blueContest,
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
