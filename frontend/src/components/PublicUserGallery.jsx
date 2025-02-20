import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoLightbox } from "./PhotoLightbox";
import { EditProfileModal } from "./EditProfileModal";
import { PhotoSelector } from "./PhotoSelector";
import { ProfileHeader } from "./ProfileHeader";
import { UserService, PhotoService } from "../services/api";
import "../styles/loading.css";

export function PublicUserGallery({ userId, isOwner }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { getToken } = useAuth();

  const userService = new UserService(getToken);
  const photoService = new PhotoService(getToken);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const data = await userService.fetchUserProfile(userId);
      setPhotos(data.photos || []);
      setProfile(data.profile);
      setNickname(data.profile.nickname || "");
      setBio(data.profile.bio || "");
      setBannerImage(data.profile.bannerImage || "");
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      await photoService.deletePhoto(photoId);
      setPhotos((prevPhotos) => prevPhotos.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  const handleEdit = (updatedPhoto) => {
    setPhotos(photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
  };

  const handleProfileUpdate = async () => {
    try {
      const updatedProfile = await userService.updateProfile(userId, {
        nickname,
        bio,
        bannerImage,
      });
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handlePhotoSelect = async (photo) => {
    try {
      const updatedProfile = await userService.updateProfile(userId, {
        nickname,
        bio,
        bannerImage: photo.s3Url,
      });
      setBannerImage(updatedProfile.bannerImage);
      setShowPhotoSelector(false);
    } catch (error) {
      console.error("Error handling photo selection:", error);
      alert("Failed to update banner image. Please try again.");
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append("banner", file);

      const data = await userService.uploadBanner(userId, formData);
      setBannerImage(data.bannerImage);
    } catch (error) {
      console.error("Error uploading banner:", error);
      alert("Failed to upload banner image. Please try again.");
    } finally {
      setUploadingBanner(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-skeleton">
          <div className="banner-skeleton"></div>
          {/* Photo grid skeleton - matching PhotoGrid's responsive layout */}
          <div className="photo-grid mt-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="photo-card-skeleton">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <div className="banner-skeleton h-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-user-gallery">
      <ProfileHeader
        profile={profile}
        userId={userId}
        bannerImage={bannerImage}
        photosCount={photos.length}
        isOwner={isOwner}
        onEditClick={() => setIsEditing(true)}
      />

      <PhotoGrid
        photos={photos}
        isOwner={isOwner}
        isEditing={isOwner && isEditing}
        onPhotoClick={setSelectedPhotoIndex}
        onDelete={handleDelete}
        onEdit={handleEdit}
        hideProfileLink={true}
      />

      <EditProfileModal
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        nickname={nickname}
        setNickname={setNickname}
        bio={bio}
        setBio={setBio}
        bannerImage={bannerImage}
        setBannerImage={setBannerImage}
        uploadingBanner={uploadingBanner}
        handleBannerUpload={handleBannerUpload}
        setShowPhotoSelector={setShowPhotoSelector}
        handleProfileUpdate={handleProfileUpdate}
      />

      <PhotoLightbox
        photos={photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
      />

      <PhotoSelector
        isOpen={showPhotoSelector}
        onClose={() => setShowPhotoSelector(false)}
        onSelect={handlePhotoSelect}
      />
    </div>
  );
}
