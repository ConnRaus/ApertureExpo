import React, { useState, useEffect } from "react";

export function CountdownTimer({
  targetDate,
  type = "countdown",
  className = "",
  compact = false,
}) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    // Function to calculate time remaining or elapsed
    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const difference =
        type === "countdown"
          ? target.getTime() - now.getTime()
          : now.getTime() - target.getTime();

      const isExpired = type === "countdown" && difference <= 0;

      // Calculate time units
      let seconds = Math.floor(difference / 1000);
      let minutes = Math.floor(seconds / 60);
      let hours = Math.floor(minutes / 60);
      let days = Math.floor(hours / 24);

      // Adjust values to their respective ranges
      hours = hours % 24;
      minutes = minutes % 60;
      seconds = seconds % 60;

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired,
      });
    };

    // Calculate initially
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, [targetDate, type]);

  // Format the time units with leading zeros
  const formatTimeUnit = (unit) => {
    return unit.toString().padStart(2, "0");
  };

  // Different display based on type and status
  if (type === "countdown" && timeRemaining.isExpired) {
    return <span className={className}>Ended</span>;
  }

  // For shorter time periods, we can hide days
  const showDays = timeRemaining.days > 0;

  // Compact display for header badges
  if (compact) {
    if (showDays) {
      return <span className={className}>{timeRemaining.days}d left</span>;
    }
    return (
      <span className={className}>
        {formatTimeUnit(timeRemaining.hours)}h{" "}
        {formatTimeUnit(timeRemaining.minutes)}m
      </span>
    );
  }

  return (
    <span className={className}>
      {type === "countdown" ? (
        <>
          {showDays && <>{timeRemaining.days}d </>}
          {formatTimeUnit(timeRemaining.hours)}h{" "}
          {formatTimeUnit(timeRemaining.minutes)}m{" "}
          {formatTimeUnit(timeRemaining.seconds)}s
          {showDays ? " left" : " remaining"}
        </>
      ) : (
        <>
          {showDays && <>{timeRemaining.days}d </>}
          {formatTimeUnit(timeRemaining.hours)}h{" "}
          {formatTimeUnit(timeRemaining.minutes)}m ago
        </>
      )}
    </span>
  );
}
