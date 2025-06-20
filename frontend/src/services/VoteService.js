const API_URL = import.meta.env.VITE_API_URL;

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
    let url = `${API_URL}/user-votes`;
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
