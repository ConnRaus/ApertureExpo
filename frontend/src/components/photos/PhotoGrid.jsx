import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { PhotoVoteButton } from "../contests/PhotoVoteButton";
import { PhotoGridConfigs } from "./PhotoGridConfigs";

function PhotoGridItem({
  photo,
  config,
  onClick,
  onDelete,
  isOwner,
  contestId,
  contestPhase,
  voteUpdateTrigger,
  style,
}) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
  };

  return (
    <div className="unified-photo-item group cursor-pointer" style={style}>
      <div
        className="photo-container relative overflow-hidden"
        onClick={() => onClick && onClick()}
      >
        <img
          src={photo.thumbnailUrl || photo.s3Url}
          alt={photo.title || "Photo"}
          onError={handleImageError}
          className={`photo-image w-full object-cover transition-transform duration-500 ${
            config.enableHoverEffects ? "group-hover:scale-105" : ""
          }`}
          loading="lazy"
        />

        {/* Delete button for owner */}
        {config.showDeleteButton && isOwner && (
          <button
            className="absolute top-3 right-3 w-8 h-8 opacity-0 group-hover:opacity-100 bg-red-600/80 text-white rounded-full flex items-center justify-center transition-all hover:bg-red-600 hover:scale-110 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(photo.id);
            }}
            aria-label="Delete photo"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 via-gray-900/70 to-transparent p-3 text-white">
          {/* Title */}
          {config.showTitle && photo.title && (
            <h3 className="text-sm font-semibold mb-1 leading-tight">
              {photo.title}
            </h3>
          )}

          {/* Description */}
          {config.showDescription && photo.description && (
            <p className="text-xs text-gray-200 line-clamp-2 mb-2 opacity-90">
              {photo.description}
            </p>
          )}

          {/* Author and rating info for contest results */}
          {config.showAuthor && photo.User && contestPhase === "ended" && (
            <div className="mb-2">
              <div className="text-xs text-gray-300 mb-1">
                by{" "}
                {config.showProfileLink ? (
                  <Link
                    to={`/users/${photo.userId}`}
                    className="text-indigo-300 hover:text-indigo-200 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {photo.User.nickname || "Unknown"}
                  </Link>
                ) : (
                  <span className="text-gray-300">
                    {photo.User.nickname || "Unknown"}
                  </span>
                )}
              </div>
              {config.showRating && (
                <div className="text-xs text-yellow-400">
                  {photo.averageRating ? photo.averageRating.toFixed(1) : "0.0"}
                  /5 ⭐ ({photo.voteCount || 0} vote
                  {photo.voteCount !== 1 ? "s" : ""})
                </div>
              )}
            </div>
          )}

          {/* Author info for non-contest contexts or submission phase */}
          {config.showAuthor &&
            photo.User &&
            (contestPhase === "submission" || !contestPhase) && (
              <div className="text-xs text-gray-300 mb-1">
                by{" "}
                {config.showProfileLink ? (
                  <Link
                    to={`/users/${photo.userId}`}
                    className="text-indigo-300 hover:text-indigo-200 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {photo.User.nickname || "Unknown"}
                  </Link>
                ) : (
                  <span>{photo.User.nickname || "Unknown"}</span>
                )}
              </div>
            )}

          {/* Voting controls */}
          {config.showVoting && contestId && contestPhase === "voting" && (
            <div
              className="flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <PhotoVoteButton
                photo={photo}
                contestId={contestId}
                contestPhase={contestPhase}
                showStars={true}
                key={`${photo.id}-${voteUpdateTrigger}`}
              />
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-gray-300 mt-2">
            {config.showProfileLink && !config.showAuthor && (
              <Link
                to={`/users/${photo.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                View Profile
              </Link>
            )}
            {config.showDate && photo.createdAt && (
              <span className="text-gray-400">
                {new Date(photo.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to calculate justified rows for horizontal masonry
function calculateJustifiedRows(photos, containerWidth, targetHeight, gap) {
  const rows = [];
  let currentRow = [];
  let currentRowWidth = 0;

  // Check if we're likely in single-column mode (narrow screen)
  const minPhotoWidth = targetHeight * 0.5; // Minimum reasonable width
  const isSingleColumnMode = containerWidth < minPhotoWidth * 2 + gap;

  // Maximum height constraint to prevent vertical photos from becoming huge
  const maxHeight = Math.min(targetHeight * 1.5, window.innerHeight * 0.6);

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    // Calculate aspect ratio (default to 1.5 if not available)
    const aspectRatio =
      photo.metadata?.width && photo.metadata?.height
        ? photo.metadata.width / photo.metadata.height
        : 1.5; // Default aspect ratio

    const photoWidth = targetHeight * aspectRatio;

    // In single column mode, each photo gets its own row and fills full width
    if (isSingleColumnMode) {
      // Calculate height based on container width and aspect ratio
      let adjustedHeight = containerWidth / aspectRatio;

      // Apply maximum height constraint
      adjustedHeight = Math.min(adjustedHeight, maxHeight);

      rows.push({
        photos: [photo],
        height: adjustedHeight,
        scale: containerWidth / photoWidth, // Always scale to full width
        isSingleColumn: true,
        isHeightConstrained: adjustedHeight === maxHeight,
      });
      continue;
    }

    // Check if adding this photo would exceed container width
    const totalGaps = currentRow.length * gap;
    if (
      currentRow.length > 0 &&
      currentRowWidth + photoWidth + totalGaps > containerWidth
    ) {
      // Finalize current row and calculate scaling to fill full width
      const totalUsedWidth = currentRowWidth + (currentRow.length - 1) * gap;
      const scale = containerWidth / totalUsedWidth;
      let adjustedHeight = targetHeight * scale;

      // Apply maximum height constraint but still fill full width
      if (adjustedHeight > maxHeight) {
        adjustedHeight = maxHeight;
        // Keep scale to fill full width, photos will be cropped via CSS
      }

      rows.push({
        photos: currentRow,
        height: adjustedHeight,
        scale: containerWidth / totalUsedWidth, // Always scale to fill full width
        isSingleColumn: false,
        isHeightConstrained: adjustedHeight === maxHeight,
      });

      // Start new row
      currentRow = [photo];
      currentRowWidth = photoWidth;
    } else {
      currentRow.push(photo);
      currentRowWidth += photoWidth;
    }
  }

  // Handle last row (only applies to multi-column mode)
  if (currentRow.length > 0 && !isSingleColumnMode) {
    const totalUsedWidth = currentRowWidth + (currentRow.length - 1) * gap;

    // Always scale to fill full width
    const scale = containerWidth / totalUsedWidth;
    let adjustedHeight = targetHeight * scale;

    // Apply maximum height constraint but still fill full width
    if (adjustedHeight > maxHeight) {
      adjustedHeight = maxHeight;
      // Keep scale to fill full width, photos will be cropped via CSS
    }

    rows.push({
      photos: currentRow,
      height: adjustedHeight,
      scale: containerWidth / totalUsedWidth, // Always scale to fill full width
      isSingleColumn: false,
      isHeightConstrained: adjustedHeight === maxHeight,
    });
  }

  return rows;
}

export function PhotoGrid({
  photos = [],
  config = PhotoGridConfigs.userProfile,
  isOwner = false,
  onClick,
  onDelete,
  contestId,
  contestPhase,
  voteUpdateTrigger = 0,
}) {
  const [processedPhotos, setProcessedPhotos] = useState([]);
  const [justifiedRows, setJustifiedRows] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!photos || photos.length === 0) {
      setProcessedPhotos([]);
      return;
    }

    // Process photos for contest phases if needed
    let processed = [...photos];
    if (contestPhase === "ended" && processed[0]?.totalScore !== undefined) {
      // Add rank property for display
      let rank = 0;
      let lastScore = Infinity;
      let photosProcessedForRank = 0;
      processed = processed.map((photo) => {
        photosProcessedForRank++;
        const currentScore = photo.totalScore ?? -Infinity;
        if (currentScore < lastScore) {
          rank = photosProcessedForRank;
        } else if (lastScore === -Infinity) {
          rank = 1;
        }
        lastScore = currentScore;
        return { ...photo, rank };
      });
    }
    setProcessedPhotos(processed);
  }, [photos, contestPhase]);

  // Calculate justified layout
  useEffect(() => {
    if (!processedPhotos.length || !containerRef.current) return;

    const updateLayout = () => {
      const containerWidth = containerRef.current.offsetWidth;
      const targetHeight =
        window.innerWidth >= 1536
          ? 300
          : window.innerWidth >= 1280
          ? 280
          : window.innerWidth >= 1024
          ? 260
          : window.innerWidth >= 768
          ? 240
          : window.innerWidth >= 640
          ? 220
          : 200;
      const gap =
        window.innerWidth >= 768 ? 8 : window.innerWidth >= 640 ? 6 : 4;

      const rows = calculateJustifiedRows(
        processedPhotos,
        containerWidth,
        targetHeight,
        gap
      );
      setJustifiedRows(rows);
    };

    updateLayout();

    const handleResize = () => updateLayout();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [processedPhotos]);

  if (processedPhotos.length === 0) {
    return (
      <p className="text-gray-400 text-center py-8">No photos to display.</p>
    );
  }

  return (
    <div className="unified-photo-grid-justified" ref={containerRef}>
      {justifiedRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="justified-row"
          style={{
            marginBottom: "4px",
            justifyContent: "flex-start", // Always start from left since we're filling full width
          }}
        >
          {row.photos.map((photo, photoIndex) => {
            const originalIndex = processedPhotos.findIndex(
              (p) => p.id === photo.id
            );
            const aspectRatio =
              photo.metadata?.width && photo.metadata?.height
                ? photo.metadata.width / photo.metadata.height
                : 1.5;

            // Calculate width to always fill the row completely
            let width;
            const currentContainerWidth =
              containerRef.current?.offsetWidth || 800;

            if (row.isSingleColumn) {
              // Single column always fills full width
              width = currentContainerWidth;
            } else {
              // Multi-column: calculate proportional width to fill full row
              const totalBaseWidth = row.photos.reduce((sum, p) => {
                const ar =
                  p.metadata?.width && p.metadata?.height
                    ? p.metadata.width / p.metadata.height
                    : 1.5;
                return sum + row.height * ar;
              }, 0);

              const availableWidth =
                currentContainerWidth - (row.photos.length - 1) * 4;
              const baseWidth = row.height * aspectRatio;
              width = (baseWidth / totalBaseWidth) * availableWidth;
            }

            return (
              <PhotoGridItem
                key={photo.id}
                photo={photo}
                config={config}
                onClick={() => onClick && onClick(originalIndex)}
                onDelete={onDelete}
                isOwner={isOwner}
                contestId={contestId}
                contestPhase={contestPhase}
                voteUpdateTrigger={voteUpdateTrigger}
                style={{
                  width: row.isSingleColumn ? "100%" : `${width}px`,
                  height: `${row.height}px`,
                  marginRight: photoIndex < row.photos.length - 1 ? "4px" : "0",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
