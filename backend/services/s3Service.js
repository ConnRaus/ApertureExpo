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
  const { maxWidth, maxHeight, quality, isThumbnail = false } = options;

  // Get the image metadata to determine dimensions
  const metadata = await sharp(buffer).metadata();
  const { width: originalWidth, height: originalHeight } = metadata;

  // Calculate the aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  // Determine new dimensions while maintaining aspect ratio
  let newWidth, newHeight;

  if (aspectRatio > 1) {
    // Image is wider than tall (landscape or panorama)
    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(maxWidth / aspectRatio);
    } else {
      newWidth = originalWidth;
      newHeight = originalHeight;
    }
  } else {
    // Image is taller than wide (portrait)
    if (originalHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(maxHeight * aspectRatio);
    } else {
      newWidth = originalWidth;
      newHeight = originalHeight;
    }
  }

  // Only resize if the image is larger than our target dimensions
  const shouldResize = originalWidth > newWidth || originalHeight > newHeight;

  let processedImage = sharp(buffer);

  if (shouldResize) {
    processedImage = processedImage.resize(newWidth, newHeight, {
      fit: "inside",
      withoutEnlargement: true,
      // Use better kernel for thumbnails to maintain sharpness
      kernel: isThumbnail ? "lanczos3" : "cubic",
    });
  }

  const processedBuffer = await processedImage
    .jpeg({
      quality,
      mozjpeg: true,
      // Force better chroma subsampling for thumbnails
      chromaSubsampling: isThumbnail ? "4:4:4" : "4:2:0",
    })
    .toBuffer();

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
    // Process main image (max 4K resolution, 85% quality)
    const mainBuffer = await processAndUploadImage(fileStream, {
      maxWidth: 3840,
      maxHeight: 2160,
      quality: 85,
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
      return result.Location;
    }

    // Process thumbnail (max 600px on longest side, 90% quality)
    const thumbnailBuffer = await processAndUploadImage(fileStream, {
      maxWidth: 600,
      maxHeight: 600,
      quality: 80,
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
