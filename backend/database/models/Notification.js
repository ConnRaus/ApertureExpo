import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_id",
    },
    type: {
      type: DataTypes.ENUM(
        "contest_ended",
        "forum_reply",
        "contest_winner",
        "general"
      ),
      allowNull: false,
      defaultValue: "general",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    contestId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "contest_id",
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "thread_id",
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "post_id",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  }
);

export default Notification;
