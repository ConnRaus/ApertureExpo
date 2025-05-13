import models from "../models/index.js";
import { randomUUID } from "node:crypto";

const { Contest, Photo, PhotoContest, Vote, User } = models;

// Create test users if they don't exist
async function ensureTestUsers() {
  console.log("Ensuring test users exist...");

  const testUsers = [
    {
      id: "test-user-1",
      nickname: "TestUser1",
      bio: "I'm a test user who loves photography.",
    },
    {
      id: "test-user-2",
      nickname: "TestUser2",
      bio: "Photography enthusiast and vintage camera collector.",
    },
    {
      id: "test-user-3",
      nickname: "TestUser3",
      bio: "Professional photographer specializing in street photography.",
    },
  ];

  for (const user of testUsers) {
    await User.upsert(user);
  }

  console.log("Test users created/updated successfully");
  return testUsers.map((user) => user.id);
}

// Seed test photos for a contest
async function seedPhotosForContest(contest, userIds) {
  try {
    console.log(`Seeding photos for ${contest.title}...`);

    // Use fallback user IDs if none provided
    const users = userIds || ["test-user-1", "test-user-2", "test-user-3"];

    // Vintage photos for the past contest
    if (contest.title === "Vintage Photography") {
      // First, create the photos
      const vintagePhotos = [
        {
          id: randomUUID(),
          userId: users[0],
          title: "Old Film Camera",
          description: "A vintage Leica camera from the 1950s",
          s3Url:
            "https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg",
          thumbnailUrl:
            "https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=400",
          metadata: { width: 3456, height: 5184, mimeType: "image/jpeg" },
          imageHash: "vintage-1",
        },
        {
          id: randomUUID(),
          userId: users[1],
          title: "Typewriter",
          description: "Classic typewriter on wooden desk",
          s3Url:
            "https://images.pexels.com/photos/1809340/pexels-photo-1809340.jpeg",
          thumbnailUrl:
            "https://images.pexels.com/photos/1809340/pexels-photo-1809340.jpeg?auto=compress&cs=tinysrgb&w=400",
          metadata: { width: 4016, height: 6016, mimeType: "image/jpeg" },
          imageHash: "vintage-2",
        },
        {
          id: randomUUID(),
          userId: users[0],
          title: "Vinyl Records",
          description: "Collection of vintage vinyl records",
          s3Url:
            "https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg",
          thumbnailUrl:
            "https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=400",
          metadata: { width: 5472, height: 3648, mimeType: "image/jpeg" },
          imageHash: "vintage-3",
        },
        {
          id: randomUUID(),
          userId: users[2],
          title: "Classic Car",
          description: "Vintage automobile from the 1960s",
          s3Url:
            "https://static01.nyt.com/images/2022/11/23/business/23wheels-concours-top/merlin_214812261_9deba3ce-a3d3-4b44-b652-e16406fc4988-videoSixteenByNineJumbo1600.jpg",
          thumbnailUrl:
            "https://static01.nyt.com/images/2022/11/23/business/23wheels-concours-top/merlin_214812261_9deba3ce-a3d3-4b44-b652-e16406fc4988-videoSixteenByNineJumbo1600.jpg",
          metadata: { width: 4608, height: 3072, mimeType: "image/jpeg" },
          imageHash: "vintage-4",
        },
        {
          id: randomUUID(),
          userId: users[1],
          title: "Retro Radio",
          description: "Old-fashioned radio from the 1940s",
          s3Url:
            "https://images.thdstatic.com/productImages/b4f7e688-352a-41a7-8b04-2859351c6c15/svn/brown-lukyamzn-portable-audio-video-ph03027b013-64_600.jpg",
          thumbnailUrl:
            "https://images.thdstatic.com/productImages/b4f7e688-352a-41a7-8b04-2859351c6c15/svn/brown-lukyamzn-portable-audio-video-ph03027b013-64_600.jpg",
          metadata: { width: 4000, height: 6000, mimeType: "image/jpeg" },
          imageHash: "vintage-5",
        },
      ];

      // Create photos one by one to avoid foreign key issues
      const createdPhotos = [];
      for (const photo of vintagePhotos) {
        const createdPhoto = await Photo.create(photo);
        createdPhotos.push(createdPhoto);

        // Create the PhotoContest association
        await PhotoContest.create({
          id: randomUUID(),
          photoId: createdPhoto.id,
          contestId: contest.id,
          submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        });
      }

      // Add votes to determine winners
      const votes = [
        // First photo gets most votes (1st place)
        {
          id: randomUUID(),
          userId: users[1],
          photoId: createdPhotos[0].id,
          contestId: contest.id,
          value: 5,
          votedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          id: randomUUID(),
          userId: users[2],
          photoId: createdPhotos[0].id,
          contestId: contest.id,
          value: 5,
          votedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },

        // Second photo gets second most votes (2nd place)
        {
          id: randomUUID(),
          userId: users[0],
          photoId: createdPhotos[1].id,
          contestId: contest.id,
          value: 4,
          votedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          id: randomUUID(),
          userId: users[2],
          photoId: createdPhotos[1].id,
          contestId: contest.id,
          value: 4,
          votedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },

        // Third photo gets third most votes (3rd place)
        {
          id: randomUUID(),
          userId: users[1],
          photoId: createdPhotos[2].id,
          contestId: contest.id,
          value: 3,
          votedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },

        // Other photos get fewer votes
        {
          id: randomUUID(),
          userId: users[0],
          photoId: createdPhotos[3].id,
          contestId: contest.id,
          value: 2,
          votedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: randomUUID(),
          userId: users[0],
          photoId: createdPhotos[4].id,
          contestId: contest.id,
          value: 1,
          votedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      // Create votes
      await Vote.bulkCreate(votes);

      console.log(
        `Created ${createdPhotos.length} photos for ${contest.title}`
      );
      return createdPhotos;
    }

    return [];
  } catch (error) {
    console.error(`Error seeding photos for ${contest.title}:`, error);
    throw error;
  }
}

export async function seedTestContests() {
  try {
    console.log("Beginning to create test contests...");

    // Ensure test users exist before creating contests
    const userIds = await ensureTestUsers();

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
      endDate: new Date(Date.now() + 1 * 60 * 1000 + 1 * 60 * 1000), // Changed: 1 minute after start (2 minutes from now)
      votingStartDate: new Date(Date.now() + 1 * 60 * 1000 + 1 * 60 * 1000), // Same as endDate (2 minutes from now)
      votingEndDate: new Date(
        Date.now() + 1 * 60 * 1000 + 1 * 60 * 1000 + 1 * 60 * 1000
      ), // 1 minute after voting starts (3 minutes from now)
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

    // Add test photos to the past contest (Vintage Photography)
    console.log("Adding test photos to Vintage Photography contest...");
    await seedPhotosForContest(pastContest, userIds);

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

// Function to execute seeding (called from database/index.js)
const seedDatabase = async () => {
  console.log("Starting to seed test contests...");
  try {
    // Check which models are available
    console.log("Database models:", Object.keys(models));
    console.log("Contest model:", typeof Contest);

    await seedTestContests();
    console.log("Successfully seeded test contests");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
};

export default seedDatabase; // Default export for database index
