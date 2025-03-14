import { Model, DataTypes } from "sequelize";

const ForumPost = (sequelize) => {
  class ForumPost extends Model {
    static associate(models) {
      // Define associations here
      ForumPost.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
      });
      ForumPost.belongsTo(models.ForumThread, {
        foreignKey: "threadId",
        as: "thread",
      });
    }
  }

  ForumPost.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      threadId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ForumPost",
      tableName: "forum_posts",
      timestamps: true,
    }
  );

  return ForumPost;
};

export default ForumPost;
