import React, { useState } from "react";

const REPORT_REASONS = [
  { value: "off_topic", label: "Off Topic" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "spam", label: "Spam" },
  { value: "copyright", label: "Copyright Violation" },
  { value: "other", label: "Custom" },
];

export function ReportModal({ isOpen, onClose, onReport, photoId, contestId }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedReason) {
      setError("Please select a reason for reporting");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      setError("Please provide a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReport(photoId, selectedReason, customReason, contestId);
      // Reset form
      setSelectedReason("");
      setCustomReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason("");
      setCustomReason("");
      setError(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{ touchAction: "manipulation" }}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{ touchAction: "manipulation" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Report Photo</h2>
          <button
            onClick={handleClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
            style={{ touchAction: "manipulation" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-300 text-sm mb-6">
          Please select a reason for reporting this photo. Our team will review
          your report.
        </p>

        <form
          onSubmit={handleSubmit}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{ touchAction: "manipulation" }}
        >
          <div className="space-y-3 mb-4">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center p-3 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer transition-colors"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{ touchAction: "manipulation" }}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReason(reason.value);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    // Explicitly set state on touch for mobile compatibility
                    if (!isSubmitting) {
                      setSelectedReason(reason.value);
                    }
                  }}
                  disabled={isSubmitting}
                  className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  style={{ touchAction: "manipulation" }}
                />
                <span className="text-white">{reason.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === "other" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Please provide details:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                disabled={isSubmitting}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Describe the issue..."
                maxLength={500}
                style={{ touchAction: "manipulation" }}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {customReason.length}/500
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ touchAction: "manipulation" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
              disabled={isSubmitting || !selectedReason}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ touchAction: "manipulation" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

