import { useState } from "react";

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
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const title = useFormField("", 100);
  const description = useFormField("", 500);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowUploadForm(true);
      setError(null);
    }
  };

  const handleCancel = () => {
    setFile(null);
    title.setValue("");
    description.setValue("");
    setShowUploadForm(false);
    setError(null);
  };

  const getFormData = () => {
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("title", title.value);
    formData.append("description", description.value);
    return formData;
  };

  return {
    file,
    setFile,
    title,
    description,
    uploading,
    setUploading,
    error,
    setError,
    showUploadForm,
    setShowUploadForm,
    handleFileChange,
    handleCancel,
    getFormData,
  };
}
