import models, { sequelize } from "./models/index.js";

export async function initializeDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log("Database models synchronized.");

    console.log("Database initialization completed.");

    return { models, sequelize };
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export { models, sequelize };
