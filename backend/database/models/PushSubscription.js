import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

const PushSubscription = sequelize.define(
  "PushSubscription",
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
    // The full subscription object from the browser's PushManager
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Keys for encryption (p256dh and auth)
    p256dh: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    auth: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // User agent info for debugging/management
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "user_agent",
    },
    // Device identifier to prevent duplicate subscriptions per device
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "device_id",
    },
    // Whether this subscription is active
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Last time a push was successfully sent to this subscription
    lastPushAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_push_at",
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
    tableName: "push_subscriptions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        unique: true,
        fields: ["endpoint"],
      },
    ],
  }
);

export default PushSubscription;

