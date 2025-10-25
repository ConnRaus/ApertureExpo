import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class XPTransaction extends Model {}

XPTransaction.init(
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
      references: {
        model: "Users",
        key: "id",
      },
    },
    xpAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
      },
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    actionType: {
      type: DataTypes.ENUM(
        "SUBMIT_PHOTO",
        "VOTE",
        "PLACE_1ST",
        "PLACE_2ND",
        "PLACE_3RD",
        "TOP_10_PERCENT",
        "TOP_25_PERCENT",
        "PHOTO_DELETION"
      ),
      allowNull: false,
    },
    contestId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Contests",
        key: "id",
      },
    },
    photoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Photos",
        key: "id",
      },
    },
    awardedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "XPTransaction",
    tableName: "xp_transactions",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["awardedAt"],
      },
      {
        fields: ["userId", "awardedAt"],
      },
      {
        fields: ["actionType"],
      },
      {
        fields: ["contestId"],
      },
    ],
  }
);

export default XPTransaction;
