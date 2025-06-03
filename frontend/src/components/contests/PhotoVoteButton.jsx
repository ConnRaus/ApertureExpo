import React, { useState, useEffect } from "react";
import { useVoteService } from "../../hooks";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";

export function PhotoVoteButton({
  photo,
  contestId,
  contestPhase,
  showCount = true,
  showStars = false,
  onVoteSuccess = null,
}) {
  const [voteCount, setVoteCount] = useState(photo.voteCount || 0);
  const [userVote, setUserVote] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const voteService = useVoteService();
  const { user } = useUser();

  const isVotingPhase = contestPhase === "voting";
  const isOwnPhoto = user?.id === photo.userId;

  // Check if user has already voted for this photo
  useEffect(() => {
    if (contestId && photo.id && isVotingPhase) {
      const checkUserVote = async () => {
        try {
          const userVotes = await voteService.getUserVotes(contestId);
          const existingVote = userVotes.find(
            (vote) => vote.photoId === photo.id
          );
          if (existingVote) {
            setUserVote(existingVote.value);
          }
        } catch (error) {
          console.error("Error checking user votes:", error);
        }
      };

      checkUserVote();
    }
  }, [contestId, photo.id, isVotingPhase]);

  const handleVote = async (value = 1) => {
    if (!isVotingPhase) {
      toast.info("Voting is not currently open for this contest");
      return;
    }

    if (isOwnPhoto) {
      toast.info("You cannot vote on your own photos");
      return;
    }

    if (isVoting) return;

    try {
      setIsVoting(true);
      const response = await voteService.voteForPhoto(
        photo.id,
        contestId,
        value
      );

      if (response) {
        // Update the UI
        setUserVote(value);

        // If this is a new vote, increment the count
        if (!userVote) {
          setVoteCount((prevCount) => prevCount + 1);
        }

        toast.success(
          userVote
            ? "Your vote has been updated!"
            : "Your vote has been counted!"
        );

        if (onVoteSuccess) {
          onVoteSuccess(photo.id, value);
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  // Show disabled button with message if it's the user's own photo
  if (isOwnPhoto) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-sm text-amber-300 mb-1">Your photo</div>
        <button
          className="px-4 py-2 rounded-md transition-all bg-gray-700/50 text-gray-400 border border-gray-700 opacity-50 cursor-not-allowed"
          disabled={true}
        >
          Cannot vote
        </button>
        {showCount && (
          <div className="text-sm text-gray-400 mt-1">
            {voteCount} vote{voteCount !== 1 && "s"}
          </div>
        )}
      </div>
    );
  }

  // Render different UIs based on if we're showing stars or a simple vote button
  if (showStars) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex space-x-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`text-2xl transition-all ${
                (hoverRating || userVote) >= star
                  ? "text-yellow-400"
                  : "text-gray-400"
              } ${!isVotingPhase && "opacity-50 cursor-not-allowed"}`}
              onClick={() => handleVote(star)}
              onMouseEnter={() => isVotingPhase && setHoverRating(star)}
              onMouseLeave={() => isVotingPhase && setHoverRating(0)}
              disabled={!isVotingPhase || isVoting}
            >
              ★
            </button>
          ))}
        </div>
        {showCount && (
          <div className="text-sm text-gray-400">
            {voteCount} vote{voteCount !== 1 && "s"}
          </div>
        )}
      </div>
    );
  }

  // Simple vote button
  return (
    <div className="flex flex-col items-center">
      <button
        className={`px-4 py-2 rounded-md transition-all ${
          userVote
            ? "bg-green-700/50 text-green-300 border border-green-700"
            : "bg-indigo-700/50 text-indigo-300 border border-indigo-700 hover:bg-indigo-700/70"
        } ${!isVotingPhase && "opacity-50 cursor-not-allowed"}`}
        onClick={() => handleVote()}
        disabled={!isVotingPhase || isVoting}
      >
        {isVoting ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Voting...
          </span>
        ) : userVote ? (
          "Voted!"
        ) : (
          "Vote"
        )}
      </button>
      {showCount && (
        <div className="text-sm text-gray-400 mt-1">
          {voteCount} vote{voteCount !== 1 && "s"}
        </div>
      )}
    </div>
  );
}
