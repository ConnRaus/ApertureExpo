import { useState, useRef } from "react";

export function useFormField(initialValue = "", maxLength = Infinity) {
  const [value, setValue] = useState(initialValue);

  const onChange = (e) => {
    setValue(e.target.value.slice(0, maxLength));
  };

  return {
    value,
    setValue,
    onChange,
    length: value.length,
    maxLength,
  };
}

export function usePhotoUploadForm(onSuccess) {
  // Use useRef for file to prevent re-renders
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const title = useFormField("", 100);
  const description = useFormField("", 500);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      fileRef.current = selectedFile;
      setShowUploadForm(true);
      setError(null);
    }
  };

  const handleCancel = () => {
    fileRef.current = null;
    title.setValue("");
    description.setValue("");
    setShowUploadForm(false);
    setError(null);
    setUploadProgress(0);
  };

  const getFormData = () => {
    const formData = new FormData();
    formData.append("photo", fileRef.current);
    formData.append("title", title.value);
    formData.append("description", description.value);
    return formData;
  };

  return {
    file: fileRef.current,
    handleFileChange,
    title,
    description,
    uploading,
    setUploading,
    error,
    setError,
    showUploadForm,
    setShowUploadForm,
    uploadProgress,
    setUploadProgress,
    handleCancel,
    getFormData,
  };
}
