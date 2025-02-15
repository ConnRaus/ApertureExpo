import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file, userId) => {
  const fileStream = file.buffer;
  const fileExtension = file.originalname.split(".").pop();
  const key = `photos/${userId}/${Date.now()}.${fileExtension}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    const result = await s3.upload(uploadParams).promise();
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

  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    const result = await s3.deleteObject(deleteParams).promise();
    console.log("Successfully deleted from S3:", result);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(`S3 Delete failed: ${error.message}`);
  }
};
