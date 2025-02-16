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

  const handlePhotoSelect = (photo) => {
    setBannerImage(photo.s3Url);
    setShowPhotoSelector(false);
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
          <div className="profile-banner-overlay" />
        </div>
        <div className="profile-content">
          <div className="profile-info">
            {isEditing ? (
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  className={formStyles.input}
                />
                <label className={formStyles.label}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  className={formStyles.textarea}
                />
                <label className={formStyles.label}>Banner Image</label>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="Enter banner image URL"
                    className={`${formStyles.input} flex-1`}
                  />
                  <button
                    onClick={() => setShowPhotoSelector(true)}
                    className={`${formStyles.button} ${formStyles.secondaryButton} whitespace-nowrap`}
                  >
                    Choose Photo
                  </button>
                </div>
                <div className={formStyles.editButtons}>
                  <button
                    onClick={handleProfileUpdate}
                    className={`${formStyles.button} ${formStyles.primaryButton}`}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`${formStyles.button} ${formStyles.secondaryButton}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="profile-name">
                  {profile?.nickname || `User ${userId}`}
                </h1>
                {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
                <div className="profile-stats">
                  <span>{photos.length} Photos</span>
                </div>
              </>
            )}
          </div>
          {isOwner && !isEditing && (
            <button
              className="edit-profile-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
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
