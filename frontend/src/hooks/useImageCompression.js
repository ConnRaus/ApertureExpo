import imageCompression from "browser-image-compression";

export function useImageCompression() {
  const compressImage = async (file, maxSizeMB = 2) => {
    const options = {
      maxSizeMB,
      maxWidthOrHeight: 3840, // Match backend 4K limit
      useWebWorker: true,
      preserveExif: true,
      initialQuality: 0.85, // Match backend quality
    };

    try {
      const compressedFile = await imageCompression(file, options);

      // We don't need to generate thumbnails on the frontend anymore
      // since we're handling that on the backend with better quality
      return {
        compressedFile,
        originalFile: file,
      };
    } catch (error) {
      console.error("Error compressing image:", error);
      throw error;
    }
  };

  return { compressImage };
}
