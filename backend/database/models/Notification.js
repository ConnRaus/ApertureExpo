import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

// Dynamic import to avoid circular dependency
let PushNotificationService = null;
const getPushService = async () => {
  if (!PushNotificationService) {
    const module = await import("../../services/pushNotificationService.js");
    PushNotificationService = module.default;
  }
  return PushNotificationService;
};

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
        "general",
        "photo_comment",
        "comment_reply"
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
    photoId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "photo_id",
    },
    commentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "comment_id",
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
    hooks: {
      afterCreate: async (notification) => {
        try {
          const PushService = await getPushService();

          // Automatically send push notification when a notification is created
          await PushService.sendNotification(notification.userId, {
            title: notification.title,
            body: notification.message,
            link: notification.link || "/",
            tag: `${notification.type}-${notification.id}`,
          });

          console.log(
            `[Notification] Auto-sent push notification for notification ${notification.id}`
          );
        } catch (error) {
          // Don't fail the notification creation if push fails
          console.error(
            "[Notification] Failed to send push notification:",
            error.message
          );
        }
      },
    },
  }
);

export default Notification;
