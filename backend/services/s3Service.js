import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const processAndUploadImage = async (buffer, options) => {
  const {
    maxWidth,
    maxHeight,
    quality,
    isThumbnail = false,
    maxSizeInMB = 2,
  } = options;

  // Get the image metadata to determine dimensions
  const metadata = await sharp(buffer).metadata();
  const { width: originalWidth, height: originalHeight } = metadata;

  // Calculate the aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  // Calculate scaling factors for both dimensions
  const widthScale = maxWidth / originalWidth;
  const heightScale = maxHeight / originalHeight;

  // Use the larger scaling factor to ensure the smaller dimension fits within bounds
  const scale = Math.max(widthScale, heightScale);

  // Only scale down, never up
  const finalScale = Math.min(scale, 1);

  // Calculate new dimensions
  const newWidth = Math.round(originalWidth * finalScale);
  const newHeight = Math.round(originalHeight * finalScale);

  // Only resize if the image needs to be scaled down
  const shouldResize = finalScale < 1;

  let processedImage = sharp(buffer);

  if (shouldResize) {
    processedImage = processedImage.resize(newWidth, newHeight, {
      fit: "inside",
      withoutEnlargement: true,
      // Use better kernel for thumbnails to maintain sharpness
      kernel: isThumbnail ? "lanczos3" : "cubic",
    });
  }

  // Progressive quality reduction to meet size target
  let currentQuality = quality;
  let processedBuffer;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  do {
    processedBuffer = await processedImage
      .jpeg({
        quality: currentQuality,
        mozjpeg: true,
        // Force better chroma subsampling for thumbnails
        chromaSubsampling: isThumbnail ? "4:4:4" : "4:2:0",
      })
      .toBuffer();

    // Reduce quality by 5% each iteration if we're over the size limit
    if (processedBuffer.length > maxSizeInBytes) {
      currentQuality = Math.max(currentQuality - 5, 30); // Don't go below 30% quality
    }
  } while (processedBuffer.length > maxSizeInBytes && currentQuality > 30);

  // If we still exceed the size limit at minimum quality, use more aggressive compression
  if (processedBuffer.length > maxSizeInBytes) {
    processedBuffer = await processedImage
      .jpeg({
        quality: 30,
        mozjpeg: true,
        chromaSubsampling: "4:2:0",
        force: true,
      })
      .toBuffer();
  }

  return processedBuffer;
};

export const uploadToS3 = async (
  file,
  customPath,
  options = { generateThumbnail: true }
) => {
  const fileStream = file.buffer;
  const fileExtension = "jpg";
  const timestamp = Date.now();
  const basePath = customPath || `photos/${file.userId}`;

  try {
    // Process main image (max 4K resolution, 85% quality, max 2MB)
    const mainBuffer = await processAndUploadImage(fileStream, {
      maxWidth: 3840,
      maxHeight: 2160,
      quality: 85,
      maxSizeInMB: 2,
      isThumbnail: false,
    });

    // Upload main image
    const mainKey = `${basePath}/${timestamp}.${fileExtension}`;
    const mainUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: mainKey,
        Body: mainBuffer,
        ContentType: "image/jpeg",
      },
    });

    if (!options.generateThumbnail) {
      const result = await mainUpload.done();
      console.log("Banner upload result:", result);
      // Fix: Construct the URL manually since result.Location may not be available
      const mainUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${mainKey}`;
      console.log("Constructed banner URL:", mainUrl);
      return { mainUrl, thumbnailUrl: null };
    }

    // Process thumbnail (max 600px on longest side, 80% quality, max 100KB)
    const thumbnailBuffer = await processAndUploadImage(fileStream, {
      maxWidth: 600,
      maxHeight: 600,
      quality: 80,
      maxSizeInMB: 0.1,
      isThumbnail: true,
    });

    // Upload thumbnail
    const thumbnailKey = `${basePath}/thumbnails/${timestamp}.${fileExtension}`;
    const thumbnailUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/jpeg",
      },
    });

    // Wait for both uploads to complete
    const [mainResult, thumbnailResult] = await Promise.all([
      mainUpload.done(),
      thumbnailUpload.done(),
    ]);

    return {
      mainUrl: mainResult.Location,
      thumbnailUrl: thumbnailResult.Location,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(`S3 Upload failed: ${error.message}`);
  }
};

export const deleteFromS3 = async (photoUrl) => {
  // Extract the key from the full S3 URL
  const key = photoUrl.split(".com/")[1];
  const thumbnailKey = key.replace(/^photos\//, "photos/thumbnails/");

  try {
    const deleteCommands = [
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }),
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: thumbnailKey,
      }),
    ];

    await Promise.all(deleteCommands.map((command) => s3Client.send(command)));
    console.log("Successfully deleted images from S3");
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(`S3 Delete failed: ${error.message}`);
  }
};
