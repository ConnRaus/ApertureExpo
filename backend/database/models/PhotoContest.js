import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class PhotoContest extends Model {}

PhotoContest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "PhotoContest",
    tableName: "photo_contests",
    timestamps: true,
    indexes: [
      {
        fields: ["photoId"],
      },
      {
        fields: ["contestId"],
      },
      {
        fields: ["photoId", "contestId"],
        unique: true,
      },
    ],
  }
);

export default PhotoContest;
