import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file, customPath) => {
  const fileStream = file.buffer;
  const fileExtension = file.originalname.split(".").pop();
  const key = customPath
    ? `${customPath}/${Date.now()}.${fileExtension}`
    : `photos/${file.userId}/${Date.now()}.${fileExtension}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    },
  });

  try {
    const result = await upload.done();
    console.log("S3 upload result:", result);
    return result.Location;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(`S3 Upload failed: ${error.message}`);
  }
};

export const deleteFromS3 = async (photoUrl) => {
  // Extract the key from the full S3 URL
  // The URL format is like: https://bucket-name.s3.region.amazonaws.com/photos/userId/filename.jpg
  const key = photoUrl.split(".com/")[1];

  console.log("Attempting to delete from S3:", {
    bucket: process.env.AWS_BUCKET_NAME,
    key: key,
  });

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const result = await s3Client.send(command);
    console.log("Successfully deleted from S3:", result);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(`S3 Delete failed: ${error.message}`);
  }
};
