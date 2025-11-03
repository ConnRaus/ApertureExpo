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
    if (!response.ok) throw new Error("Failed to delete photo");
    return true;
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
}
