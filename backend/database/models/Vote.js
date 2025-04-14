import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class Vote extends Model {}

Vote.init(
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
    photoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Photos",
        key: "id",
      },
    },
    contestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Contests",
        key: "id",
      },
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 5,
      },
      comment:
        "Vote value (1-5): 1 for a simple vote, or 1-5 for a star rating system",
    },
    votedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Vote",
    tableName: "votes",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["photoId"],
      },
      {
        fields: ["contestId"],
      },
      {
        fields: ["userId", "photoId", "contestId"],
        unique: true,
        name: "votes_user_photo_contest_unique",
      },
    ],
  }
);

export default Vote;
