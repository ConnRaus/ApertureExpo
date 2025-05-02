import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { URL } from "url"; // Import URL parser

dotenv.config(); // Load .env file for local development

const env = process.env.NODE_ENV || "development";
let sequelize;

// Production environment (like Render) typically uses DATABASE_URL
if (process.env.DATABASE_URL && env === "production") {
  const dbUrl = new URL(process.env.DATABASE_URL);

  sequelize = new Sequelize(
    dbUrl.pathname.slice(1), // database name (remove leading '/')
    dbUrl.username, // username
    dbUrl.password, // password
    {
      host: dbUrl.hostname, // host
      port: dbUrl.port, // port
      dialect: "postgres",
      protocol: "postgres", // Keep protocol info if needed, though dialect implies it
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Supabase/some cloud providers
        },
      },
      logging: false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  // Fallback for development (using individual vars likely from .env or docker-compose)
  // or if DATABASE_URL isn't set in production for some reason
  const dbConfig = {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST || "localhost", // Default host if not set
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Add SSL options if connecting to cloud DB locally without DATABASE_URL
    ...(process.env.POSTGRES_HOST &&
      process.env.POSTGRES_HOST !== "localhost" &&
      process.env.POSTGRES_HOST !== "db" && {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }),
  };
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

export default sequelize;
// Remove the named export for config as it's no longer used directly for instantiation
// export { config };
