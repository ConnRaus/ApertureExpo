import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoLightbox } from "./PhotoLightbox";
import { EditProfileModal } from "./EditProfileModal";
import { PhotoSelector } from "./PhotoSelector";
import { ProfileHeader } from "./ProfileHeader";
import { usePhotoService, useUserService, useDelayedLoading } from "../hooks";
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
  const [tempBannerImage, setTempBannerImage] = useState("");
  const [bannerFileToUpload, setBannerFileToUpload] = useState(null);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { getToken } = useAuth();

  const shouldShowLoading = useDelayedLoading(isLoading);
  const userService = useUserService();
  const photoService = usePhotoService();

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (tempBannerImage && tempBannerImage.startsWith("blob:")) {
        URL.revokeObjectURL(tempBannerImage);
      }
    };
  }, [tempBannerImage]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const data = await userService.fetchUserProfile(userId);
      setPhotos(data.photos || []);
      setProfile(data.profile);
      setNickname(data.profile.nickname || "");
      setBio(data.profile.bio || "");
      setBannerImage(data.profile.bannerImage || "");
      setTempBannerImage("");
      setBannerFileToUpload(null);
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
      let finalBannerImage = bannerImage;

      if (bannerFileToUpload) {
        setUploadingBanner(true);
        const formData = new FormData();
        formData.append("banner", bannerFileToUpload);

        const data = await userService.uploadBanner(userId, formData);
        finalBannerImage = data.bannerImage;
        setBannerFileToUpload(null);
      }

      const updatedProfile = await userService.updateProfile(userId, {
        nickname,
        bio,
        bannerImage: finalBannerImage,
      });

      if (tempBannerImage && tempBannerImage.startsWith("blob:")) {
        URL.revokeObjectURL(tempBannerImage);
      }

      setProfile(updatedProfile);
      setBannerImage(updatedProfile.bannerImage);
      setTempBannerImage("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handlePhotoSelect = (photo) => {
    setTempBannerImage(photo.s3Url);
    setShowPhotoSelector(false);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (tempBannerImage && tempBannerImage.startsWith("blob:")) {
      URL.revokeObjectURL(tempBannerImage);
    }

    setBannerFileToUpload(file);

    const tempUrl = URL.createObjectURL(file);
    setTempBannerImage(tempUrl);
  };

  const handleCancelEdit = () => {
    if (tempBannerImage && tempBannerImage.startsWith("blob:")) {
      URL.revokeObjectURL(tempBannerImage);
    }

    setTempBannerImage("");
    setBannerFileToUpload(null);
    setIsEditing(false);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (shouldShowLoading) {
    return (
      <div className="loading-container">
        <div className="loading-skeleton">
          <div className="banner-skeleton"></div>
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

  if (isLoading) {
    return <div className="loading-container"></div>;
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
        setIsEditing={handleCancelEdit}
        nickname={nickname}
        setNickname={setNickname}
        bio={bio}
        setBio={setBio}
        bannerImage={tempBannerImage || bannerImage}
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
