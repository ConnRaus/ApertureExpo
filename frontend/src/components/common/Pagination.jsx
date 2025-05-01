import React from "react";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  containerClassName = "flex justify-center mt-6 mb-4 gap-2",
}) {
  // No pagination needed if only one page
  if (totalPages <= 1) return null;

  // Function to determine which page numbers to show
  const getPageNumbers = () => {
    let pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push("...");
    }

    // Add pages in the calculated range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push("...");
    }

    // Always show last page if more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={containerClassName}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        &lt;
      </button>

      {/* Page numbers */}
      {pageNumbers.map((pageNumber, index) => (
        <button
          key={index}
          onClick={() =>
            pageNumber !== "..." ? onPageChange(pageNumber) : null
          }
          disabled={pageNumber === "..."}
          className={`px-3 py-1 rounded ${
            pageNumber === currentPage
              ? "bg-indigo-700 text-white font-bold"
              : pageNumber === "..."
              ? "bg-transparent text-gray-400 cursor-default"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        &gt;
      </button>
    </div>
  );
}
