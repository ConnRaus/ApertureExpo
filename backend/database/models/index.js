import sequelize from "../config/config.js";
import Photo from "./Photo.js";
import User from "./User.js";
import Contest from "./Contest.js";
import PhotoContest from "./PhotoContest.js";
import ForumThreadInit from "./ForumThread.js";
import ForumPostInit from "./ForumPost.js";

// Initialize forum models with sequelize
const ForumThread = ForumThreadInit(sequelize);
const ForumPost = ForumPostInit(sequelize);

// Define associations

// Many-to-many relationship between Photo and Contest
Photo.belongsToMany(Contest, {
  through: PhotoContest,
  foreignKey: "photoId",
  otherKey: "contestId",
  as: "Contests",
});

Contest.belongsToMany(Photo, {
  through: PhotoContest,
  foreignKey: "contestId",
  otherKey: "photoId",
  as: "Photos",
});

// Keep the old one-to-many relationship for backwards compatibility
// This will be deprecated in the future
Contest.hasMany(Photo, {
  foreignKey: "ContestId",
  as: "LegacyPhotos",
  onDelete: "SET NULL",
});

Photo.belongsTo(Contest, {
  foreignKey: "ContestId",
  as: "Contest",
});

// Forum associations
ForumThread.belongsTo(User, {
  foreignKey: "userId",
  as: "author",
});

ForumThread.hasMany(ForumPost, {
  foreignKey: "threadId",
  as: "posts",
  onDelete: "CASCADE",
});

ForumPost.belongsTo(User, {
  foreignKey: "userId",
  as: "author",
});

ForumPost.belongsTo(ForumThread, {
  foreignKey: "threadId",
  as: "thread",
});

// Initialize models
const models = {
  Photo,
  User,
  Contest,
  PhotoContest,
  ForumThread,
  ForumPost,
  sequelize,
};

// Add any instance or class methods here if needed
Photo.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Add any computed properties or remove sensitive data here
  return values;
};

Contest.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Add any computed properties here
  return values;
};

ForumThread.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

ForumPost.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

export { sequelize };
export default models;
