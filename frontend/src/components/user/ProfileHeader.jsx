import React, { useState, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import XPServiceStatic from "../../services/XPService";
import { useXPService } from "../../hooks";

export function ProfileHeader({
  profile,
  userId,
  bannerImage,
  photosCount,
  isOwner,
  onEditClick,
  defaultBanner = "https://i.redd.it/jlpv3gf20c291.png",
}) {
  // Ensure we have a valid banner URL
  const bannerUrl = bannerImage || defaultBanner;
  const { openUserProfile } = useClerk();
  const xpService = useXPService();

  // State for timeframe XP data
  const [timeframeXP, setTimeframeXP] = useState({ monthly: 0, yearly: 0 });

  // Fetch timeframe XP data when component mounts
  useEffect(() => {
    const fetchTimeframeXP = async () => {
      if (!profile?.xp || !userId) return;

      try {
        const [monthlyRes, yearlyRes] = await Promise.all([
          xpService
            .getUserTimeframeXPByUserId(userId, "monthly")
            .catch(() => ({ xp: 0 })),
          xpService
            .getUserTimeframeXPByUserId(userId, "yearly")
            .catch(() => ({ xp: 0 })),
        ]);

        setTimeframeXP({
          monthly: monthlyRes.xp || 0,
          yearly: yearlyRes.xp || 0,
        });
      } catch (error) {
        console.error("Error fetching timeframe XP:", error);
        // Keep defaults on error
      }
    };

    fetchTimeframeXP();
  }, [profile?.xp, userId, xpService]);

  // Calculate XP progress for the bottom bar
  const hasXPData =
    profile &&
    typeof profile.level !== "undefined" &&
    typeof profile.xp !== "undefined";
  let xpBarData = null;

  if (hasXPData) {
    const { level, xp, progressPercent, xpNeededForNextLevel } = profile;
    const levelColor = XPServiceStatic.getLevelColor(level);
    const levelTitle = XPServiceStatic.getLevelTitle(level);

    // Use backend-calculated progress data if available, otherwise calculate on frontend
    const finalProgressPercent =
      progressPercent !== undefined
        ? progressPercent
        : XPServiceStatic.getXPProgress(xp, level).progressPercent;
    const finalXpNeeded =
      xpNeededForNextLevel !== undefined
        ? xpNeededForNextLevel
        : XPServiceStatic.getXPProgress(xp, level).xpNeededForNextLevel;

    xpBarData = {
      level,
      levelColor,
      levelTitle,
      progressPercent: finalProgressPercent,
      xpNeeded: finalXpNeeded,
      totalXP: xp,
      monthlyXP: timeframeXP.monthly,
      yearlyXP: timeframeXP.yearly,
    };
  }

  return (
    <div className="profile-header-container">
      <div
        className="profile-banner"
        style={{
          backgroundImage: `url(${bannerUrl})`,
          backgroundColor: "#000033", // Fallback color
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {isOwner && (
          <button className="edit-profile-button" onClick={onEditClick}>
            Edit Profile
          </button>
        )}
        <div className="profile-banner-overlay" />

        {/* Comprehensive XP Progress Bar at bottom of banner */}
        {xpBarData && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur border-t border-white/10">
            <div className="px-4 py-2">
              {/* Single row with all XP information */}
              <div className="flex items-center gap-4">
                {/* Left: Level badge and title */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-xs border border-white/20"
                    style={{ backgroundColor: xpBarData.levelColor }}
                  >
                    {xpBarData.level}
                  </div>
                  <span className="text-white text-xs font-medium whitespace-nowrap">
                    {xpBarData.levelTitle}
                  </span>
                </div>

                {/* XP Stats - compact horizontal layout */}
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <div className="text-center">
                    <span className="text-white/60">All:</span>
                    <span className="text-white font-medium ml-1">
                      {XPServiceStatic.formatXP(xpBarData.totalXP)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-white/60">Year:</span>
                    <span className="text-indigo-300 font-medium ml-1">
                      {XPServiceStatic.formatXP(xpBarData.yearlyXP)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-white/60">Month:</span>
                    <span className="text-green-300 font-medium ml-1">
                      {XPServiceStatic.formatXP(xpBarData.monthlyXP)}
                    </span>
                  </div>
                </div>

                {/* Center: Progress bar */}
                <div className="flex-1 bg-white/20 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(xpBarData.progressPercent, 100)}%`,
                      backgroundColor: xpBarData.levelColor,
                      boxShadow: `0 0 6px ${xpBarData.levelColor}60`,
                    }}
                  ></div>
                </div>

                {/* Right: Next level info */}
                <div className="flex-shrink-0 text-xs text-white/70 whitespace-nowrap hidden sm:block">
                  {XPServiceStatic.formatXP(xpBarData.xpNeeded)} to Lv
                  {xpBarData.level + 1}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile content absolutely positioned over banner */}
      <div className="profile-content">
        {/* Inner container using flex for columns */}
        <div className="profile-info">
          {/* Left Column: Avatar */}
          <div className="profile-avatar-container">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile?.nickname || `User ${userId}`}
                className={`w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg ${
                  isOwner ? "cursor-pointer hover:opacity-90" : ""
                }`}
                onClick={isOwner ? () => openUserProfile() : undefined}
                title={isOwner ? "Click to change profile picture" : undefined}
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl border-3 border-white shadow-lg ${
                  isOwner ? "cursor-pointer hover:opacity-90" : ""
                }`}
                onClick={isOwner ? () => openUserProfile() : undefined}
                title={isOwner ? "Click to add profile picture" : undefined}
              >
                {(profile?.nickname?.[0] || userId[0] || "U").toUpperCase()}
              </div>
            )}
          </div>

          {/* Right Column: Name, Stats, Bio */}
          <div className="profile-text-container">
            <div className="flex flex-col justify-center">
              <h1 className="profile-name mb-0">
                {profile?.nickname || `User ${userId}`}
              </h1>
              <div className="profile-stats mt-1">
                <span>{photosCount} Photos</span>
              </div>
            </div>
            {/* Bio moved inside the right column, uses profile-bio class for constraints */}
            {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
