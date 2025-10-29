import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { PhotoLibraryPicker } from "../photos/PhotoLibraryPicker";
import styles from "../../styles/components/Forum.module.css";

export function RichTextEditor({
  value,
  onChange,
  onPhotoSelect,
  selectedPhoto,
  placeholder = "Write your thoughts here...",
  disabled = false,
  minHeight = "8rem",
  onPhotoLibraryOpen,
  maxLength = 10000, // Default to 10k characters for thread content
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const textareaRef = useRef(null);

  const insertMarkdown = (markdownSyntax) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText;
    if (markdownSyntax === "**" || markdownSyntax === "*") {
      // For bold and italic, wrap selected text
      newText =
        value.substring(0, start) +
        markdownSyntax +
        selectedText +
        markdownSyntax +
        value.substring(end);
      onChange(newText);

      // Set cursor position after the inserted markdown
      setTimeout(() => {
        const newPos = selectedText
          ? end + markdownSyntax.length * 2
          : start + markdownSyntax.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      }, 0);
    }
  };

  const handlePhotoSelect = (photo) => {
    if (onPhotoSelect) {
      onPhotoSelect(photo);
      setShowPhotoLibrary(false);
    }
  };

  const removePhoto = () => {
    if (onPhotoSelect) {
      onPhotoSelect(null);
    }
  };

  const openPhotoLibrary = () => {
    if (onPhotoLibraryOpen) {
      // Use external photo library management
      onPhotoLibraryOpen();
    } else {
      // Use internal photo library management
      setShowPhotoLibrary(true);
    }
  };

  const formatButtonStyle =
    "px-2 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors border border-gray-500";

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 border border-gray-600 rounded p-1">
          <button
            type="button"
            onClick={() => insertMarkdown("**")}
            className={formatButtonStyle}
            title="Bold"
            disabled={disabled}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("*")}
            className={formatButtonStyle}
            title="Italic"
            disabled={disabled}
          >
            <em>I</em>
          </button>
        </div>

        <button
          type="button"
          onClick={openPhotoLibrary}
          className={`${formatButtonStyle} flex items-center gap-1`}
          title="Add Photo"
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
            <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
          </svg>
          Photo
        </button>

        <div className="flex items-center gap-1 border border-gray-600 rounded p-1">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`${formatButtonStyle} ${
              showPreview ? "bg-indigo-600 hover:bg-indigo-500" : ""
            }`}
            title="Toggle Preview"
            disabled={disabled}
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {/* Selected Photo Preview */}
      {selectedPhoto && (
        <div className="relative inline-block">
          <div className="border border-gray-600 rounded-lg overflow-hidden max-w-sm">
            <img
              src={selectedPhoto.thumbnailUrl}
              alt={selectedPhoto.title}
              className="w-full h-32 object-cover"
            />
            <div className="p-2 bg-gray-700">
              <p className="text-sm text-white font-medium truncate">
                {selectedPhoto.title}
              </p>
              {selectedPhoto.description && (
                <p className="text-xs text-gray-300 truncate">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={removePhoto}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
            title="Remove Photo"
          >
            ×
          </button>
        </div>
      )}

      {/* Text Area or Preview */}
      {showPreview ? (
        <div
          className={`${styles.textarea} overflow-y-auto prose prose-invert max-w-none`}
          style={{ minHeight, whiteSpace: "pre-wrap" }}
        >
          <ReactMarkdown>{value || "*No content to preview*"}</ReactMarkdown>
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            style={{ minHeight }}
          />
          <span className="absolute right-3 bottom-3 text-xs text-gray-400 bg-gray-800 px-1 rounded">
            {value.length}/{maxLength}
          </span>
        </div>
      )}

      {/* Formatting Help */}
      <div className="text-xs text-gray-400">
        <p>Formatting: **bold**, *italic*</p>
      </div>

      {/* Photo Library Picker - only render if using internal management */}
      {!onPhotoLibraryOpen && (
        <PhotoLibraryPicker
          isOpen={showPhotoLibrary}
          onClose={() => setShowPhotoLibrary(false)}
          onSelect={handlePhotoSelect}
        />
      )}
    </div>
  );
}
