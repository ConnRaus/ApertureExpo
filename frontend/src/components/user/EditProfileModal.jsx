import React from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import formStyles from "../../styles/components/Form.module.css";

export function EditProfileModal({
  isEditing,
  setIsEditing,
  nickname,
  setNickname,
  bio,
  setBio,
  bannerImage,
  uploadingBanner,
  handleBannerUpload,
  setShowPhotoLibraryPicker,
  handleProfileUpdate,
  profile,
}) {
  const { openUserProfile } = useClerk();
  const { user } = useUser();
  const avatarUrl = profile?.avatarUrl || user?.imageUrl;

  if (!isEditing) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsEditing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button
            className="modal-close-button"
            onClick={() => setIsEditing(false)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className={formStyles.formGroup}>
            {/* Banner Image Preview - at the top to match profile layout */}
            <div className="mb-6">
              <label className={formStyles.label}>Banner Image</label>
              {bannerImage && (
                <div className="relative rounded-lg overflow-hidden h-40 mb-3">
                  <img
                    src={bannerImage}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
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
                    className={`${formStyles.button} ${formStyles.secondaryButton} w-full flex items-center justify-center cursor-pointer text-center`}
                  >
                    <span className="w-full text-center">
                      {uploadingBanner ? "Uploading..." : "Upload New Banner"}
                    </span>
                  </label>
                </div>
                <button
                  onClick={() => setShowPhotoLibraryPicker(true)}
                  className={`${formStyles.button} ${formStyles.secondaryButton} w-full flex items-center justify-center`}
                  disabled={uploadingBanner}
                >
                  Choose From Photos
                </button>
              </div>
            </div>

            {/* Profile Identity Section - Group profile picture and nickname together */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <button
                    onClick={() => openUserProfile()}
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    title="Change Profile Picture"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex-1">
                  <label className={formStyles.label}>Display Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 25))}
                      placeholder="Enter nickname"
                      className={formStyles.input}
                      maxLength={25}
                    />
                    <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                      {nickname.length}/25
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <label className={formStyles.label} htmlFor="bio">
                Bio
              </label>
              <div className="relative">
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 250))}
                  placeholder="Tell us about yourself"
                  className={`${formStyles.textarea} h-24`}
                  maxLength={250}
                />
                <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {bio.length}/250
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer mt-3">
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
