import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import { PhotoCard } from "./PhotoCard";
import { EditProfileModal } from "./EditProfileModal";
import { PhotoSelector } from "./PhotoSelector";
import { UserService, PhotoService } from "../services/api";

export function PublicUserGallery({ userId, isOwner }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { getToken } = useAuth();
  const defaultBanner = "https://i.redd.it/jlpv3gf20c291.png";

  const userService = new UserService(getToken);
  const photoService = new PhotoService(getToken);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
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

  const lightboxSlides = photos.map((photo) => ({
    src: photo.s3Url,
    title: photo.title,
    description: photo.description,
  }));

  return (
    <div className="public-user-gallery">
      <div className="profile-header-container">
        <div
          className="profile-banner"
          style={{
            backgroundImage: `url(${bannerImage || defaultBanner})`,
          }}
        >
          {isOwner && (
            <button
              className="edit-profile-button"
              onClick={() => setIsEditing(true)}
            >
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
              <span>{photos.length} Photos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="photo-grid">
        {photos.length === 0 ? (
          <p>No photos uploaded yet.</p>
        ) : (
          photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isOwner={isOwner}
              onClick={() => setSelectedPhotoIndex(index)}
              isEditing={isOwner && isEditing}
              onDelete={handleDelete}
              onEdit={handleEdit}
              hideProfileLink={true}
            />
          ))
        )}
      </div>

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

      <Lightbox
        open={selectedPhotoIndex >= 0}
        close={() => setSelectedPhotoIndex(-1)}
        index={selectedPhotoIndex}
        slides={lightboxSlides}
        plugins={[Thumbnails, Zoom, Counter]}
        carousel={{
          finite: false,
          preload: 3,
          padding: "16px",
        }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
      />

      <PhotoSelector
        isOpen={showPhotoSelector}
        onClose={() => setShowPhotoSelector(false)}
        onSelect={handlePhotoSelect}
      />
    </div>
  );
}
