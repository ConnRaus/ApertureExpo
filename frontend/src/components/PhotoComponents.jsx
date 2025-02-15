import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import formStyles from "../styles/components/Form.module.css";

const API_URL = "http://localhost:3000";

export function PhotoCard({
  photo,
  onDelete,
  isOwner,
  onClick,
  isEditing,
  onEdit,
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
            <Link
              to={`/users/${photo.userId}`}
              onClick={(e) => e.stopPropagation()}
              className="user-link"
            >
              View Profile
            </Link>
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
  const [selectedPhoto, setSelectedPhoto] = useState(null);
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

  return (
    <div className="photo-gallery">
      <div className="photo-grid">
        {photos.length === 0 ? (
          <p>No photos uploaded yet.</p>
        ) : (
          photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={handleDelete}
              isOwner={photo.userId === user?.id}
              onClick={setSelectedPhoto}
              isEditing={isEditing}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
      <Lightbox
        open={selectedPhoto !== null}
        close={() => setSelectedPhoto(null)}
        slides={[{ src: selectedPhoto?.s3Url }]}
      />
    </div>
  );
}

export function PublicUserGallery({ userId, isOwner }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const { getToken } = useAuth();

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
        body: JSON.stringify({ nickname, bio }),
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

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="public-user-gallery">
      <div className="profile-header">
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
                placeholder="Enter bio"
                className={formStyles.textarea}
              />
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
              <h2>{profile?.nickname || `User ${userId}`}'s Photos</h2>
              {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            </>
          )}
        </div>
        {isOwner && !isEditing && (
          <button
            className={`${formStyles.button} ${formStyles.primaryButton}`}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
      <div className="photo-grid">
        {photos.length === 0 ? (
          <p>No photos uploaded yet.</p>
        ) : (
          photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isOwner={isOwner}
              onClick={setSelectedPhoto}
              isEditing={isOwner}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
      <Lightbox
        open={selectedPhoto !== null}
        close={() => setSelectedPhoto(null)}
        slides={[{ src: selectedPhoto?.s3Url }]}
      />
    </div>
  );
}
