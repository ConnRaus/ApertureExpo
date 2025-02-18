import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import formStyles from "../styles/components/Form.module.css";
import { PhotoSelector } from "./PhotoSelector";

const API_URL = import.meta.env.VITE_API_URL;

export function PhotoCard({
  photo,
  onDelete,
  isOwner,
  onClick,
  isEditing,
  onEdit,
  hideProfileLink = false,
}) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [title, setTitle] = useState(photo.title);
  const [description, setDescription] = useState(photo.description || "");
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const handleImageError = (e) => {
    console.error("Image failed to load:", photo.s3Url);
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  const handleEdit = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/photos/${photo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) throw new Error("Failed to update photo");

      const updatedPhoto = await response.json();
      if (onEdit) {
        onEdit(updatedPhoto);
      }
      setIsEditingDetails(false);
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Failed to update photo details");
    }
  };

  return (
    <div className="photo-card">
      {isOwner && isEditing && (
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo.id);
          }}
          title="Delete photo"
        >
          ×
        </button>
      )}
      <div
        className="photo-image"
        onClick={() => !isEditingDetails && onClick(photo)}
      >
        <img src={photo.s3Url} alt={photo.title} onError={handleImageError} />
      </div>
      <div className="photo-info">
        {isEditingDetails && isEditing ? (
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={formStyles.input}
            />
            <label className={formStyles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={formStyles.textarea}
            />
            <div className={formStyles.editButtons}>
              <button
                onClick={handleEdit}
                className={`${formStyles.button} ${formStyles.primaryButton}`}
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingDetails(false)}
                className={`${formStyles.button} ${formStyles.secondaryButton}`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3>{photo.title}</h3>
            {photo.description && <p>{photo.description}</p>}
            {!hideProfileLink && (
              <Link
                to={`/users/${photo.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="user-link"
              >
                View Profile
              </Link>
            )}
            {photo.createdAt && (
              <p className="upload-date">
                Uploaded {new Date(photo.createdAt).toLocaleDateString()}
              </p>
            )}
            {isOwner && isEditing && (
              <button
                className={`${formStyles.button} ${formStyles.primaryButton} mt-4`}
                onClick={() => setIsEditingDetails(true)}
              >
                Edit Details
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function UserPhotoGallery({ isEditing }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch photos");
      const data = await response.json();
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setError("Failed to load photos");
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete photo");
      setPhotos((prevPhotos) => prevPhotos.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  const handleEdit = (updatedPhoto) => {
    setPhotos(photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
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
    <div className="photo-gallery">
      <div className="photo-grid">
        {photos.length === 0 ? (
          <p>No photos uploaded yet.</p>
        ) : (
          photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={handleDelete}
              isOwner={photo.userId === user?.id}
              onClick={() => setSelectedPhotoIndex(index)}
              isEditing={isEditing}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
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
        render={{
          buttonPrev: photos.length <= 1 ? () => null : undefined,
          buttonNext: photos.length <= 1 ? () => null : undefined,
        }}
      />
    </div>
  );
}

const EditProfileModal = ({
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
}) => {
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
};

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

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user profile");
      const data = await response.json();
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
      const token = await getToken();
      const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete photo");
      setPhotos((prevPhotos) => prevPhotos.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname, bio, bannerImage }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleEdit = (updatedPhoto) => {
    setPhotos(photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
  };

  const handlePhotoSelect = async (photo) => {
    try {
      const token = await getToken();
      // Update the profile with the new banner image
      const response = await fetch(`${API_URL}/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          bio,
          bannerImage: photo.s3Url,
        }),
      });

      if (!response.ok) throw new Error("Failed to update banner image");

      const updatedProfile = await response.json();
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

      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${userId}/banner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload banner image");

      const data = await response.json();
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
