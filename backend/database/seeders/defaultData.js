import models from "../models/index.js";
const { Contest } = models;

export async function seedDefaultData() {
  try {
    // Check if we already have any contests
    const contestCount = await Contest.count();

    // Only create sample contests if none exist
    if (contestCount === 0) {
      await Contest.bulkCreate([
        {
          title: "Things That Are Red",
          description:
            "Submit your best photos of red objects, scenes, or moments. Be creative!",
          bannerImageUrl:
            "https://4kwallpapers.com/images/wallpapers/apple-macro-water-3840x2160-15523.jpg",
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: "active",
        },
        {
          title: "Things That Are Blue",
          description:
            "Submit your best photos of blue objects, scenes, or moments. Be creative!",
          bannerImageUrl:
            "https://www.hdwallpapers.net/previews/cloudy-blue-sky-1048.jpg",
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          status: "active",
        },
      ]);

      console.log("Sample contests created successfully");
    } else {
      console.log("Existing contests found, skipping sample contest creation");
    }
  } catch (error) {
    console.error("Error seeding default data:", error);
    throw error;
  }
}
