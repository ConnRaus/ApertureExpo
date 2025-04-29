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
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 500],
      },
    },
    s3Url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
        notEmpty: true,
      },
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
        notEmpty: true,
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
