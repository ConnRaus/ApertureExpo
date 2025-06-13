import { sequelize } from "../database/models/index.js";
import {
  up,
  down,
} from "../database/migrations/001-add-photo-support-to-forum.js";

const runMigration = async () => {
  try {
    console.log("🚀 Starting database migration...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Run the migration
    await up(sequelize.getQueryInterface());

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

const rollbackMigration = async () => {
  try {
    console.log("🔄 Starting migration rollback...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Run the rollback
    await down(sequelize.getQueryInterface());

    console.log("🎉 Rollback completed successfully!");
  } catch (error) {
    console.error("💥 Rollback failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Check command line argument
const command = process.argv[2];

if (command === "up") {
  runMigration();
} else if (command === "down") {
  rollbackMigration();
} else {
  console.log("Usage:");
  console.log("  node scripts/runMigration.js up    - Run migration");
  console.log("  node scripts/runMigration.js down  - Rollback migration");
  process.exit(1);
}
