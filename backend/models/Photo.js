import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Photo = sequelize.define("Photo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  s3Url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ContestId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Contests",
      key: "id",
    },
  },
});

export default Photo;
