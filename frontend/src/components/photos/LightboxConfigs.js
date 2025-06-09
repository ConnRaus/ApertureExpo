// Configuration presets for the UnifiedLightbox component
// These make it easy to use the lightbox consistently across different contexts

export const LightboxConfigs = {
  // For user profile pages - show everything except voting info
  userProfile: {
    showTitle: true,
    showAuthor: false, // Already on their profile
    showDescription: true,
    showRating: false, // No ratings on profiles
    showVotes: false,
    showMetadata: true,
    showComments: true,
    showInfoButton: true,
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
    enableEditing: true, // Allow editing on user profiles
  },

  // For public user galleries - show basic info and metadata
  publicProfile: {
    showTitle: true,
    showAuthor: true,
    showDescription: true,
    showRating: false, // No ratings on profiles
    showVotes: false,
    showMetadata: true,
    showComments: true,
    showInfoButton: true,
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
  },

  // For contest submissions during voting - minimal info, no spoilers
  contestVoting: {
    showTitle: true,
    showAuthor: true,
    showDescription: true,
    showRating: false, // Hide during voting
    showVotes: false, // Hide during voting
    showMetadata: false, // Hide to prevent bias
    showComments: false, // Hide during voting
    showInfoButton: false, // No extra info during voting
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
    enableVoting: true, // Enable voting in lightbox
    showVotingStars: true, // Show 5-star voting system
  },

  // For contest results - show everything including ratings
  contestResults: {
    showTitle: true,
    showAuthor: true,
    showDescription: true,
    showRating: true, // Show results
    showVotes: true, // Show vote counts
    showMetadata: true,
    showComments: true,
    showInfoButton: true,
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
  },

  // For recent winners display - show key info and ratings
  recentWinners: {
    showTitle: true,
    showAuthor: true,
    showDescription: true,
    showRating: true, // Show rating for winners
    showVotes: true, // Show vote counts
    showMetadata: true, // Show metadata for winners
    showComments: true, // Show comments for winners
    showInfoButton: true, // Allow access to more info
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
  },

  // Minimal config for simple photo viewing
  minimal: {
    showTitle: true,
    showAuthor: false,
    showDescription: false,
    showRating: false,
    showVotes: false,
    showMetadata: false,
    showComments: false,
    showInfoButton: false,
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
  },

  // Full featured config - everything enabled
  full: {
    showTitle: true,
    showAuthor: true,
    showDescription: true,
    showRating: true,
    showVotes: true,
    showMetadata: true,
    showComments: true,
    showInfoButton: true,
    enableNavigation: true,
    enableKeyboardControls: true,
    enableSwipeControls: true,
  },
};
