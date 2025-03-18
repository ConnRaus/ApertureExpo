import React from "react";
import { useParams } from "react-router-dom";
import { PublicUserGallery } from "../components/photos/PhotoComponents";
import { useUser } from "@clerk/clerk-react";

function UserProfilePage() {
  const { userId } = useParams();
  const { user } = useUser();

  return (
    <div className="user-profile-page">
      <PublicUserGallery userId={userId} isOwner={userId === user?.id} />
    </div>
  );
}

export default UserProfilePage;
