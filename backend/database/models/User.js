import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 25],
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 250],
      },
    },
    bannerImage: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrlOrEmpty(value) {
          if (value && value.length > 0 && !/^https?:\/\/.+/.test(value)) {
            throw new Error("Banner image must be a valid URL or empty");
          }
        },
      },
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: "User",
    timestamps: true,
    indexes: [
      {
        fields: ["nickname"],
      },
      {
        fields: ["level", "xp"],
      },
    ],
  }
);

export default User;
