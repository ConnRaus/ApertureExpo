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

    process.exit(0);
  } catch (error) {
    console.error("Error seeding test contests:", error);
    process.exit(1);
  }
}

runSeeder();
