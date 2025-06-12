// Configuration presets for the UnifiedPhotoGrid component
// These make it easy to use the photo grid consistently across different contexts

export const PhotoGridConfigs = {
  // For user profile pages
  userProfile: {
    showTitle: true,
    showDescription: true,
    showDate: true,
    showDeleteButton: true,
    showProfileLink: false,
    showVoting: false,
    showAuthor: false,
    showRating: false,
    enableHoverEffects: true,
    aspectRatio: "flexible", // flexible, square, or specific ratio
  },

  // For public user galleries
  publicProfile: {
    showTitle: true,
    showDescription: true,
    showDate: true,
    showDeleteButton: false,
    showProfileLink: false,
    showVoting: false,
    showAuthor: false,
    showRating: false,
    enableHoverEffects: true,
    aspectRatio: "flexible",
  },

  // For contest submissions during submission phase
  contestSubmission: {
    showTitle: true,
    showDescription: false,
    showDate: false,
    showDeleteButton: false,
    showProfileLink: false,
    showVoting: false,
    showAuthor: true,
    showRating: false,
    enableHoverEffects: true,
    aspectRatio: "flexible",
  },

  // For contest submissions during voting phase
  contestVoting: {
    showTitle: false,
    showDescription: false,
    showDate: false,
    showDeleteButton: false,
    showProfileLink: false,
    showVoting: true,
    showAuthor: false,
    showRating: false,
    enableHoverEffects: true,
    aspectRatio: "flexible",
  },

  // For contest results
  contestResults: {
    showTitle: true,
    showDescription: false,
    showDate: false,
    showDeleteButton: false,
    showProfileLink: true,
    showVoting: false,
    showAuthor: true,
    showRating: true,
    enableHoverEffects: true,
    aspectRatio: "flexible",
  },
};
