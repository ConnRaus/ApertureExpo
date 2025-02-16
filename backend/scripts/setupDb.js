import sequelize from "../config/database.js";
import Contest from "../models/Contest.js";
import Photo from "../models/Photo.js";

// Set up associations
Contest.hasMany(Photo);
Photo.belongsTo(Contest);

async function setupDatabase() {
  try {
    // Sync database without forcing recreation
    await sequelize.sync({ alter: true });
    console.log("Database synced");

    // Check if we already have any contests
    const contestCount = await Contest.count();

    // Only create sample contest if none exist
    if (contestCount === 0) {
      const sampleContest = await Contest.create({
        title: "Things That Are Red",
        description:
          "Submit your best photos of red objects, scenes, or moments. Be creative!",
        bannerImageUrl:
          "https://4kwallpapers.com/images/wallpapers/apple-macro-water-3840x2160-15523.jpg",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "active",
      });

      const sampleContest2 = await Contest.create({
        title: "Things That Are Blue",
        description:
          "Submit your best photos of blue objects, scenes, or moments. Be creative!",
        bannerImageUrl:
          "https://www.hdwallpapers.net/previews/cloudy-blue-sky-1048.jpg",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: "active",
      });

      console.log(
        "Sample contests created:",
        sampleContest.toJSON(),
        sampleContest2.toJSON()
      );
    } else {
      console.log("Existing contests found, skipping sample contest creation");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
