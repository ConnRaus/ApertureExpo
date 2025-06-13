import { Model, DataTypes } from "sequelize";

const ForumThread = (sequelize) => {
  class ForumThread extends Model {
    static associate(models) {
      // Define associations here
      ForumThread.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
      });
      ForumThread.hasMany(models.ForumPost, {
        foreignKey: "threadId",
        as: "posts",
      });
      ForumThread.belongsTo(models.Photo, {
        foreignKey: "photoId",
        as: "photo",
      });
    }
  }

  ForumThread.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "General",
      },
      photoId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastActivityAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ForumThread",
      tableName: "forum_threads",
      timestamps: true,
    }
  );

  return ForumThread;
};

export default ForumThread;
