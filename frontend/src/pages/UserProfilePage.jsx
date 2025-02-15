import React from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { PublicUserGallery } from "../components/PhotoComponents";

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
