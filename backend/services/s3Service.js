import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";
import sharp from "sharp";
import exifReader from "exif-reader";
import { Readable } from "stream";

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
  basePath,
  options = { generateThumbnail: true }
) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const timestamp = Date.now().toString();
  let mainBuffer;
  let fileStream;
  let metadata = null;

  try {
    // Initialize fileStream and mainBuffer
    if (file.buffer) {
      mainBuffer = file.buffer;
      fileStream = Readable.from(file.buffer);
    } else {
      throw new Error("File buffer is required");
    }

    // Extract metadata if possible
    try {
      const imageMetadata = await sharp(mainBuffer).metadata();

      // If image has EXIF data, process it with exifReader
      if (imageMetadata.exif) {
        try {
          metadata = exifReader(imageMetadata.exif);
          // Add other metadata properties we want to keep
          metadata.format = imageMetadata.format;
          metadata.width = imageMetadata.width;
          metadata.height = imageMetadata.height;
          metadata.space = imageMetadata.space;
          metadata.channels = imageMetadata.channels;
          metadata.depth = imageMetadata.depth;
          metadata.density = imageMetadata.density;
          metadata.hasAlpha = imageMetadata.hasAlpha;
          metadata.isProgressive = imageMetadata.isProgressive;
        } catch (exifError) {
          console.log("Error parsing EXIF data:", exifError);
          // Provide basic metadata even if EXIF parsing fails
          metadata = {
            format: imageMetadata.format,
            width: imageMetadata.width,
            height: imageMetadata.height,
            space: imageMetadata.space,
            channels: imageMetadata.channels,
            depth: imageMetadata.depth,
            density: imageMetadata.density,
            hasAlpha: imageMetadata.hasAlpha,
            isProgressive: imageMetadata.isProgressive,
          };
        }
      } else {
        // No EXIF data, but we can still get basic metadata
        metadata = {
          format: imageMetadata.format,
          width: imageMetadata.width,
          height: imageMetadata.height,
          space: imageMetadata.space,
          channels: imageMetadata.channels,
          depth: imageMetadata.depth,
          density: imageMetadata.density,
          hasAlpha: imageMetadata.hasAlpha,
          isProgressive: imageMetadata.isProgressive,
        };
      }
    } catch (metadataError) {
      console.log("Error getting image metadata:", metadataError);
      // Continue without metadata if extraction fails
    }

    const fileExtension = file.originalname
      ? file.originalname.split(".").pop().toLowerCase()
      : "jpg";

    // Process main image (max 4K resolution, 85% quality, max 2MB)
    const processedMainBuffer = await processAndUploadImage(mainBuffer, {
      maxWidth: 3840,
      maxHeight: 2160,
      quality: 85,
      maxSizeInMB: 2,
    });

    // Upload main image
    const mainKey = `${basePath}/${timestamp}.${fileExtension}`;
    const mainUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: mainKey,
        Body: processedMainBuffer,
        ContentType: "image/jpeg",
      },
    });

    if (!options.generateThumbnail) {
      const result = await mainUpload.done();
      // Construct the URL manually since result.Location may not be available
      const mainUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${mainKey}`;
      return { mainUrl, thumbnailUrl: null, metadata };
    }

    // Process thumbnail (max 600px on longest side, 80% quality, max 100KB)
    const thumbnailBuffer = await processAndUploadImage(mainBuffer, {
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
      metadata,
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
