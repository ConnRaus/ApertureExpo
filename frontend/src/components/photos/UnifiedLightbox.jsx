import React, { useState, useCallback, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { Link } from "react-router-dom";

export function UnifiedLightbox({
  photos = [],
  selectedIndex = -1,
  onClose,
  config = {},
}) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousIndex, setPreviousIndex] = useState(-1);

  // Configuration options with defaults
  const {
    showTitle = true,
    showAuthor = true,
    showDescription = true,
    showRating = false,
    showVotes = false,
    showMetadata = false,
    showComments = false,
    showInfoButton = true,
    enableNavigation = true,
    enableKeyboardControls = true,
    enableSwipeControls = true,
    enableZoom = false,
    showThumbnails = false,
    darkMode = true,
  } = config;

  const isOpen = selectedIndex >= 0 && photos.length > 0;
  const currentPhoto = photos[currentIndex] || null;
  const previousPhoto = photos[previousIndex] || null;

  // Handle opening animation and desktop default state
  useEffect(() => {
    if (isOpen) {
      // Reset image loaded state when opening
      setImageLoaded(false);
      setIsTransitioning(false);
      setSlideDirection(null);
      setPreviousIndex(-1);

      // Use a small timeout for more reliable cross-browser animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);

      // Open info sidebar by default on landscape/desktop if info button is enabled
      if (showInfoButton && window.innerHeight <= window.innerWidth) {
        setShowInfoSidebar(true);
      }

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setShowInfoSidebar(false);
      setImageLoaded(false);
      setIsTransitioning(false);
      setSlideDirection(null);
      setPreviousIndex(-1);
    }
  }, [isOpen, showInfoButton]);

  // Detect if we're in landscape/desktop mode (aspect ratio based)
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update current index when selectedIndex changes
  useEffect(() => {
    if (selectedIndex >= 0) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex]);

  // Navigation functions with slide animation
  const goToNext = useCallback(() => {
    if (photos.length > 1 && !isTransitioning) {
      setPreviousIndex(currentIndex);
      setSlideDirection("left");
      setIsTransitioning(true);
      setImageLoaded(false); // Reset for new image

      const nextIndex = (currentIndex + 1) % photos.length;
      setCurrentIndex(nextIndex);

      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection(null);
        setPreviousIndex(-1);
      }, 300);
    }
  }, [photos.length, currentIndex, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (photos.length > 1 && !isTransitioning) {
      setPreviousIndex(currentIndex);
      setSlideDirection("right");
      setIsTransitioning(true);
      setImageLoaded(false); // Reset for new image

      const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
      setCurrentIndex(prevIndex);

      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection(null);
        setPreviousIndex(-1);
      }, 300);
    }
  }, [photos.length, currentIndex, isTransitioning]);

  const closeLightbox = useCallback(() => {
    setIsVisible(false);
    setShowInfoSidebar(false);
    setImageLoaded(false);
    setIsTransitioning(false);
    setSlideDirection(null);
    setPreviousIndex(-1);
    // Delay the actual close to allow fade out animation
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Check if image is already loaded (for cached images)
  const checkImageLoaded = useCallback((imgElement) => {
    if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
      setImageLoaded(true);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen || !enableKeyboardControls) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToPrevious();
          break;
        case "Escape":
          event.preventDefault();
          closeLightbox();
          break;
        case "i":
        case "I":
          if (showInfoButton) {
            event.preventDefault();
            setShowInfoSidebar((prev) => !prev);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    enableKeyboardControls,
    goToNext,
    goToPrevious,
    closeLightbox,
    showInfoButton,
  ]);

  // Swipe controls
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => enableSwipeControls && goToNext(),
    onSwipedRight: () => enableSwipeControls && goToPrevious(),
    onSwipedUp: () =>
      enableSwipeControls && showInfoButton && setShowInfoSidebar(true),
    onSwipedDown: () => enableSwipeControls && setShowInfoSidebar(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
  });

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      // Standard scroll prevention
      document.body.style.overflow = "hidden";

      // Safari iOS specific scroll prevention
      const preventScroll = (e) => {
        e.preventDefault();
      };

      // Add passive: false to ensure preventDefault works
      document.addEventListener("touchmove", preventScroll, { passive: false });
      document.addEventListener("wheel", preventScroll, { passive: false });

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("touchmove", preventScroll);
        document.removeEventListener("wheel", preventScroll);
      };
    }
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={closeLightbox}
      {...swipeHandlers}
    >
      {/* Main Content Container */}
      <div
        className="relative w-full h-full flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 z-30 text-white/70 hover:text-white text-3xl font-light transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Close lightbox"
        >
          ×
        </button>

        {/* Info Button */}
        {showInfoButton && (
          <button
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className="absolute top-4 right-16 z-30 text-white/70 hover:text-white transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Toggle info"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Image Container - Responsive positioning */}
        <div
          className={`${
            showInfoSidebar && isLandscape ? "mr-80" : ""
          } transition-all duration-300`}
        >
          <div className="fixed inset-0 flex flex-col">
            {/* Image with Navigation Overlay - Responsive width adjustment */}
            <div
              className={`flex-1 flex items-center justify-center relative bg-black overflow-hidden transition-all duration-300 ${
                showInfoSidebar && isLandscape ? "mr-80" : ""
              }`}
            >
              {/* Navigation Buttons - positioned relative to image area */}
              {enableNavigation && photos.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className={`absolute left-4 z-20 text-white/70 hover:text-white text-4xl font-light transition-all duration-200 w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 ${
                      isTransitioning ? "opacity-50 pointer-events-none" : ""
                    } ${
                      showInfoSidebar && !isLandscape
                        ? "pointer-events-none"
                        : ""
                    }`}
                    aria-label="Previous image"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={goToNext}
                    className={`absolute right-4 z-20 text-white/70 hover:text-white text-4xl font-light transition-all duration-200 w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 ${
                      isTransitioning ? "opacity-50 pointer-events-none" : ""
                    } ${
                      showInfoSidebar && !isLandscape
                        ? "pointer-events-none"
                        : ""
                    }`}
                    aria-label="Next image"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  >
                    ›
                  </button>
                </>
              )}

              {/* Image Slider Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Previous Image (sliding out) */}
                {isTransitioning && previousPhoto && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out ${
                      slideDirection === "left"
                        ? "-translate-x-full"
                        : "translate-x-full"
                    }`}
                  >
                    <img
                      src={previousPhoto.s3Url || previousPhoto.thumbnailUrl}
                      alt={previousPhoto.title || "Photo"}
                      className="max-w-full max-h-full object-contain select-none"
                      draggable="false"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                )}

                {/* Current Image Container */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out ${
                    isTransitioning ? "translate-x-0" : "translate-x-0"
                  } ${
                    isTransitioning && slideDirection === "left"
                      ? "animate-slide-in-right"
                      : ""
                  } ${
                    isTransitioning && slideDirection === "right"
                      ? "animate-slide-in-left"
                      : ""
                  }`}
                  style={{
                    transform: isTransitioning
                      ? slideDirection === "left"
                        ? "translateX(0)"
                        : "translateX(0)"
                      : "translateX(0)",
                  }}
                >
                  {/* Loading State - Show thumbnail while main image loads */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={currentPhoto.thumbnailUrl}
                        alt={currentPhoto.title || "Photo"}
                        className="max-w-full max-h-full object-contain select-none opacity-50 blur-sm"
                        draggable="false"
                      />
                      {/* Loading spinner overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white/70"></div>
                      </div>
                    </div>
                  )}

                  {/* Main Image */}
                  <img
                    src={currentPhoto.s3Url || currentPhoto.thumbnailUrl}
                    alt={currentPhoto.title || "Photo"}
                    className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    onLoad={handleImageLoad}
                    onError={handleImageLoad}
                    ref={checkImageLoaded}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info Bar (Portrait/Mobile and when sidebar is closed) - Absolutely positioned */}
          {(showTitle || showAuthor || showDescription || showRating) &&
            !showInfoSidebar && (
              <div
                className={`${
                  isLandscape ? "hidden" : "block"
                } fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white z-20`}
              >
                {/* Swipe Up Indicator - Clickable - Improved spacing */}
                {showInfoButton && (
                  <div
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce cursor-pointer flex flex-col items-center"
                    onClick={() => setShowInfoSidebar(true)}
                  >
                    <svg
                      className="w-4 h-4 mb-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="text-xs text-center whitespace-nowrap">
                      More info
                    </div>
                  </div>
                )}

                <div className="pt-8 p-6">
                  {showTitle && currentPhoto.title && (
                    <h2 className="text-xl font-semibold mb-2">
                      {currentPhoto.title}
                    </h2>
                  )}

                  {showDescription && currentPhoto.description && (
                    <p className="text-gray-300 mb-3 text-sm leading-relaxed">
                      {currentPhoto.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col space-y-1">
                      {showAuthor && currentPhoto.User && (
                        <Link
                          to={`/users/${currentPhoto.userId}`}
                          className="text-blue-300 hover:text-blue-200 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          by {currentPhoto.User.nickname || "Unknown"}
                        </Link>
                      )}

                      {/* Contest Info for portrait/mobile */}
                      {currentPhoto.contestTitle && (
                        <Link
                          to={`/events/${encodeURIComponent(
                            currentPhoto.contestTitle
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/-+/g, "-")
                              .replace(/^-|-$/g, "")
                          )}-${currentPhoto.contestId}`}
                          className="text-purple-300 hover:text-purple-200 transition-colors text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {currentPhoto.contestTitle}
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      {currentPhoto.rank && (
                        <div className="text-yellow-400 text-xs">
                          {currentPhoto.rank === 1 && "🥇"}
                          {currentPhoto.rank === 2 && "🥈"}
                          {currentPhoto.rank === 3 && "🥉"}
                          {currentPhoto.rank > 3 && `#${currentPhoto.rank}`}
                        </div>
                      )}

                      {showRating &&
                        (currentPhoto.averageRating ||
                          currentPhoto.totalScore) && (
                          <div className="text-yellow-300">
                            ⭐{" "}
                            {(
                              currentPhoto.averageRating ||
                              currentPhoto.totalScore /
                                (currentPhoto.voteCount || 1)
                            ).toFixed(1)}
                            /5
                          </div>
                        )}

                      {showVotes && currentPhoto.voteCount && (
                        <div className="text-gray-400">
                          {currentPhoto.voteCount} vote
                          {currentPhoto.voteCount !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Info Sidebar */}
        <div
          className={`fixed inset-y-0 right-0 bg-black/95 backdrop-blur-md border-l border-gray-700 overflow-y-auto z-25 transition-transform duration-300 ease-in-out ${
            showInfoSidebar
              ? "translate-y-0 translate-x-0"
              : `${
                  isLandscape
                    ? "translate-y-0 translate-x-full"
                    : "translate-y-full"
                }`
          }`}
          style={{
            width: isLandscape ? "320px" : "100%",
            backgroundColor: isLandscape
              ? "rgb(17 24 39 / 0.95)"
              : "rgb(0 0 0 / 0.95)",
          }}
        >
          {/* Portrait/Mobile: Swipe Down Indicator - Clickable */}
          {showInfoSidebar && !isLandscape && (
            <div
              className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce cursor-pointer flex flex-col items-center"
              onClick={() => setShowInfoSidebar(false)}
            >
              <svg
                className="w-4 h-4 mb-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs text-center whitespace-nowrap">
                Swipe down
              </div>
            </div>
          )}

          <div className={`p-6 space-y-6 ${!isLandscape ? "pt-12" : "pt-6"}`}>
            {/* Photo Info */}
            <div>
              {showTitle && currentPhoto.title && (
                <h2 className="text-xl font-semibold text-white mb-3">
                  {currentPhoto.title}
                </h2>
              )}

              {showDescription && currentPhoto.description && (
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {currentPhoto.description}
                </p>
              )}

              {showAuthor && currentPhoto.User && (
                <div className="mb-4">
                  <Link
                    to={`/users/${currentPhoto.userId}`}
                    className="text-blue-300 hover:text-blue-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    by {currentPhoto.User.nickname || "Unknown"}
                  </Link>
                </div>
              )}

              {/* Contest Info */}
              {currentPhoto.contestTitle && (
                <div className="mb-4">
                  <Link
                    to={`/events/${encodeURIComponent(
                      currentPhoto.contestTitle
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "")
                    )}-${currentPhoto.contestId}`}
                    className="text-purple-300 hover:text-purple-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    From contest: {currentPhoto.contestTitle}
                  </Link>
                  {currentPhoto.rank && (
                    <div className="text-yellow-400 text-sm mt-1">
                      {currentPhoto.rank === 1 && "🥇 1st Place"}
                      {currentPhoto.rank === 2 && "🥈 2nd Place"}
                      {currentPhoto.rank === 3 && "🥉 3rd Place"}
                      {currentPhoto.rank > 3 && `#${currentPhoto.rank} Place`}
                    </div>
                  )}
                </div>
              )}

              {(showRating || showVotes) && (
                <div className="space-y-2">
                  {showRating &&
                    (currentPhoto.averageRating || currentPhoto.totalScore) && (
                      <div className="flex items-center space-x-2 text-yellow-300">
                        <span>⭐</span>
                        <span>
                          {(
                            currentPhoto.averageRating ||
                            currentPhoto.totalScore /
                              (currentPhoto.voteCount || 1)
                          ).toFixed(1)}
                          /5
                        </span>
                      </div>
                    )}

                  {showVotes && currentPhoto.voteCount && (
                    <div className="text-gray-400 text-sm">
                      {currentPhoto.voteCount} vote
                      {currentPhoto.voteCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadata Section */}
            {showMetadata && currentPhoto.metadata && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Camera Info
                </h3>
                <div className="space-y-2 text-sm">
                  {currentPhoto.metadata.make && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Camera:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.make}{" "}
                        {currentPhoto.metadata.model}
                      </span>
                    </div>
                  )}
                  {currentPhoto.metadata.FNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aperture:</span>
                      <span className="text-gray-300">
                        f/{currentPhoto.metadata.FNumber}
                      </span>
                    </div>
                  )}
                  {currentPhoto.metadata.ExposureTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shutter:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.ExposureTime}s
                      </span>
                    </div>
                  )}
                  {currentPhoto.metadata.ISO && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aperture:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.ISO}
                      </span>
                    </div>
                  )}
                  {currentPhoto.metadata.FocalLength && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Focal Length:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.FocalLength}mm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            {showComments && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Comments
                </h3>
                <div className="text-gray-400 text-sm">
                  Comments feature coming soon...
                </div>
              </div>
            )}

            {/* Photo Count */}
            {photos.length > 1 && (
              <div className="border-t border-gray-700 pt-4 text-center text-gray-400 text-sm">
                {currentIndex + 1} of {photos.length}
              </div>
            )}
          </div>
        </div>

        {/* Mobile overlay for closing sidebar */}
        {showInfoSidebar && !isLandscape && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setShowInfoSidebar(false)}
          />
        )}
      </div>

      {/* Custom CSS for slide animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-in-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
