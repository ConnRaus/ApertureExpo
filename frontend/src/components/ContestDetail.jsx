import React, { useState } from "react";
import { Link } from "react-router-dom";
import PhotoUploadForm from "./PhotoUploadForm";
import PhotoCard from "./PhotoCard";

const ContestDetail = ({ contest, formatDate }) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [photos, setPhotos] = useState([]);

  const handlePhotoUploaded = (photo) => {
    setPhotos([...photos, photo]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 mb-8 transition-colors duration-200 ease-in-out group"
      >
        <span className="transform group-hover:-translate-x-1 transition-transform duration-200">
          ←
        </span>
        <span>Back to Events</span>
      </Link>

      <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold mb-6 text-white">{contest.title}</h2>

        <div className="bg-gray-700/50 rounded-lg p-6 mb-8 border-l-4 border-indigo-500">
          <p className="text-gray-300 text-lg leading-relaxed">
            {contest.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-700/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <p className="flex items-center gap-3">
              <span className="text-sm uppercase tracking-wider text-indigo-400 font-medium">
                Status
              </span>
              <span className="px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 font-medium text-sm border border-green-500/20">
                {contest.status}
              </span>
            </p>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <p className="flex items-center gap-3">
              <span className="text-sm uppercase tracking-wider text-indigo-400 font-medium">
                Dates
              </span>
              <span className="text-gray-300 font-medium">
                {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="group relative w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-4 px-6 rounded-lg shadow-lg transition-all duration-300 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="transform group-hover:scale-105 transition-transform duration-200">
              Submit Photo
            </span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </span>
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border border-gray-700/50">
          <PhotoUploadForm
            contestId={contest.id}
            onPhotoUploaded={handlePhotoUploaded}
          />
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-4">
          <span>Submissions</span>
          <span className="text-sm px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
            {photos.length} photos
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContestDetail;
