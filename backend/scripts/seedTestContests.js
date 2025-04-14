import { seedTestContests } from "../database/seeders/testContests.js";
import sequelize from "../database/config/config.js";

async function runSeeder() {
  try {
    console.log("Starting to seed test contests...");

    // Sync database models
    await sequelize.sync();

    // Run the test contest seeder
    const result = await seedTestContests();

    console.log("Test contests seeded successfully!");
    console.log("Past contest ID:", result.pastContestId);
    console.log("Upcoming contest ID:", result.upcomingContest.id);
    console.log("Short (12h) contest ID:", result.shortContest.id);
    console.log("Very short (1h) contest ID:", result.veryShortContest.id);
    console.log("Expiring (1m) contest ID:", result.expiringContest.id);
    console.log(
      "Starting soon (1m) contest ID:",
      result.startingSoonContest.id
    );

    process.exit(0);
  } catch (error) {
    console.error("Error seeding test contests:", error);
    process.exit(1);
  }
}

runSeeder();
