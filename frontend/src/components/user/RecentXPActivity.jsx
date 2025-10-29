import React from "react";
import { Link } from "react-router-dom";

const RecentXPActivity = ({ transactions = [], className = "" }) => {
  const getActionTypeLabel = (actionType) => {
    switch (actionType) {
      case "SUBMIT_PHOTO":
        return "Photo Submission";
      case "VOTE":
        return "Vote Cast";
      case "PLACE_1ST":
        return "🥇 1st Place";
      case "PLACE_2ND":
        return "🥈 2nd Place";
      case "PLACE_3RD":
        return "🥉 3rd Place";
      case "TOP_10_PERCENT":
        return "Top 10% Finish";
      case "TOP_25_PERCENT":
        return "Top 25% Finish";
      case "PHOTO_DELETION":
        return "Photo Deletion";
      default:
        return actionType;
    }
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case "PLACE_1ST":
        return "text-yellow-400";
      case "PLACE_2ND":
        return "text-gray-300";
      case "PLACE_3RD":
        return "text-orange-400";
      case "TOP_10_PERCENT":
      case "TOP_25_PERCENT":
        return "text-purple-400";
      case "SUBMIT_PHOTO":
        return "text-blue-400";
      case "VOTE":
        return "text-green-400";
      case "PHOTO_DELETION":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const awardedDate = new Date(date);
    const seconds = Math.floor((now - awardedDate) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  if (!transactions || transactions.length === 0) {
    return null; // Don't render if no transactions
  }

  return (
    <div
      className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-700/50">
        <h2 className="text-xl font-semibold text-gray-100">Recent Activity</h2>
        <p className="text-sm text-gray-400 mt-1">Your latest XP gains</p>
      </div>

      <div className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="px-6 py-3 hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-medium ${getActionTypeColor(
                      transaction.actionType
                    )}`}
                  >
                    {getActionTypeLabel(transaction.actionType)}
                  </span>
                </div>
                {transaction.contestTitle && transaction.contestId && (
                  <Link
                    to={`/events/${transaction.contestId}`}
                    className="text-sm text-gray-400 hover:text-indigo-400 mt-1 block truncate transition-colors"
                  >
                    {transaction.contestTitle}
                  </Link>
                )}
                {transaction.contestTitle && !transaction.contestId && (
                  <p className="text-sm text-gray-400 mt-1 truncate">
                    {transaction.contestTitle}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(transaction.awardedAt)}
                </p>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`text-lg font-bold whitespace-nowrap ${
                    transaction.xpAmount > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {transaction.xpAmount > 0 ? "+" : ""}
                  {transaction.xpAmount} XP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentXPActivity;
