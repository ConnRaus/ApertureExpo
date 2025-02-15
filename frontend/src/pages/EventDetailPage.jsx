import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ContestDetail } from "../components/ContestComponents";

function EventDetailPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { contestId } = useParams();

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
