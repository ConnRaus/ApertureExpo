import express from "express";
import multer from "multer";
import {
  uploadToS3,
  deleteFromS3,
  getHashFromS3,
} from "../services/s3Service.js";
import Photo from "../database/models/Photo.js";
import Contest from "../database/models/Contest.js";
import PhotoContest from "../database/models/PhotoContest.js";
import { requireAuth } from "@clerk/express";
import { Op } from "sequelize";
import phash from "sharp-phash";
import sharp from "sharp";
import User from "../database/models/User.js";
import { getAuthFromRequest } from "../utils/auth.js";
import XPService from "../services/xpService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Custom error class for duplicate photos
class DuplicatePhotoError extends Error {
  constructor(existingPhotoId) {
    super("Duplicate photo detected");
    this.name = "DuplicatePhotoError";
    this.existingPhotoId = existingPhotoId;
    this.statusCode = 400;
  }
}

// Create a custom error class for similar photo submissions
class SimilarPhotoSubmissionError extends Error {
  constructor(similarPhotoId) {
    super("Similar photo already submitted to contest");
    this.name = "SimilarPhotoSubmissionError";
    this.similarPhotoId = similarPhotoId;
    this.statusCode = 400;
  }
}

// Helper function to safely generate a hash from a buffer
async function generateImageHashFromBuffer(buffer) {
  try {
    // Resize image to a smaller size before hashing to avoid memory issues with large panoramas
    // We only need the hash for duplicate detection, so 800px width is plenty
    const processedBuffer = await sharp(buffer)
      .resize(800, 600, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate hash directly from the buffer using sharp-phash
    const hash = await phash(processedBuffer);

    return hash;
  } catch (error) {
    throw new Error(`Failed to generate image hash: ${error.message}`);
  }
}

// Photo upload endpoint
router.post(
  "/upload",
  requireAuth(),
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get auth object properly
      const auth = getAuthFromRequest(req);

      // Check if user is authenticated
      if (!auth || !auth.userId) {
        console.error("Authentication failed - auth object:", auth);
        return res.status(401).json({ error: "Authentication required" });
      }

      const contestId = req.body.contestId;
      const userId = auth.userId;

      // Check submission limit if contestId is provided
      if (contestId) {
        const contest = await Contest.findByPk(contestId);
        if (!contest) {
          return res.status(404).json({ error: "Contest not found" });
        }

        if (contest.maxPhotosPerUser !== null) {
          const userSubmissionCount = await PhotoContest.count({
            where: { contestId: contestId },
            include: [
              {
                model: Photo,
                where: { userId: userId }, // Ensure the photo belongs to the user
              },
            ],
          });

          if (userSubmissionCount >= contest.maxPhotosPerUser) {
            return res.status(400).json({
              error: `Submission limit reached (${contest.maxPhotosPerUser} photos per user).`,
            });
          }
        }
      }

      // Run hash generation and S3 upload in parallel for better performance
      const [photoHash, s3Result] = await Promise.all([
        generateImageHashFromBuffer(req.file.buffer),
        uploadToS3(req.file, `photos/${userId}`),
      ]);

      // Check if this user has already uploaded this exact image
      const existingPhoto = await Photo.findOne({
        where: {
          userId: userId,
          imageHash: photoHash,
        },
      });

      if (existingPhoto) {
        throw new DuplicatePhotoError(existingPhoto.id);
      }

      const { mainUrl, thumbnailUrl, metadata } = s3Result;

      // Create the photo first without the contest association
      const photo = await Photo.create({
        userId: userId,
        title: req.body.title || "Untitled",
        description: req.body.description,
        s3Url: mainUrl,
        thumbnailUrl: thumbnailUrl,
        metadata: metadata || null,
        imageHash: photoHash, // Save the hash for future duplicate checks
      });

      // If a contest ID was provided, associate the photo with that contest using the join table
      let contestData = null;
      if (contestId) {
        const [photoContestEntry, contest] = await Promise.all([
          PhotoContest.create({
            photoId: photo.id,
            contestId: contestId,
          }),
          Contest.findByPk(contestId),
        ]);

        contestData = contest;
        console.log(
          `[DEBUG] Created PhotoContest entry:`,
          photoContestEntry.toJSON()
        );

        // Award XP for submitting a photo to a contest (don't await, let it happen async)
        XPService.awardSubmissionXP(userId, contestId, photo.id)
          .then((xpResult) => {
            if (xpResult.success) {
              console.log(
                `Awarded ${xpResult.xpAwarded} XP to user ${userId} for contest submission`
              );
              if (xpResult.leveledUp) {
                console.log(
                  `User ${userId} leveled up to level ${xpResult.newLevel}!`
                );
              }
            }
          })
          .catch((xpError) => {
            console.error("Error awarding submission XP:", xpError);
          });
      }

      // Return the photo with contest data attached (no need to refetch from DB)
      const responsePhoto = photo.toJSON();
      if (contestData) {
        responsePhoto.Contests = [contestData];
      }

      res.json({
        message: "Photo uploaded successfully",
        photo: responsePhoto,
      });
    } catch (error) {
      console.error("Upload error:", error);

      // Handle our custom duplicate photo error
      if (error instanceof DuplicatePhotoError) {
        return res.status(error.statusCode).json({
          error:
            "This appears to be a duplicate photo you've already uploaded.",
          detail:
            "To prevent storage waste, we don't allow uploading identical photos multiple times.",
          existingPhotoId: error.existingPhotoId,
        });
      }

      res.status(500).json({
        error: error.message || "Failed to upload photo",
        details: error.stack,
      });
    }
  }
);

