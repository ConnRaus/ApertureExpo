const API_URL = import.meta.env.VITE_API_URL;

export class ContestService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async fetchContests() {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_URL}/contests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include", // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch contests");
      }

      return response.json();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in fetchContests:", error);
      }
      throw error;
    }
  }

  async fetchContestDetails(contestId, page = 1) {
    try {
      const token = await this.getToken();
      const response = await fetch(
        `${API_URL}/contests/${contestId}?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include", // Include cookies in the request
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch contest details");
      }

      return response.json();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in fetchContestDetails:", error);
      }
      throw error;
    }
  }

  async fetchTopPhotos(contestId, limit = 3) {
    try {
      const token = await this.getToken();
      const response = await fetch(
        `${API_URL}/contests/${contestId}/top-photos?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include", // Include cookies in the request
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch top photos");
      }

      return response.json();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in fetchTopPhotos:", error);
      }
      throw error;
    }
  }

  async submitPhoto(contestId, photoId) {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_URL}/photos/${photoId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ contestId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit photo to contest");
      }

      return response.json();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in submitPhoto:", error);
      }
      throw error;
    }
  }

  async uploadNewPhoto(contestId, formData, onProgress) {
    try {
      const token = await this.getToken();
      formData.append("contestId", contestId);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const { photo } = JSON.parse(xhr.responseText);
            resolve(photo);
          } else {
            reject(new Error("Failed to upload photo"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Failed to upload photo"));
        });

        xhr.open("POST", `${API_URL}/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in uploadNewPhoto:", error);
      }
      throw error;
    }
  }
}
