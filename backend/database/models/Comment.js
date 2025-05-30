import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class Comment extends Model {}

Comment.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 150], // Max 150 characters for comments
      },
    },
    parentCommentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Comments",
        key: "id",
      },
      comment: "For threaded replies to other comments",
    },
  },
  {
    sequelize,
    modelName: "Comment",
    timestamps: true,
    indexes: [
      {
        fields: ["photoId"],
      },
      {
        fields: ["userId"],
      },
      {
        fields: ["parentCommentId"],
      },
      {
        fields: ["photoId", "createdAt"],
      },
    ],
  }
);

export default Comment;
