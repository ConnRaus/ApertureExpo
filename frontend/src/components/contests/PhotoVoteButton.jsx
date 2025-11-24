import React, { useState, useEffect, useRef } from "react";
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
  initialUserVote = null,
  onUserVoteChange = () => {},
}) {
  const [voteCount, setVoteCount] = useState(photo.voteCount || 0);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const lastPhotoIdRef = useRef(photo.id);
  const optimisticIncrementRef = useRef(0);
  const voteService = useVoteService();
  const { user } = useUser();

  const isVotingPhase = contestPhase === "voting";
  const isOwnPhoto = user?.id === photo.userId;

  // Don't show voting UI to non-signed-in users
  if (!user) {
    return showCount ? (
      <div className="flex flex-col items-center">
        <div className="text-sm text-gray-400 mt-1">
          {voteCount} vote{voteCount !== 1 && "s"}
        </div>
      </div>
    ) : null;
  }

  // Reset state when photo changes (by ID only) and sync with any initial user vote
  // We don't reset on photo.voteCount changes to preserve optimistic updates
  useEffect(() => {
    // Only reset if this is actually a different photo
    if (lastPhotoIdRef.current !== photo.id) {
      setVoteCount(photo.voteCount || 0);
      optimisticIncrementRef.current = 0;
      lastPhotoIdRef.current = photo.id;
    }
    setUserVote(initialUserVote);
    setIsVoting(false);
    setHoverRating(0);
  }, [photo.id, initialUserVote]);

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
      const previousVote = userVote;
      const isNewVote = !previousVote;

      // Optimistically update UI immediately
      setIsVoting(true);
      setUserVote(value);
      onUserVoteChange(photo.id, value);
      if (isNewVote) {
        optimisticIncrementRef.current += 1;
        setVoteCount((prevCount) => prevCount + 1);
      }

      const response = await voteService.voteForPhoto(
        photo.id,
        contestId,
        value
      );

      if (response) {
        toast.success(
          previousVote
            ? "Your vote has been updated!"
            : "Your vote has been counted!"
        );

        if (onVoteSuccess) {
          onVoteSuccess(photo.id, value);
        }
      }
    } catch (error) {
      // Roll back optimistic UI on error
      const hadPrevious = userVote != null;
      setUserVote((prev) => {
        const fallback = prev != null ? prev : null;
        return fallback;
      });
      onUserVoteChange(photo.id, userVote);
      if (!hadPrevious) {
        optimisticIncrementRef.current = Math.max(0, optimisticIncrementRef.current - 1);
        setVoteCount((prevCount) => Math.max(0, prevCount - 1));
      }

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
              className={`text-2xl transition-all cursor-pointer ${
                hoverRating >= star
                  ? "text-yellow-200 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]"
                  : userVote >= star
                  ? "text-yellow-400"
                  : "text-gray-400"
              } ${
                isVotingPhase
                  ? "hover:scale-110"
                  : "opacity-50 cursor-not-allowed"
              }`}
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
