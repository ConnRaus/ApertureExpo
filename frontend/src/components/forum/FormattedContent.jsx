import React from "react";
import ReactMarkdown from "react-markdown";
import styles from "../../styles/components/Forum.module.css";

export function FormattedContent({
  content,
  photo,
  className = "",
  onPhotoClick,
}) {
  const openLightbox = () => {
    if (photo && onPhotoClick) {
      onPhotoClick(photo);
    }
  };

  return (
    <div className={`${styles.postContent} ${className}`}>
      {/* Display attached photo */}
      {photo && (
        <div className="mb-4">
          <div
            className="border border-gray-600 rounded-lg overflow-hidden max-w-md cursor-pointer hover:border-gray-500 transition-colors"
            onClick={openLightbox}
            title="Click to view full size"
          >
            <img
              src={photo.thumbnailUrl || photo.s3Url}
              alt={photo.title}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="p-3 bg-gray-700">
              <p className="text-sm text-white font-medium">{photo.title}</p>
              {photo.description && (
                <p className="text-xs text-gray-300 mt-1">
                  {photo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Display formatted content */}
      <div className="prose prose-invert max-w-none prose-sm">
        <ReactMarkdown
          components={{
            // Customize specific elements if needed
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-white mb-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold text-white mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-bold text-white mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-200 mb-2 leading-relaxed">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-white">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-200">{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-gray-200 mb-2 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-gray-200 mb-2 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-gray-200">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-300 my-2">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-800 text-gray-200 p-3 rounded overflow-x-auto text-sm font-mono">
                {children}
              </pre>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
