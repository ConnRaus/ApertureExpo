import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { UserPhotoGallery } from "../components/PhotoComponents";

function ProfilePage() {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <button
          className={`edit-toggle ${isEditing ? "active" : ""}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Done Editing" : "Edit Photos"}
        </button>
      </div>
      <UserPhotoGallery isEditing={isEditing} />
    </div>
  );
}

export default ProfilePage;
