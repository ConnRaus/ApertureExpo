import sequelize from "../config/config.js";
import Photo from "./Photo.js";
import User from "./User.js";
import Contest from "./Contest.js";

// Define associations
Contest.hasMany(Photo, {
  foreignKey: "ContestId",
  as: "Photos",
  onDelete: "SET NULL",
});

Photo.belongsTo(Contest, {
  foreignKey: "ContestId",
  as: "Contest",
});

// Initialize models
const models = {
  Photo,
  User,
  Contest,
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

export { sequelize };
export default models;
