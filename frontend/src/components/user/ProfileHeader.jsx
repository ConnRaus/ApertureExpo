import React from "react";

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
      </div>
      <div className="profile-content">
        <div className="profile-info">
          <div className="flex items-center gap-6">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile?.nickname || `User ${userId}`}
                className="w-24 h-24 rounded-full object-cover border-3 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl border-3 border-white shadow-lg">
                {(profile?.nickname?.[0] || userId[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="flex flex-col justify-center -mt-1">
              <h1 className="profile-name mb-0">
                {profile?.nickname || `User ${userId}`}
              </h1>
              <div className="profile-stats mt-1">
                <span>{photosCount} Photos</span>
              </div>
            </div>
          </div>
          {profile?.bio && <p className="profile-bio mt-5">{profile.bio}</p>}
        </div>
      </div>
    </div>
  );
}
