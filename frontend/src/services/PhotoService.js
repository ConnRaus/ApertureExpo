const API_URL = import.meta.env.VITE_API_URL;

export class PhotoService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async fetchPhotos() {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/photos?include=contests`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch photos");
    return response.json();
  }

  async fetchPhotoById(photoId) {
    const response = await fetch(`${API_URL}/photos/${photoId}`, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch photo");
    return response.json();
  }

  async updatePhoto(photoId, data) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/photos/${photoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update photo");
    return response.json();
  }

  async deletePhoto(photoId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete photo");
    }
    return response.json();
  }

  async permabanPhoto(photoId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/photos/${photoId}/permaban`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to permaban photo");
    }
    return response.json();
  }

  async submitToContest(photoId, contestId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/photos/${photoId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contestId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit photo to contest");
    }
    return response.json();
  }

  async reportPhoto(photoId, reason, customReason, contestId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/photos/${photoId}/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason, customReason, contestId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to report photo");
    }
    return response.json();
  }
}
