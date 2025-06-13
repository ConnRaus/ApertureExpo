import sequelize from "../config/config.js";
import Photo from "./Photo.js";
import User from "./User.js";
import Contest from "./Contest.js";
import PhotoContest from "./PhotoContest.js";
import Vote from "./Vote.js";
import Comment from "./Comment.js";
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

// Add explicit associations for the PhotoContest model
PhotoContest.belongsTo(Photo, {
  foreignKey: "photoId",
});

PhotoContest.belongsTo(Contest, {
  foreignKey: "contestId",
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

// Add association between Photo and User
Photo.belongsTo(User, {
  foreignKey: "userId",
  as: "User",
});

// Vote associations
Photo.hasMany(Vote, {
  foreignKey: "photoId",
  as: "Votes",
  onDelete: "CASCADE",
});

Vote.belongsTo(Photo, {
  foreignKey: "photoId",
  as: "Photo",
});

Contest.hasMany(Vote, {
  foreignKey: "contestId",
  as: "Votes",
  onDelete: "CASCADE",
});

Vote.belongsTo(Contest, {
  foreignKey: "contestId",
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

// Add photo association for ForumThread
ForumThread.belongsTo(Photo, {
  foreignKey: "photoId",
  as: "photo",
});

ForumPost.belongsTo(User, {
  foreignKey: "userId",
  as: "author",
});

ForumPost.belongsTo(ForumThread, {
  foreignKey: "threadId",
  as: "thread",
});

// Add photo association for ForumPost
ForumPost.belongsTo(Photo, {
  foreignKey: "photoId",
  as: "photo",
});

// Comment associations
Photo.hasMany(Comment, {
  foreignKey: "photoId",
  as: "Comments",
  onDelete: "CASCADE",
});

Comment.belongsTo(Photo, {
  foreignKey: "photoId",
  as: "Photo",
});

Comment.belongsTo(User, {
  foreignKey: "userId",
  as: "User",
});

// Self-referencing association for replies
Comment.hasMany(Comment, {
  foreignKey: "parentCommentId",
  as: "Replies",
  onDelete: "CASCADE",
});

Comment.belongsTo(Comment, {
  foreignKey: "parentCommentId",
  as: "ParentComment",
});

// Initialize models
const models = {
  Photo,
  User,
  Contest,
  PhotoContest,
  Vote,
  Comment,
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
  // Compute phase if it's not already set
  if (!values.phase) {
    const now = new Date();
    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);
    const votingStartDate = new Date(values.votingStartDate);
    const votingEndDate = new Date(values.votingEndDate);

    if (now < startDate) {
      values.phase = "upcoming";
    } else if (now >= startDate && now <= endDate) {
      values.phase = "submission";
    } else if (now > endDate && now < votingStartDate) {
      values.phase = "processing";
    } else if (now >= votingStartDate && now <= votingEndDate) {
      values.phase = "voting";
    } else {
      values.phase = "ended";
    }
  }
  return values;
};

Vote.prototype.toJSON = function () {
  const values = { ...this.get() };
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
