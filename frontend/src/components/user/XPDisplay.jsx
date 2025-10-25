import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import XPServiceStatic from "../../services/XPService";
import { useXPService } from "../../hooks";

// Compact level badge only
export const XPBadge = ({ user, size = "small" }) => {
  if (!user || typeof user.level === "undefined") {
    return null;
  }

  const { level } = user;
  const levelColor = XPServiceStatic.getLevelColor(level);
  const levelTitle = XPServiceStatic.getLevelTitle(level);

  const badgeSize = {
    small: "w-6 h-6 text-xs",
    normal: "w-8 h-8 text-sm",
    large: "w-10 h-10 text-base",
  };

  return (
    <div
      className={`${badgeSize[size]} rounded-full flex items-center justify-center font-bold text-white border-2 border-white shadow-md`}
      style={{ backgroundColor: levelColor }}
      title={`Level ${level} ${levelTitle}`}
    >
      {level}
    </div>
  );
};

// Simple inline XP display with level badge and basic info
export const XPInline = ({ user, showProgress = true, size = "normal" }) => {
  if (
    !user ||
    typeof user.level === "undefined" ||
    typeof user.xp === "undefined"
  ) {
    return null;
  }

  const {
    level,
    xp,
    progressPercent,
    xpInCurrentLevel,
    currentLevelXP,
    nextLevelXP,
  } = user;
  const levelColor = XPServiceStatic.getLevelColor(level);
  const levelTitle = XPServiceStatic.getLevelTitle(level);

  // Use backend-calculated progress data if available, otherwise calculate on frontend
  const progress =
    progressPercent !== undefined
      ? {
          progressPercent,
          xpInCurrentLevel,
          currentLevelXP,
          nextLevelXP,
        }
      : XPServiceStatic.getXPProgress(xp, level);

  const sizeClasses = {
    small: "text-sm",
    normal: "text-base",
    large: "text-lg",
  };

  const badgeSize = {
    small: "w-6 h-6 text-xs",
    normal: "w-8 h-8 text-sm",
    large: "w-10 h-10 text-base",
  };

  return (
    <div className="flex items-center gap-2">
      {/* Level Badge */}
      <div
        className={`${badgeSize[size]} rounded-full flex items-center justify-center font-bold text-white border-2 border-white shadow-md`}
        style={{ backgroundColor: levelColor }}
        title={`Level ${level} ${levelTitle}`}
      >
        {level}
      </div>

      {/* XP Info */}
      <div className={`${sizeClasses[size]} text-gray-200`}>
        <div className="font-semibold">{levelTitle}</div>
        <div className="text-gray-400">{XPServiceStatic.formatXP(xp)} XP</div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="flex-1 max-w-32">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(progress.progressPercent, 100)}%`,
                backgroundColor: levelColor,
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {progress.xpInCurrentLevel} /{" "}
            {progress.nextLevelXP - progress.currentLevelXP} XP
          </div>
        </div>
      )}
    </div>
  );
};

// Wide XP dashboard for homepage and profile pages
export const XPDashboard = ({ userId = null, className = "" }) => {
  const [xpData, setXpData] = useState(null);
  const [timeframeXP, setTimeframeXP] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const xpService = useXPService();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    fetchXPData();
  }, [userId, isSignedIn]);

  const fetchXPData = async () => {
    // If user is not signed in, show appropriate message
    if (!isSignedIn) {
      setLoading(false);
      setError("login_required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch main XP stats and timeframe data in parallel
      const [statsRes, monthlyRes, yearlyRes] = await Promise.all([
        xpService.getUserXPStats(),
        xpService.getUserTimeframeXP("monthly").catch(() => ({ xp: 0 })),
        xpService.getUserTimeframeXP("yearly").catch(() => ({ xp: 0 })),
      ]);

      setXpData(statsRes);
      setTimeframeXP({
        monthly: monthlyRes.xp || 0,
        yearly: yearlyRes.xp || 0,
      });
    } catch (err) {
      console.error("Error fetching XP data:", err);
      setError("Failed to load XP data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-3 bg-gray-700 rounded w-1/4 mb-3"></div>
          <div className="h-12 bg-gray-700 rounded mb-3"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !xpData) {
    // Show different message based on error type
    const isLoginRequired = error === "login_required";

    return (
      <div
        className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-4 ${className}`}
      >
        <div className="text-center text-gray-400">
          {isLoginRequired ? (
            <div>
              <div className="text-indigo-400 text-lg mb-2">🏆</div>
              <p className="text-sm mb-1">Sign in to view your XP progress</p>
              <p className="text-xs text-gray-500">
                Track your level, earn points, and compete with others!
              </p>
            </div>
          ) : (
            <p className="text-sm">{error || "No XP data available"}</p>
          )}
        </div>
      </div>
    );
  }

  const {
    level,
    totalXP,
    progressPercent,
    xpInCurrentLevel,
    nextLevelXP,
    currentLevelXP,
  } = xpData;
  const levelColor = XPServiceStatic.getLevelColor(level);
  const levelTitle = XPServiceStatic.getLevelTitle(level);

  return (
    <div
      className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-4 ${className}`}
    >
      {/* Compact Header with Level and Progress */}
      <div className="flex items-center gap-4 mb-4">
        {/* Level Badge and Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-600 shadow-lg"
            style={{ backgroundColor: levelColor }}
          >
            {level}
          </div>
          <div>
            <div className="font-bold text-gray-100">{levelTitle}</div>
            <div className="text-xs text-gray-400">Level {level}</div>
          </div>
        </div>

        {/* Progress Section - Takes remaining space */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-300">To Level {level + 1}</span>
            <span className="text-xs font-bold text-gray-100">
              {Math.round(progressPercent)}%
            </span>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: levelColor,
              }}
            ></div>
          </div>

          <div className="text-xs text-gray-400">
            {XPServiceStatic.formatXP(nextLevelXP - totalXP)} more XP needed
          </div>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total XP */}
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-100">
            {XPServiceStatic.formatXP(totalXP)}
          </div>
          <div className="text-xs text-gray-400">All Time</div>
        </div>

        {/* This Year */}
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-indigo-400">
            {XPServiceStatic.formatXP(timeframeXP.yearly)}
          </div>
          <div className="text-xs text-gray-400">This Year</div>
        </div>

        {/* This Month */}
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {XPServiceStatic.formatXP(timeframeXP.monthly)}
          </div>
          <div className="text-xs text-gray-400">This Month</div>
        </div>
      </div>
    </div>
  );
};

// Compact card version for sidebars
export const XPCard = ({ user, className = "" }) => {
  if (
    !user ||
    typeof user.level === "undefined" ||
    typeof user.xp === "undefined"
  ) {
    return null;
  }

  const {
    level,
    xp,
    progressPercent,
    xpInCurrentLevel,
    currentLevelXP,
    nextLevelXP,
    xpNeededForNextLevel,
  } = user;
  const levelColor = XPServiceStatic.getLevelColor(level);
  const levelTitle = XPServiceStatic.getLevelTitle(level);

  // Use backend-calculated progress data if available, otherwise calculate on frontend
  const progress =
    progressPercent !== undefined
      ? {
          progressPercent,
          xpInCurrentLevel,
          currentLevelXP,
          nextLevelXP,
          xpNeededForNextLevel,
        }
      : XPServiceStatic.getXPProgress(xp, level);

  return (
    <div
      className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-600 shadow-lg"
          style={{ backgroundColor: levelColor }}
        >
          {level}
        </div>
        <div>
          <h4 className="font-bold text-gray-100">{levelTitle}</h4>
          <p className="text-sm text-gray-400">Level {level}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-300">
          <span>Total XP</span>
          <span className="font-semibold">{XPServiceStatic.formatXP(xp)}</span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress.progressPercent, 100)}%`,
              backgroundColor: levelColor,
            }}
          ></div>
        </div>

        <div className="text-xs text-gray-400">
          {progress.xpInCurrentLevel} /{" "}
          {progress.nextLevelXP - progress.currentLevelXP} XP to next level
        </div>
      </div>
    </div>
  );
};

// Legacy export for backward compatibility
const XPDisplay = XPInline;
export default XPDisplay;
