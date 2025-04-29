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

export class UserService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async fetchUserProfile(userId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/users/${userId}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return response.json();
  }

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

export class ContestService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async fetchContests() {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/contests`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch contests");
    return response.json();
  }

  async fetchContestDetails(contestId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/contests/${contestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch contest details");
    return response.json();
  }

  async submitPhoto(contestId, photoId) {
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

  async uploadNewPhoto(contestId, formData, onProgress) {
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
          // Try to parse the error response to get the detailed error message
          try {
            const errorResponse = JSON.parse(xhr.responseText);

            // For duplicate photo errors, create a more helpful message
            if (
              errorResponse.error &&
              errorResponse.error.includes("duplicate")
            ) {
              const errorMessage =
                "This photo already exists in your library. Please use the 'Choose Existing Photo' button instead.";
              reject(new Error(errorMessage));
            } else {
              reject(
                new Error(errorResponse.error || "Failed to upload photo")
              );
            }
          } catch (parseError) {
            reject(new Error("Failed to upload photo"));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Failed to upload photo"));
      });

      xhr.open("POST", `${API_URL}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  }
}

export class VoteService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async voteForPhoto(photoId, contestId, value = 1) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/votes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photoId, contestId, value }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to vote for photo");
    }

    return response.json();
  }

  async getPhotoVotes(photoId, contestId = null) {
    const token = await this.getToken();
    let url = `${API_URL}/photos/${photoId}/votes`;
    if (contestId) {
      url += `?contestId=${contestId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get photo votes");
    }

    return response.json();
  }

  async getUserVotes(contestId = null) {
    const token = await this.getToken();
    let url = `${API_URL}/users/votes`;
    if (contestId) {
      url += `?contestId=${contestId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user votes");
    }

    return response.json();
  }

  async getTopPhotos(contestId, limit = 10) {
    const token = await this.getToken();
    const response = await fetch(
      `${API_URL}/contests/${contestId}/top-photos?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get top photos");
    }

    return response.json();
  }
}
