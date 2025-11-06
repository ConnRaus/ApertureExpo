import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PhotoGrid,
  PhotoGridConfigs,
  Lightbox,
  LightboxConfigs,
} from "./PhotoComponents";
import { EditProfileModal } from "../user/EditProfileModal";
import { PhotoLibraryPicker } from "./PhotoLibraryPicker";
import { ProfileHeader } from "../user/ProfileHeader";
import { XPDashboard } from "../user/XPDisplay";
import { Pagination } from "../common/Pagination";
import {
  usePhotoService,
  useUserService,
  useDelayedLoading,
} from "../../hooks";
import { LoadingSpinner } from "../common/CommonComponents";

export function PublicUserGallery({ userId, isOwner }) {
  // Get page from URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const photoIdFromUrl = searchParams.get("photoId");

  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState(null);
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
  const [showPhotoLibraryPicker, setShowPhotoLibraryPicker] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const shouldShowLoading = useDelayedLoading(isLoading);
  const userService = useUserService();
  const photoService = usePhotoService();

  useEffect(() => {
    fetchUserProfile(currentPage);
  }, [userId, currentPage]);

  // Handle opening a specific photo from URL parameter
  useEffect(() => {
    const handlePhotoFromUrl = async () => {
      if (photoIdFromUrl && photos.length > 0) {
        const photoIndex = photos.findIndex((photo) => photo.id === photoIdFromUrl);
        
        if (photoIndex !== -1) {
          // Photo is on current page, open it
          setSelectedPhotoIndex(photoIndex);
        } else {
          // Photo might be on another page, try to fetch it
          try {
            const photo = await photoService.fetchPhotoById(photoIdFromUrl);
            if (photo && photo.userId === userId) {
              // Add the photo temporarily to the beginning of the array
              setPhotos((prevPhotos) => [photo, ...prevPhotos]);
              setSelectedPhotoIndex(0);
            }
          } catch (error) {
            console.error("Error fetching specific photo:", error);
            // Photo not found or not accessible, just ignore
          }
        }
        
        // Remove the photoId from URL after attempting to open
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("photoId");
        setSearchParams(newSearchParams, { replace: true });
      }
    };

    handlePhotoFromUrl();
  }, [photoIdFromUrl, photos]);

  useEffect(() => {
    return () => {
      if (tempBannerImage && tempBannerImage.startsWith("blob:")) {
        URL.revokeObjectURL(tempBannerImage);
      }
    };
  }, [tempBannerImage]);

  const fetchUserProfile = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await userService.fetchUserProfile(userId, page);
      setPhotos(data.photos || []);
      setPagination(data.pagination || null);
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
      // First, handle banner upload if there's a new file
      if (bannerFileToUpload) {
        setUploadingBanner(true);

        // Create form data for the file upload
        const formData = new FormData();
        formData.append("banner", bannerFileToUpload);

        // Upload the banner file to S3
        const uploadResponse = await userService.uploadBanner(userId, formData);

        if (!uploadResponse.bannerImage) {
          throw new Error("Failed to upload banner image - no URL returned");
        }

        // Use the returned banner URL from the upload for the profile update
        const profileUpdateData = {
          nickname,
          bio,
          bannerImage: uploadResponse.bannerImage,
        };

        // Update the profile with the new banner URL
        const updatedProfile = await userService.updateProfile(
          userId,
          profileUpdateData
        );

        // Update the state with the new profile data
        setProfile(updatedProfile);
        setBannerImage(updatedProfile.bannerImage || "");
        setTempBannerImage("");
        setBannerFileToUpload(null);
      }
      // If using an existing photo (not a file upload)
      else if (tempBannerImage && !tempBannerImage.startsWith("blob:")) {
        const profileUpdateData = {
          nickname,
          bio,
          bannerImage: tempBannerImage,
        };

        // Update the profile with the selected photo URL
        const updatedProfile = await userService.updateProfile(
          userId,
          profileUpdateData
        );

        // Update the state with the new profile data
        setProfile(updatedProfile);
        setBannerImage(updatedProfile.bannerImage || "");
        setTempBannerImage("");
      }
      // Just updating profile info without changing the banner
      else {
        const profileUpdateData = {
          nickname,
          bio,
          bannerImage: bannerImage || "",
        };

        // Update just the profile info
        const updatedProfile = await userService.updateProfile(
          userId,
          profileUpdateData
        );

        // Update the state with the new profile data
        setProfile(updatedProfile);
        setBannerImage(updatedProfile.bannerImage || "");
      }

      // Clean up the blob URL if it exists
      if (tempBannerImage && tempBannerImage.startsWith("blob:")) {
        URL.revokeObjectURL(tempBannerImage);
      }

      setIsEditing(false);

      // Force a reload of the user profile after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile: " + (error.message || "Unknown error"));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handlePhotoSelect = (photo) => {
    setTempBannerImage(photo.s3Url);
    setShowPhotoLibraryPicker(false);
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

  // Handle page change
  const handlePageChange = (page) => {
    setSearchParams({ page: page.toString() });
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (shouldShowLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" message="Loading user profile..." />
      </div>
    );
  }

  if (isLoading) {
    return <div></div>;
  }

  const photosCount = pagination?.totalPhotos || photos.length;

  return (
    <div className="public-user-gallery">
      <ProfileHeader
        profile={profile}
        userId={userId}
        bannerImage={bannerImage}
        photosCount={photosCount}
        isOwner={isOwner}
        onEditClick={() => setIsEditing(true)}
      />

      <PhotoGrid
        photos={photos}
        config={
          isOwner
            ? PhotoGridConfigs.userProfile
            : PhotoGridConfigs.publicProfile
        }
        isOwner={isOwner}
        onClick={setSelectedPhotoIndex}
        onDelete={handleDelete}
      />

      {/* Show pagination if pagination data is available */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

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
        setShowPhotoLibraryPicker={setShowPhotoLibraryPicker}
        handleProfileUpdate={handleProfileUpdate}
        profile={profile}
      />

      <Lightbox
        photos={photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(-1)}
        config={
          isOwner ? LightboxConfigs.userProfile : LightboxConfigs.publicProfile
        }
        onPhotoUpdate={isOwner ? handleEdit : null}
      />

      <PhotoLibraryPicker
        isOpen={showPhotoLibraryPicker}
        onClose={() => setShowPhotoLibraryPicker(false)}
        onSelect={handlePhotoSelect}
      />
    </div>
  );
}
