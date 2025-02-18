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
  return (
    <div className="profile-header-container">
      <div
        className="profile-banner"
        style={{
          backgroundImage: `url(${bannerImage || defaultBanner})`,
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
          <h1 className="profile-name">
            {profile?.nickname || `User ${userId}`}
          </h1>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <span>{photosCount} Photos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
