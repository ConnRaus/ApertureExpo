import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import XPServiceStatic from "../services/XPService";
import { useXPService } from "../hooks";
import { XPBadge, XPDashboard } from "../components/user/XPDisplay";
import { LoadingSpinner } from "../components/common/CommonComponents";
import RecentXPActivity from "../components/user/RecentXPActivity";
import styles from "../styles/pages/LeaderboardPage.module.css";

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState({});
  const [xpRewards, setXpRewards] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
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
      const [leaderboardRes, rewardsData, transactions] = await Promise.all([
        xpService.getLeaderboard("all", 50),
        xpService.getXPRewards(),
        xpService.getRecentTransactions(15).catch(() => []), // Don't fail if not logged in
      ]);

      setLeaderboardData({ all: leaderboardRes });
      setXpRewards(rewardsData);
      setRecentTransactions(transactions);
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
    <div className={styles.leaderboardPage}>
      <div className={styles.heroBanner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>Community Leaderboard</h1>
          <p className={styles.bannerSubtitle}>
            Top photographers ranked by experience points and level
          </p>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* User's XP Dashboard */}
        <XPDashboard className="mb-8" />

        {/* Main Content Grid - Sidebar Layout */}
        <div className={`grid grid-cols-1 gap-6 ${recentTransactions.length > 0 ? 'md:grid-cols-3' : ''}`}>
          {/* Main Content - Leaderboard and Rewards */}
          <div className={recentTransactions.length > 0 ? "md:col-span-2" : ""}>
            {activeTab === "leaderboard" && (
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Title */}
                  <h2 className="text-xl font-semibold text-gray-100">
                    Top 50 Users
                  </h2>

                  {/* Right: Tab Toggle and Timeframe Dropdown */}
                  <div className="flex items-center gap-3">
                    {/* Tab Toggle */}
                    <div className="bg-gray-700/50 rounded-lg p-1 flex">
                      <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          activeTab === "leaderboard"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Rankings
                      </button>
                      <button
                        onClick={() => setActiveTab("rewards")}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          activeTab === "rewards"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Rewards
                      </button>
                    </div>

                    {/* Timeframe Dropdown */}
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="bg-gray-700/50 text-gray-100 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Time</option>
                      <option value="yearly">This Year</option>
                      <option value="monthly">This Month</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-gray-700/50">
                  {leaderboardData[selectedTimeframe]?.leaderboard?.map(
                    (user) => {
                      const levelColor = XPServiceStatic.getLevelColor(
                        user.level
                      );
                      return (
                        <Link
                          key={user.userId}
                          to={`/users/${user.userId}`}
                          className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 hover:bg-gray-700/30 transition-colors"
                        >
                          {/* Rank with Medal - with background */}
                          <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-gray-700/50 flex items-center justify-center">
                            {user.rank <= 3 ? (
                              <span
                                className="text-lg sm:text-2xl"
                                title={`Rank ${user.rank}`}
                              >
                                {getRankMedal(user.rank)}
                              </span>
                            ) : (
                              <span
                                className={`text-sm sm:text-lg font-bold ${getRankColor(
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
                                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover shadow-lg"
                                style={{ border: `2px solid ${levelColor}` }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-semibold text-base sm:text-lg shadow-lg"
                                style={{ border: `2px solid ${levelColor}` }}
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
                              className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] sm:text-xs border-2 border-gray-800 shadow-md"
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
                            <div className="text-sm sm:text-base text-gray-100 font-medium hover:text-indigo-400 transition-colors truncate">
                              {user.nickname ||
                                `User ${user.userId.slice(0, 8)}`}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-400">
                              <span
                                className="font-medium"
                                style={{ color: levelColor }}
                              >
                                {XPServiceStatic.getLevelTitle(user.level)}
                              </span>
                              {selectedTimeframe !== "all" && (
                                <span className="text-gray-500 hidden sm:inline">
                                  {" • "}
                                  {XPServiceStatic.formatXP(user.xp)} total
                                </span>
                              )}
                            </p>
                          </div>

                          {/* XP Amount on Right */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm sm:text-lg font-bold text-gray-100">
                              {XPServiceStatic.formatXP(
                                selectedTimeframe === "all"
                                  ? user.xp
                                  : user.timeframeXP
                              )}{" "}
                              <span className="text-xs sm:text-sm text-gray-500 font-normal">
                                XP
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  ) || (
                    <div className="px-6 py-12 text-center text-gray-400">
                      <p className="text-lg">
                        Loading {selectedTimeframe} leaderboard...
                      </p>
                    </div>
                  )}
                </div>

                {leaderboardData[selectedTimeframe]?.leaderboard?.length ===
                  0 && (
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
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg overflow-hidden">
                {/* Header with toggle */}
                <div className="px-6 py-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-100">
                    XP Rewards
                  </h2>
                  
                  {/* Tab Toggle */}
                  <div className="bg-gray-700/50 rounded-lg p-1 flex">
                    <button
                      onClick={() => setActiveTab("leaderboard")}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        activeTab === "leaderboard"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Rankings
                    </button>
                    <button
                      onClick={() => setActiveTab("rewards")}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        activeTab === "rewards"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Rewards
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Individual Rewards */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">
                      Individual XP Rewards
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(xpRewards.rewards).map(([action, xp]) => (
                        <div
                          key={action}
                          className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div className="font-medium text-gray-200">
                            {xpRewards.description[action]}
                          </div>
                          <div className="text-lg font-bold text-indigo-400">
                            +{xp} XP
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contest Placement Rewards */}
                  {xpRewards.stackingInfo && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">
                        How Contest Rewards Stack
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        {xpRewards.stackingInfo.explanation}
                      </p>
                      
                      <div className="grid gap-3">
                        {xpRewards.stackingInfo.examples.map((example, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-700/30 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-200 mb-1">
                                {example.placement}
                              </div>
                              <div className="text-xs text-gray-400">
                                {example.rewards.join(" + ")}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-indigo-400">
                              +{example.total.toLocaleString()} XP
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level Progression */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">
                      Level Progression
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      XP required per level:{" "}
                      <code className="bg-gray-700/50 px-2 py-0.5 rounded text-indigo-300 font-mono text-xs">
                        {xpRewards.levelFormula}
                      </code>
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[1, 5, 10, 20, 30, 50].map((level) => (
                        <div
                          key={level}
                          className="text-center p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div
                            className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{
                              backgroundColor:
                                XPServiceStatic.getLevelColor(level),
                            }}
                          >
                            {level}
                          </div>
                          <div className="text-xs text-gray-400">
                            {XPServiceStatic.formatXP(
                              XPServiceStatic.getXpForLevel(level)
                            )}{" "}
                            XP
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {XPServiceStatic.getLevelTitle(level)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Recent Activity (only show if there are transactions) */}
          {recentTransactions.length > 0 && (
            <div className="md:col-span-1">
              <div className="md:sticky md:top-4">
                <RecentXPActivity
                  transactions={recentTransactions}
                  className="mb-6"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
