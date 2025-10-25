import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import XPServiceStatic from "../services/XPService";
import { useXPService } from "../hooks";
import { XPBadge, XPDashboard } from "../components/user/XPDisplay";
import { LoadingSpinner } from "../components/common/CommonComponents";

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState({});
  const [xpRewards, setXpRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const xpService = useXPService();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard(selectedTimeframe);
    }
  }, [selectedTimeframe, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, rewardsData] = await Promise.all([
        xpService.getLeaderboard("all", 50),
        xpService.getXPRewards(),
      ]);

      setLeaderboardData({ all: leaderboardRes });
      setXpRewards(rewardsData);
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (timeframe) => {
    if (leaderboardData[timeframe]) return; // Already fetched

    try {
      const data = await xpService.getLeaderboard(timeframe, 50);
      setLeaderboardData((prev) => ({
        ...prev,
        [timeframe]: data,
      }));
    } catch (err) {
      console.error(`Error fetching ${timeframe} leaderboard:`, err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getRankMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "text-yellow-400 font-bold";
    if (rank === 2) return "text-gray-300 font-bold";
    if (rank === 3) return "text-orange-400 font-bold";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Leaderboard</h1>
          <p className="text-gray-400">
            Top photographers ranked by experience points and level
          </p>
        </div>

        {/* User's XP Dashboard */}
        <XPDashboard className="mb-8" />

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "leaderboard"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "rewards"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              XP Rewards
            </button>
          </div>
        </div>

        {activeTab === "leaderboard" && (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-100">
                Top 50 Users
              </h2>

              {/* Timeframe Selector */}
              <div className="flex space-x-2">
                {[
                  { key: "all", label: "All Time" },
                  { key: "yearly", label: "This Year" },
                  { key: "monthly", label: "This Month" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTimeframe(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeframe === key
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-700/50">
              {leaderboardData[selectedTimeframe]?.leaderboard?.map((user) => {
                const levelColor = XPServiceStatic.getLevelColor(user.level);
                return (
                  <Link
                    key={user.userId}
                    to={`/users/${user.userId}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Rank with Medal - with background */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center">
                      {user.rank <= 3 ? (
                        <span className="text-2xl" title={`Rank ${user.rank}`}>
                          {getRankMedal(user.rank)}
                        </span>
                      ) : (
                        <span
                          className={`text-lg font-bold ${getRankColor(
                            user.rank
                          )}`}
                        >
                          #{user.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar with Level Badge Overlay */}
                    <div className="flex-shrink-0 relative">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.nickname || "User avatar"}
                          className="w-14 h-14 rounded-full object-cover shadow-lg"
                          style={{ border: `3px solid ${levelColor}` }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-semibold text-lg shadow-lg"
                          style={{ border: `3px solid ${levelColor}` }}
                        >
                          {(
                            user.nickname?.[0] ||
                            user.userId[0] ||
                            "U"
                          ).toUpperCase()}
                        </div>
                      )}
                      {/* Level Badge Overlay */}
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs border-2 border-gray-800 shadow-md"
                        style={{ backgroundColor: levelColor }}
                        title={`Level ${
                          user.level
                        } ${XPServiceStatic.getLevelTitle(user.level)}`}
                      >
                        {user.level}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-100 font-medium hover:text-indigo-400 transition-colors truncate">
                        {user.nickname || `User ${user.userId.slice(0, 8)}`}
                      </div>
                      <p className="text-sm text-gray-400">
                        <span
                          className="font-medium"
                          style={{ color: levelColor }}
                        >
                          {XPServiceStatic.getLevelTitle(user.level)}
                        </span>
                        {selectedTimeframe !== "all" && (
                          <span className="text-gray-500">
                            {" • "}
                            {XPServiceStatic.formatXP(user.xp)} total
                          </span>
                        )}
                      </p>
                    </div>

                    {/* XP Amount on Right */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold text-gray-100">
                        {XPServiceStatic.formatXP(
                          selectedTimeframe === "all"
                            ? user.xp
                            : user.timeframeXP
                        )}{" "}
                        <span className="text-sm text-gray-500 font-normal">
                          XP
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              }) || (
                <div className="px-6 py-12 text-center text-gray-400">
                  <p className="text-lg">
                    Loading {selectedTimeframe} leaderboard...
                  </p>
                </div>
              )}
            </div>

            {leaderboardData[selectedTimeframe]?.leaderboard?.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-400">
                <p className="text-lg">
                  No users found for{" "}
                  {selectedTimeframe === "all"
                    ? "all time"
                    : selectedTimeframe === "yearly"
                    ? "this year"
                    : "this month"}
                </p>
                <p className="text-sm">Be the first to start earning XP!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "rewards" && xpRewards && (
          <div className="space-y-6">
            {/* XP Rewards Info */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                How to Earn XP
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(xpRewards.rewards).map(([action, xp]) => (
                  <div
                    key={action}
                    className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-200">
                        {xpRewards.description[action]}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-400">
                      +{xp} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Formula */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Level Progression
              </h2>
              <p className="text-gray-300 mb-4">
                The XP required for each level follows the formula:{" "}
                <code className="bg-gray-700/50 px-2 py-1 rounded text-indigo-300">
                  {xpRewards.levelFormula}
                </code>
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 5, 10, 20, 30, 50].map((level) => (
                  <div
                    key={level}
                    className="text-center p-3 bg-gray-700/30 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor: XPServiceStatic.getLevelColor(level),
                      }}
                    >
                      {level}
                    </div>
                    <div className="text-sm font-medium text-gray-200">
                      Level {level}
                    </div>
                    <div className="text-xs text-gray-400">
                      {XPServiceStatic.formatXP(
                        XPServiceStatic.getXpForLevel(level)
                      )}{" "}
                      XP
                    </div>
                    <div className="text-xs text-gray-500">
                      {XPServiceStatic.getLevelTitle(level)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
