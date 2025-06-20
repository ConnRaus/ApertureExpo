const API_URL = import.meta.env.VITE_API_URL;

export class UserService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  // PUBLIC METHOD - No authentication required for viewing user profiles
  async fetchUserProfile(userId, page = 1, limit = 24) {
    const response = await fetch(
      `${API_URL}/users/${userId}/profile?page=${page}&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async updateProfile(userId, data) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/users/${userId}/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async uploadBanner(userId, formData) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/users/${userId}/banner`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload banner image");
    return response.json();
  }
}
