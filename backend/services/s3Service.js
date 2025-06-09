import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
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

// Function to recursively sanitize metadata by removing null characters
const sanitizeMetadata = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Remove null characters and trim whitespace
    return obj.replace(/\u0000/g, "").trim();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMetadata(item));
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeMetadata(key);
      const sanitizedValue = sanitizeMetadata(value);
      // Only include the field if it has meaningful content after sanitization
      if (typeof sanitizedValue === "string" && sanitizedValue === "") {
        // Skip empty strings
        continue;
      }
      if (sanitizedKey && sanitizedKey !== "") {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    }
    return sanitized;
  }

  return obj;
};

// Function to filter metadata to only keep essential camera information
const filterEssentialMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    return metadata;
  }

  const filtered = {};

  // Keep basic image properties
  if (metadata.width) filtered.width = metadata.width;
  if (metadata.height) filtered.height = metadata.height;
  if (metadata.format) filtered.format = metadata.format;
  if (metadata.space) filtered.space = metadata.space;
  if (metadata.channels) filtered.channels = metadata.channels;
  if (metadata.depth) filtered.depth = metadata.depth;
  if (metadata.density) filtered.density = metadata.density;
  if (metadata.hasAlpha !== undefined) filtered.hasAlpha = metadata.hasAlpha;
  if (metadata.isProgressive !== undefined)
    filtered.isProgressive = metadata.isProgressive;
  if (metadata.bigEndian !== undefined) filtered.bigEndian = metadata.bigEndian;

  // Keep essential Image properties (camera make/model, basic settings)
  if (metadata.Image) {
    const imageProps = {};
    const keepImageProps = [
      "Make",
      "Model",
      "DateTime",
      "Software",
      "Orientation",
      "XResolution",
      "YResolution",
      "ResolutionUnit",
      "YCbCrPositioning",
    ];

    keepImageProps.forEach((prop) => {
      if (metadata.Image[prop] !== undefined && metadata.Image[prop] !== null) {
        imageProps[prop] = metadata.Image[prop];
      }
    });

    if (Object.keys(imageProps).length > 0) {
      filtered.Image = imageProps;
    }
  }

  // Keep essential Photo/EXIF properties (camera settings)
  if (metadata.Photo) {
    const photoProps = {};
    const keepPhotoProps = [
      "FNumber",
      "ExposureTime",
      "ISOSpeedRatings",
      "FocalLength",
      "FocalLengthIn35mmFilm",
      "LensModel",
      "LensMake",
      "LensSpecification",
      "Flash",
      "ExposureMode",
      "WhiteBalance",
      "ExposureProgram",
      "MeteringMode",
      "SensitivityType",
      "ExposureBiasValue",
      "MaxApertureValue",
      "SubjectDistanceRange",
      "SceneCaptureType",
      "GainControl",
      "Contrast",
      "Saturation",
      "Sharpness",
      "DigitalZoomRatio",
      "ColorSpace",
      "PixelXDimension",
      "PixelYDimension",
      "DateTimeOriginal",
      "DateTimeDigitized",
      "OffsetTime",
      "OffsetTimeOriginal",
      "OffsetTimeDigitized",
      "SubSecTime",
      "SubSecTimeOriginal",
      "SubSecTimeDigitized",
      "CustomRendered",
      "SensingMethod",
      "FileSource",
      "SceneType",
      "CompositeImage",
      "BrightnessValue",
      "ShutterSpeedValue",
      "ApertureValue",
      "LightSource",
      "CompressedBitsPerPixel",
    ];

    keepPhotoProps.forEach((prop) => {
      if (metadata.Photo[prop] !== undefined && metadata.Photo[prop] !== null) {
        // Skip Buffer objects and other complex data
        if (
          typeof metadata.Photo[prop] === "object" &&
          metadata.Photo[prop].type === "Buffer"
        ) {
          return;
        }
        photoProps[prop] = metadata.Photo[prop];
      }
    });

    if (Object.keys(photoProps).length > 0) {
      filtered.Photo = photoProps;
    }
  }

  // Keep Interoperability info if present (small and useful)
  if (metadata.Iop) {
    const iopProps = {};
    if (metadata.Iop.InteroperabilityIndex) {
      iopProps.InteroperabilityIndex = metadata.Iop.InteroperabilityIndex;
    }
    if (Object.keys(iopProps).length > 0) {
      filtered.Iop = iopProps;
    }
  }

  // Skip large/unnecessary data:
  // - GPSInfo (privacy concern and large)
  // - MakerNote (can be hundreds of KB)
  // - Thumbnail (unnecessary for our use)
  // - UserComment (often large buffer data)
  // - Any Buffer objects

  return filtered;
};

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

  // Strip all metadata to save space (we store metadata separately in database)
  processedImage = processedImage.withMetadata({});

  // Aggressive compression to guarantee size target - will reduce quality and dimensions as needed
  let currentQuality = quality;
  let currentWidth = newWidth;
  let currentHeight = newHeight;
  let processedBuffer;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  // Keep trying until we're under the size limit
  while (true) {
    processedBuffer = await sharp(buffer)
      .resize(currentWidth, currentHeight, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: isThumbnail ? "lanczos3" : "cubic",
      })
      .withMetadata({}) // Strip metadata
      .jpeg({
        quality: currentQuality,
        mozjpeg: true,
        chromaSubsampling: isThumbnail ? "4:4:4" : "4:2:0",
        force: true,
      })
      .toBuffer();

    // If we're under the size limit, we're done!
    if (processedBuffer.length <= maxSizeInBytes) {
      break;
    }

    // Try reducing quality first (faster than resizing)
    if (currentQuality > 1) {
      currentQuality = Math.max(currentQuality - 5, 1);
    } else {
      // Quality is at minimum, so reduce dimensions by 10%
      currentWidth = Math.round(currentWidth * 0.9);
      currentHeight = Math.round(currentHeight * 0.9);

      // Reset quality to a reasonable level when we reduce dimensions
      currentQuality = Math.max(quality - 20, 30);

      // Safety check: if image gets too small, break with what we have
      if (currentWidth < 50 || currentHeight < 50) {
        break;
      }
    }
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

    // Always use .jpg since we're converting everything to JPEG format
    const fileExtension = "jpg";

    // Process main image (max 4K resolution, 85% quality, max 1MB)
    const processedMainBuffer = await processAndUploadImage(mainBuffer, {
      maxWidth: 3840,
      maxHeight: 2160,
      quality: 85,
      maxSizeInMB: 1,
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
      return {
        mainUrl,
        thumbnailUrl: null,
        metadata: metadata
          ? sanitizeMetadata(filterEssentialMetadata(metadata))
          : null,
      };
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
      metadata: metadata
        ? sanitizeMetadata(filterEssentialMetadata(metadata))
        : null,
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

// New function to calculate image hash from an existing S3 URL
export const getHashFromS3 = async (s3Url) => {
  try {
    // Extract the key from the URL
    const key = s3Url.split(".com/")[1];

    if (!key) {
      throw new Error("Invalid S3 URL format");
    }

    // Get the object from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(getObjectCommand);

    // Convert the stream to a buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Use image-hash to calculate the hash (this part should be implemented where this function is used)
    return buffer;
  } catch (error) {
    console.error("Error getting image from S3:", error);
    throw new Error(`Failed to get image for hashing: ${error.message}`);
  }
};
