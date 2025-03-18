import React from "react";

/**
 * A simple spinner loading indicator
 * @param {Object} props - Component props
 * @param {string} [props.size='md'] - Size of spinner: 'sm', 'md', 'lg'
 * @param {string} [props.color='indigo'] - Color theme: 'indigo', 'blue', 'gray'
 * @param {string} [props.message] - Optional loading message to display
 */
function LoadingSpinner({ size = "md", color = "indigo", message }) {
  // Size mappings
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  // Color mappings
  const colors = {
    indigo: "border-indigo-500 border-t-transparent",
    blue: "border-blue-500 border-t-transparent",
    gray: "border-gray-300 border-t-transparent",
  };

  const spinnerSize = sizes[size] || sizes.md;
  const spinnerColor = colors[color] || colors.indigo;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${spinnerSize} border-4 ${spinnerColor} rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      ></div>
      {message && <p className="mt-3 text-gray-400 text-center">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