// Get all photos for the authenticated user
router.get("/photos", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const includeContests = req.query.include === "contests";

    const include = [
      {
        model: User,
        as: "User",
        attributes: ["id", "nickname"],
      },
    ];

    if (includeContests) {
      include.push({
        model: Contest,
        as: "Contests",
        through: { attributes: [] },
      });
    }

    const photos = await Photo.findAll({
      where: { userId: auth.userId },
      attributes: [
        "id",
        "title",
        "description",
        "s3Url",
        "thumbnailUrl",
        "userId",
        "createdAt",
        "updatedAt",
        "metadata",
        "ContestId",
      ],
      include,
      order: [["createdAt", "DESC"]],
    });

    // If we need to include the legacy Contest relationship as well
    if (includeContests) {
      // Find photos with the legacy ContestId set
      const photosWithLegacyContests = await Photo.findAll({
        where: {
          userId: auth.userId,
          ContestId: { [Op.not]: null },
        },
        include: [
          {
            model: Contest,
            as: "Contest",
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Map of photo IDs to their index in the photos array
      const photoMap = new Map(photos.map((photo, index) => [photo.id, index]));

      // For each photo with a legacy contest, make sure that contest appears in the Contests array
      for (const photo of photosWithLegacyContests) {
        if (photo.Contest && photoMap.has(photo.id)) {
          const index = photoMap.get(photo.id);
          const photoJson = photos[index].toJSON();

          // Ensure the Contests array exists
          if (!photoJson.Contests) {
            photoJson.Contests = [];
            photos[index].dataValues.Contests = [];
          }

          // Check if this contest is already in the Contests array
          const contestExists = photos[index].dataValues.Contests.some(
            (c) => c.id === photo.Contest.id
          );

          if (!contestExists) {
            photos[index].dataValues.Contests.push(photo.Contest);
          }
        }
      }
    }

    res.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Update photo
router.put("/photos/:id", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const photo = await Photo.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this photo" });
    }

    await photo.update({
      title: req.body.title,
      description: req.body.description,
    });

    res.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// Delete photo
router.delete("/photos/:id", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const photo = await Photo.findByPk(req.params.id, {
      include: [
        {
          model: Contest,
          as: "Contests",
          through: { attributes: [] },
        },
      ],
    });

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this photo" });
    }

    // Calculate XP to deduct based on active contest submissions only
    // No penalty for deleting photos from completed/expired contests
    let xpToDeduct = 0;
    let activeContestCount = 0;

    // Check each contest's status to determine the correct XP deduction
    if (photo.Contests && photo.Contests.length > 0) {
      for (const contest of photo.Contests) {
        // Only deduct XP for active contests (open or voting)
        // No penalty for completed/upcoming contests - user already got placement XP
        if (contest.status === "open" || contest.status === "voting") {
          xpToDeduct += 75; // Full XP for active contest submissions
          activeContestCount++;
        }
      }
    }

    // Also check legacy contest association
    if (photo.ContestId) {
      const legacyContest = await Contest.findByPk(photo.ContestId);
      if (legacyContest) {
        if (
          legacyContest.status === "open" ||
          legacyContest.status === "voting"
        ) {
          xpToDeduct += 75;
          activeContestCount++;
        }
      }
    }

    // Deduct XP only if there are active contests
    if (xpToDeduct > 0) {
      try {
        await XPService.deductXP(
          auth.userId,
          xpToDeduct,
          `Photo deletion from ${activeContestCount} active contest${
            activeContestCount > 1 ? "s" : ""
          }`,
          "PHOTO_DELETION",
          null,
          photo.id
        );
        console.log(
          `Deducted ${xpToDeduct} XP from user ${auth.userId} for deleting photo from ${activeContestCount} active contest(s)`
        );
      } catch (xpError) {
        console.error("Error deducting XP for photo deletion:", xpError);
        // Don't fail the deletion if XP deduction fails
      }
    }

    await deleteFromS3(photo.s3Url);
    await photo.destroy();

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// Helper function to ensure a photo has a hash
const ensurePhotoHasHash = async (photo) => {
  // If the photo already has a hash, return it
  if (photo.imageHash) {
    return photo.imageHash;
  }

  try {
    // Get the image buffer from S3
    const imageBuffer = await getHashFromS3(photo.s3Url);

    // Generate the hash using our updated helper function (which now resizes before hashing)
    const photoHash = await generateImageHashFromBuffer(imageBuffer);

    // Update the photo record with the hash
    await photo.update({ imageHash: photoHash });

    return photoHash;
  } catch (error) {
    console.error(`Error generating hash for photo ${photo.id}:`, error);
    return null;
  }
};

// Submit existing photo to contest
router.post("/photos/:id/submit", requireAuth(), async (req, res) => {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const photo = await Photo.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== auth.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to submit this photo" });
    }

    // Ensure the photo has a hash before proceeding
    await ensurePhotoHasHash(photo);

    // Check if the contest exists
    const contest = await Contest.findByPk(req.body.contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const userId = auth.userId;

    // Check submission limit
    if (contest.maxPhotosPerUser !== null) {
      const userSubmissionCount = await PhotoContest.count({
        where: { contestId: contest.id },
        include: [
          {
            model: Photo,
            where: { userId: userId }, // Count photos submitted by this user to this contest
          },
        ],
      });

      if (userSubmissionCount >= contest.maxPhotosPerUser) {
        return res.status(400).json({
          error: `Submission limit reached (${contest.maxPhotosPerUser} photos per user).`,
        });
      }
    }

    // Check if this photo has already been submitted to this contest
    const existingSubmission = await PhotoContest.findOne({
      where: {
        photoId: photo.id,
        contestId: req.body.contestId,
      },
    });

    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: "Photo is already submitted to this contest" });
    }

    // Get the hash of this photo
    const photoHash = photo.imageHash;

    // Check if the user has already submitted a similar photo to this contest
    // This prevents users from making small edits and resubmitting essentially the same image
    if (photoHash) {
      const similarPhotoInContest = await PhotoContest.findOne({
        where: {
          contestId: req.body.contestId,
        },
        include: [
          {
            model: Photo,
            where: {
              userId: userId,
              imageHash: photoHash,
              id: { [Op.ne]: photo.id }, // Not the current photo
            },
          },
        ],
      });

      if (similarPhotoInContest) {
        throw new SimilarPhotoSubmissionError(
          similarPhotoInContest.Photo?.id || similarPhotoInContest.photoId
        );
      }
    }

    // Create a new entry in the PhotoContest join table
    const photoContestEntry = await PhotoContest.create({
      photoId: photo.id,
      contestId: req.body.contestId,
    });
    console.log(
      `[DEBUG] Created PhotoContest entry for existing photo:`,
      photoContestEntry.toJSON()
    );

    // Award XP for submitting an existing photo to a contest
    try {
      const xpResult = await XPService.awardSubmissionXP(
        userId,
        req.body.contestId,
        photo.id
      );
      if (xpResult.success) {
        console.log(
          `Awarded ${xpResult.xpAwarded} XP to user ${userId} for submitting existing photo to contest`
        );
        if (xpResult.leveledUp) {
          console.log(
            `User ${userId} leveled up to level ${xpResult.newLevel}!`
          );
        }
      }
    } catch (xpError) {
      console.error(
        "Error awarding submission XP for existing photo:",
        xpError
      );
      // Don't fail the submission if XP fails
    }

    // Fetch the updated photo with contests information
    const updatedPhoto = await Photo.findByPk(photo.id, {
      include: [
        {
          model: Contest,
          as: "Contests",
          through: { attributes: [] },
        },
      ],
    });

    res.json({
      message: "Photo submitted to contest successfully",
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Error submitting photo to contest:", error);

    if (error instanceof SimilarPhotoSubmissionError) {
      return res.status(error.statusCode).json({
        error:
          "You have already submitted a very similar photo to this contest.",
        detail:
          "To ensure fair judging, we don't allow submitting duplicate or nearly identical photos to the same contest.",
        similarPhotoId: error.similarPhotoId,
      });
    }

    res.status(500).json({ error: "Failed to submit photo to contest" });
  }
});

export default router;
