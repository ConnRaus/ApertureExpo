import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ContestDetail } from "../components/contests/ContestComponents";

function EventDetailPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { slugAndId } = useParams();

  // Extract the UUID from the slugAndId using regex to find the UUID pattern at the end
  const uuidMatch = slugAndId.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  const contestId = uuidMatch ? uuidMatch[0] : slugAndId;

  return (
    <div className="event-detail-page">
      <ContestDetail
        contestId={contestId}
        showUploadForm={showUploadForm}
        setShowUploadForm={setShowUploadForm}
      />
    </div>
  );
}

export default EventDetailPage;
