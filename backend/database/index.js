import models, { sequelize } from "./models/index.js";

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
}

export default initializeDatabase;

export { models, sequelize };
