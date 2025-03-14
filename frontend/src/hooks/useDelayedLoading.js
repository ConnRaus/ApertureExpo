import { useState, useEffect } from "react";

/**
 * A hook that delays showing loading state to prevent flashing on fast connections
 *
 * @param {boolean} isLoading - The actual loading state
 * @param {number} delay - Delay in milliseconds before showing loading state (default: 400ms)
 * @param {number} minDisplayTime - Minimum time in milliseconds to show loading state once visible (default: 500ms)
 * @returns {boolean} - Whether to show the loading state
 */
export function useDelayedLoading(
  isLoading,
  delay = 400,
  minDisplayTime = 500
) {
  const [shouldShowLoading, setShouldShowLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState(0);

  useEffect(() => {
    let timeoutId;

    if (isLoading && !shouldShowLoading) {
      // Start a timer to show loading state after delay
      timeoutId = setTimeout(() => {
        setShouldShowLoading(true);
        setLoadingStartTime(Date.now());
      }, delay);
    } else if (!isLoading && shouldShowLoading) {
      // Calculate how long the loading state has been visible
      const displayTime = Date.now() - loadingStartTime;

      // If it's been visible for less than minDisplayTime, wait before hiding
      if (displayTime < minDisplayTime) {
        timeoutId = setTimeout(() => {
          setShouldShowLoading(false);
        }, minDisplayTime - displayTime);
      } else {
        // It's been visible long enough, hide immediately
        setShouldShowLoading(false);
      }
    }

    // Clean up timeout on unmount or when dependencies change
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, shouldShowLoading, loadingStartTime, delay, minDisplayTime]);

  return shouldShowLoading;
}
