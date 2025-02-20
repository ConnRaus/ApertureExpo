import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class Contest extends Model {}

Contest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
        len: [0, 1000],
      },
    },
    bannerImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString(),
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStart(value) {
          if (value <= this.startDate) {
            throw new Error("End date must be after start date");
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "completed"),
      defaultValue: "draft",
      validate: {
        isIn: [["draft", "active", "completed"]],
      },
    },
  },
  {
    sequelize,
    modelName: "Contest",
    timestamps: true,
    indexes: [
      {
        fields: ["status"],
      },
      {
        fields: ["startDate", "endDate"],
      },
    ],
  }
);

export default Contest;
