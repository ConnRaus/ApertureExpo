import models from "../models/index.js";
const { Contest } = models;

export async function seedDefaultData() {
  try {
    // Check if any contests exist
    const contestCount = await Contest.count();

    if (contestCount === 0) {
      // Create sample contests if none exist
      const contest1StartDate = new Date();
      const contest1EndDate = new Date(contest1StartDate);
      contest1EndDate.setDate(contest1EndDate.getDate() + 14); // 2 weeks after start
      const contest1VotingStartDate = new Date(contest1EndDate);
      const contest1VotingEndDate = new Date(contest1VotingStartDate);
      contest1VotingEndDate.setDate(contest1VotingEndDate.getDate() + 7); // 1 week after submission ends

      await Contest.create({
        title: "Things That Are Red",
        description:
          "Submit your best photographs featuring the color red as the primary subject or dominant color in the composition.",
        bannerImageUrl:
          "https://images.pexels.com/photos/3652898/pexels-photo-3652898.jpeg",
        startDate: contest1StartDate,
        endDate: contest1EndDate,
        votingStartDate: contest1VotingStartDate,
        votingEndDate: contest1VotingEndDate,
        status: "open",
      });

      const contest2StartDate = new Date();
      contest2StartDate.setDate(contest2StartDate.getDate() + 21); // 3 weeks from now
      const contest2EndDate = new Date(contest2StartDate);
      contest2EndDate.setDate(contest2EndDate.getDate() + 14); // 2 weeks after start
      const contest2VotingStartDate = new Date(contest2EndDate);
      const contest2VotingEndDate = new Date(contest2VotingStartDate);
      contest2VotingEndDate.setDate(contest2VotingEndDate.getDate() + 7); // 1 week after submission ends

      await Contest.create({
        title: "Things That Are Blue",
        description:
          "Submit your best photographs featuring the color blue as the primary subject or dominant color in the composition.",
        bannerImageUrl:
          "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1386&ixlib=rb-4.0.3",
        startDate: contest2StartDate,
        endDate: contest2EndDate,
        votingStartDate: contest2VotingStartDate,
        votingEndDate: contest2VotingEndDate,
        status: "upcoming",
      });

      console.log("Sample contests created successfully");
    } else {
      console.log("Skipping contest creation - contests already exist");
    }
  } catch (error) {
    console.error("Error creating sample contests:", error);
    throw error;
  }
}
