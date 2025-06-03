import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { Link } from "react-router-dom";
import { CommentSection } from "./CommentSection";

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

  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const infoSidebarContentRef = useRef(null);

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
    enableZoom = true,
    showThumbnails = false,
    darkMode = true,
  } = config;

  const isOpen = selectedIndex >= 0 && photos.length > 0;
  const currentPhoto = photos[currentIndex] || null;
  const previousPhoto = photos[previousIndex] || null;
  const isZoomedIn = zoomLevel > 1;

  // Reset zoom when image changes
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    setIsPanning(false);
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (!enableZoom) return;
    setZoomLevel((prev) => Math.min(prev * 1.5, 5)); // Max 5x zoom
  }, [enableZoom]);

  const zoomOut = useCallback(() => {
    if (!enableZoom) return;
    setZoomLevel((prev) => {
      const newZoom = prev / 1.5;
      if (newZoom <= 1) {
        // Reset pan when zooming out completely
        setPanX(0);
        setPanY(0);
        return 1;
      }
      return newZoom;
    });
  }, [enableZoom]);

  const resetZoomAndPan = useCallback(() => {
    if (!enableZoom) return;
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  }, [enableZoom]);

  // Pan functions
  const handlePanStart = useCallback(
    (clientX, clientY) => {
      if (!isZoomedIn) return;
      setIsPanning(true);
      setLastPanPoint({ x: clientX, y: clientY });
    },
    [isZoomedIn]
  );

  const handlePanMove = useCallback(
    (clientX, clientY) => {
      if (!isPanning || !isZoomedIn) return;

      const deltaX = clientX - lastPanPoint.x;
      const deltaY = clientY - lastPanPoint.y;

      setPanX((prev) => prev + deltaX);
      setPanY((prev) => prev + deltaY);
      setLastPanPoint({ x: clientX, y: clientY });
    },
    [isPanning, isZoomedIn, lastPanPoint]
  );

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse events for zoom and pan
  const handleMouseDown = useCallback(
    (e) => {
      if (!enableZoom || !isZoomedIn) return;
      e.preventDefault();
      handlePanStart(e.clientX, e.clientY);
    },
    [enableZoom, isZoomedIn, handlePanStart]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!enableZoom || !isPanning) return;
      e.preventDefault();
      handlePanMove(e.clientX, e.clientY);
    },
    [enableZoom, isPanning, handlePanMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!enableZoom) return;
    handlePanEnd();
  }, [enableZoom, handlePanEnd]);

  // Touch events for zoom and pan
  const handleTouchStart = useCallback(
    (e) => {
      if (!enableZoom || !isZoomedIn || e.touches.length !== 1) return;
      const touch = e.touches[0];
      handlePanStart(touch.clientX, touch.clientY);
    },
    [enableZoom, isZoomedIn, handlePanStart]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!enableZoom || !isPanning || e.touches.length !== 1) return;
      const touch = e.touches[0];
      handlePanMove(touch.clientX, touch.clientY);
    },
    [enableZoom, isPanning, handlePanMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enableZoom) return;
    handlePanEnd();
  }, [enableZoom, handlePanEnd]);

  // Add mouse event listeners
  useEffect(() => {
    if (!enableZoom) return;

    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isPanning) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [enableZoom, isPanning, handleMouseMove, handleMouseUp]);

  // Handle opening animation and desktop default state
  useEffect(() => {
    if (isOpen) {
      // Reset image loaded state when opening
      setImageLoaded(false);
      setIsTransitioning(false);
      setSlideDirection(null);
      setPreviousIndex(-1);
      resetZoom(); // Reset zoom when opening

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
      resetZoom(); // Reset zoom when closing
    }
  }, [isOpen, showInfoButton, resetZoom]);

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
      resetZoom(); // Reset zoom when navigating
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
  }, [photos.length, currentIndex, isTransitioning, resetZoom]);

  const goToPrevious = useCallback(() => {
    if (photos.length > 1 && !isTransitioning) {
      resetZoom(); // Reset zoom when navigating
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
  }, [photos.length, currentIndex, isTransitioning, resetZoom]);

  const closeLightbox = useCallback(() => {
    setIsVisible(false);
    setShowInfoSidebar(false);
    setImageLoaded(false);
    setIsTransitioning(false);
    setSlideDirection(null);
    setPreviousIndex(-1);
    resetZoom(); // Reset zoom when closing
    // Delay the actual close to allow fade out animation
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose, resetZoom]);

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
      // Don't trigger shortcuts if user is typing in an input field
      const isTyping =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.contentEditable === "true" ||
        event.target.closest('[role="textbox"]') ||
        event.target.closest("input") ||
        event.target.closest("textarea");

      if (isTyping) {
        return; // Don't handle keyboard shortcuts when typing
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          if (!isZoomedIn) goToNext();
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (!isZoomedIn) goToPrevious();
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
        case "=":
        case "+":
          if (enableZoom) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (enableZoom) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case "0":
          if (enableZoom) {
            event.preventDefault();
            resetZoomAndPan();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    enableKeyboardControls,
    isZoomedIn,
    goToNext,
    goToPrevious,
    closeLightbox,
    showInfoButton,
    enableZoom,
    zoomIn,
    zoomOut,
    resetZoomAndPan,
  ]);

  // Swipe controls - Modified to respect zoom state
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => enableSwipeControls && !isZoomedIn && goToNext(),
    onSwipedRight: () => enableSwipeControls && !isZoomedIn && goToPrevious(),
    onSwipedUp: () =>
      enableSwipeControls &&
      !isZoomedIn &&
      showInfoButton &&
      !isLandscape &&
      setShowInfoSidebar(true),
    onSwipedDown: (eventData) => {
      if (!enableSwipeControls || isLandscape || isZoomedIn) return;

      // Only handle swipe down when info sidebar is open
      if (showInfoSidebar) {
        const startY = eventData.initial[1]; // Y coordinate where swipe started
        const screenHeight = window.innerHeight;
        const upperThird = screenHeight / 3;

        // Check if the info content is scrollable
        // We need to check the parent container that has the overflow-y-auto class
        const sidebarContainer = infoSidebarContentRef.current?.parentElement;
        const isContentScrollable =
          sidebarContainer &&
          sidebarContainer.scrollHeight > sidebarContainer.clientHeight;

        // If content is not scrollable, allow swipe from anywhere
        // If content is scrollable, require swipe from upper third to avoid interfering with scrolling
        let shouldAllowDismiss = false;

        if (!isContentScrollable) {
          // Content not scrollable - allow swipe from anywhere with reasonable velocity
          shouldAllowDismiss = Math.abs(eventData.deltaY) > 50;
        } else {
          // Content is scrollable - require swipe from upper third with stricter conditions
          shouldAllowDismiss =
            startY <= upperThird &&
            startY >= 40 &&
            Math.abs(eventData.deltaY) > 80;
        }

        if (shouldAllowDismiss) {
          setShowInfoSidebar(false);
        }
      }
    },
    preventDefaultTouchmoveEvent: !isZoomedIn, // Allow touch events when zoomed for panning
    trackMouse: false,
  });

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      // Standard scroll prevention
      document.body.style.overflow = "hidden";

      // Safari iOS specific - more aggressive prevention
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";

      // Safari iOS specific scroll prevention for wheel/scroll events
      const preventScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      // More comprehensive event prevention for Safari
      const preventDefaultScroll = (e) => {
        // Prevent default unless it's within a scrollable container or interactive element
        if (
          !e.target.closest(".lightbox-scrollable") &&
          !e.target.closest("button") &&
          !e.target.closest("a") &&
          !e.target.closest('[role="button"]')
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Prevent pull-to-refresh and bounce scrolling, but allow interactive elements
      const preventScrollNotButtons = (e) => {
        // Allow touch events on interactive elements
        if (
          e.target.closest("button") ||
          e.target.closest("a") ||
          e.target.closest('[role="button"]') ||
          e.target.closest(".lightbox-scrollable")
        ) {
          return; // Don't prevent - allow normal interaction
        }
        e.preventDefault();
        e.stopPropagation();
      };

      // Add passive: false to ensure preventDefault works
      document.addEventListener("touchmove", preventDefaultScroll, {
        passive: false,
      });
      document.addEventListener("wheel", preventDefaultScroll, {
        passive: false,
      });
      document.addEventListener("scroll", preventScroll, { passive: false });

      // Use the smarter prevention for touchstart
      document.addEventListener("touchstart", preventScrollNotButtons, {
        passive: false,
      });

      return () => {
        document.body.style.overflow = "unset";
        document.body.style.position = "unset";
        document.body.style.width = "unset";
        document.body.style.height = "unset";
        document.documentElement.style.overflow = "unset";

        document.removeEventListener("touchmove", preventDefaultScroll);
        document.removeEventListener("wheel", preventDefaultScroll);
        document.removeEventListener("scroll", preventScroll);
        document.removeEventListener("touchstart", preventScrollNotButtons);
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
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
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
          className="absolute top-4 right-4 z-30 text-white/70 hover:text-white transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
          aria-label="Close lightbox"
        >
          <svg
            className="w-5 h-5"
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

        {/* Info Button */}
        {showInfoButton && (
          <button
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className="absolute top-4 right-16 z-30 text-white/70 hover:text-white transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
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

        {/* Zoom Controls */}
        {enableZoom && (
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
            <button
              onClick={zoomIn}
              disabled={zoomLevel >= 5}
              className="text-white/70 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 disabled:hover:bg-black/30"
              aria-label="Zoom in"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>
            <button
              onClick={zoomOut}
              disabled={zoomLevel <= 1}
              className="text-white/70 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 disabled:hover:bg-black/30"
              aria-label="Zoom out"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"
                />
              </svg>
            </button>
            {isZoomedIn && (
              <button
                onClick={resetZoomAndPan}
                className="text-white/70 hover:text-white transition-colors duration-200 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
                aria-label="Reset zoom"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
            {isZoomedIn && (
              <div className="text-white/50 text-xs text-center bg-black/50 rounded px-2 py-1">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}
          </div>
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
              ref={imageContainerRef}
            >
              {/* Navigation Buttons - positioned relative to image area */}
              {enableNavigation && photos.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className={`absolute left-4 z-20 text-white/70 hover:text-white transition-all duration-200 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 ${
                      isTransitioning || isZoomedIn
                        ? "opacity-50 pointer-events-none"
                        : ""
                    } ${
                      showInfoSidebar && !isLandscape
                        ? "pointer-events-none"
                        : ""
                    }`}
                    aria-label="Previous image"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  >
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={goToNext}
                    className={`absolute right-4 z-20 text-white/70 hover:text-white transition-all duration-200 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 ${
                      isTransitioning || isZoomedIn
                        ? "opacity-50 pointer-events-none"
                        : ""
                    } ${
                      showInfoSidebar && !isLandscape
                        ? "pointer-events-none"
                        : ""
                    }`}
                    aria-label="Next image"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  >
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
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
                    } ${
                      isZoomedIn
                        ? "cursor-grab active:cursor-grabbing"
                        : "cursor-default"
                    }`}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    onLoad={handleImageLoad}
                    onError={handleImageLoad}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    ref={checkImageLoaded}
                    style={{
                      transform: `scale(${zoomLevel}) translate(${
                        panX / zoomLevel
                      }px, ${panY / zoomLevel}px)`,
                      transformOrigin: "center center",
                      transition: isPanning
                        ? "none"
                        : "transform 0.1s ease-out",
                    }}
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
                } fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white z-20 max-h-96 overflow-y-auto lightbox-scrollable`}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
                }}
              >
                {/* Swipe Up Indicator - Clickable - Improved spacing */}
                {showInfoButton && (
                  <div className="sticky top-0 -mb-1 bg-gradient-to-b from-black/60 to-transparent pt-2 pb-3 z-10">
                    <div
                      className="flex flex-col items-center text-white/50 animate-bounce cursor-pointer"
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
                  </div>
                )}

                <div
                  className={`px-6 pb-6 ${showInfoButton ? "pt-2" : "pt-8"}`}
                >
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
          className={`fixed inset-y-0 right-0 bg-black/95 backdrop-blur-md border-l border-gray-700 overflow-y-auto lightbox-scrollable z-25 transition-transform duration-300 ease-in-out ${
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
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Portrait/Mobile: Swipe Down Indicator - Clickable */}
          {showInfoSidebar && !isLandscape && (
            <div className="sticky top-0 bg-gradient-to-b from-black/80 to-transparent pt-2 pb-3 z-10">
              <div
                className="flex flex-col items-center text-white/50 animate-bounce cursor-pointer"
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
                  Less info
                </div>
              </div>
            </div>
          )}

          <div
            className={`p-6 space-y-6 ${!isLandscape ? "pt-2" : "pt-6"}`}
            ref={infoSidebarContentRef}
          >
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
                  {/* Camera Make & Model */}
                  {(currentPhoto.metadata.Image?.Make ||
                    currentPhoto.metadata.Image?.Model) && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Camera:</span>
                      <span className="text-gray-300">
                        {[
                          currentPhoto.metadata.Image?.Make,
                          currentPhoto.metadata.Image?.Model,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    </div>
                  )}

                  {/* Lens Model */}
                  {currentPhoto.metadata.Photo?.LensModel && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lens:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.Photo.LensModel}
                      </span>
                    </div>
                  )}

                  {/* Aperture (F-Stop) */}
                  {currentPhoto.metadata.Photo?.FNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aperture:</span>
                      <span className="text-gray-300">
                        f/{currentPhoto.metadata.Photo.FNumber}
                      </span>
                    </div>
                  )}

                  {/* Shutter Speed */}
                  {currentPhoto.metadata.Photo?.ExposureTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shutter Speed:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.Photo.ExposureTime < 1
                          ? `1/${Math.round(
                              1 / currentPhoto.metadata.Photo.ExposureTime
                            )}s`
                          : `${currentPhoto.metadata.Photo.ExposureTime}s`}
                      </span>
                    </div>
                  )}

                  {/* ISO */}
                  {currentPhoto.metadata.Photo?.ISOSpeedRatings && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ISO:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.Photo.ISOSpeedRatings}
                      </span>
                    </div>
                  )}

                  {/* Focal Length with 35mm Equivalent */}
                  {currentPhoto.metadata.Photo?.FocalLength && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Focal Length:</span>
                      <span className="text-gray-300">
                        {currentPhoto.metadata.Photo.FocalLength}mm
                        {currentPhoto.metadata.Photo?.FocalLengthIn35mmFilm &&
                          ` (${currentPhoto.metadata.Photo.FocalLengthIn35mmFilm}mm)`}
                      </span>
                    </div>
                  )}

                  {/* Image dimensions */}
                  {currentPhoto.metadata.width &&
                    currentPhoto.metadata.height && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dimensions:</span>
                        <span className="text-gray-300">
                          {currentPhoto.metadata.width} ×{" "}
                          {currentPhoto.metadata.height}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            {showComments && (
              <div
                className="border-t border-gray-700 pt-6"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <CommentSection photoId={currentPhoto.id} />
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

        /* Custom scrollbar styles for webkit browsers */
        .lightbox-scrollable::-webkit-scrollbar {
          width: 6px;
        }

        .lightbox-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }

        .lightbox-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .lightbox-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Ensure smooth scrolling */
        .lightbox-scrollable {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
