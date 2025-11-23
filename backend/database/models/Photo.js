import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class Photo extends Model {}

Photo.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 25],
      },
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 150],
      },
    },
    s3Url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrlOrEmpty(value) {
          // Allow empty string for hash-only deleted records
          if (value === "") return;
          // Use a simple URL validation regex
          const urlPattern = /^https?:\/\/.+/;
          if (!urlPattern.test(value)) {
            throw new Error("s3Url must be a valid URL or empty string");
          }
        },
      },
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrlOrEmpty(value) {
          // Allow empty string for hash-only deleted records
          if (value === "") return;
          // Use a simple URL validation regex
          const urlPattern = /^https?:\/\/.+/;
          if (!urlPattern.test(value)) {
            throw new Error("thumbnailUrl must be a valid URL or empty string");
          }
        },
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    imageHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Perceptual hash of the image for duplicate detection",
    },
    ContestId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Contests",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Photo",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["ContestId"],
      },
      {
        fields: ["imageHash"],
      },
      {
        fields: ["userId", "imageHash"],
      },
    ],
  }
);

export default Photo;
