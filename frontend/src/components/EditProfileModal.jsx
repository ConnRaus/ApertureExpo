import React from "react";
import formStyles from "../styles/components/Form.module.css";

export function EditProfileModal({
  isEditing,
  setIsEditing,
  nickname,
  setNickname,
  bio,
  setBio,
  bannerImage,
  setBannerImage,
  uploadingBanner,
  handleBannerUpload,
  setShowPhotoSelector,
  handleProfileUpdate,
}) {
  if (!isEditing) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsEditing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button
            className="modal-close-button"
            onClick={() => setIsEditing(false)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nickname</label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 50))}
                placeholder="Enter nickname"
                className={formStyles.input}
                maxLength={50}
              />
              <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                {nickname.length}/50
              </span>
            </div>

            <label className={formStyles.label}>Bio</label>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 250))}
                placeholder="Tell us about yourself"
                className={formStyles.textarea}
                maxLength={250}
              />
              <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                {bio.length}/250
              </span>
            </div>

            <label className={formStyles.label}>Banner Image</label>
            <div className="flex flex-col gap-3">
              {bannerImage && (
                <div className="relative rounded-lg overflow-hidden h-32">
                  <img
                    src={bannerImage}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    id="banner-upload"
                    disabled={uploadingBanner}
                  />
                  <label
                    htmlFor="banner-upload"
                    className={`${formStyles.button} ${formStyles.secondaryButton} w-full flex items-center justify-center cursor-pointer`}
                  >
                    {uploadingBanner ? "Uploading..." : "Upload Photo"}
                  </label>
                </div>
                <button
                  onClick={() => setShowPhotoSelector(true)}
                  className={`${formStyles.button} ${formStyles.secondaryButton} flex-1`}
                  disabled={uploadingBanner}
                >
                  Choose Photo
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={() => setIsEditing(false)}
            className={`${formStyles.button} ${formStyles.secondaryButton}`}
          >
            Cancel
          </button>
          <button
            onClick={handleProfileUpdate}
            className={`${formStyles.button} ${formStyles.primaryButton}`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
