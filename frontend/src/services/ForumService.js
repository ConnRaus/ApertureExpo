const API_URL = import.meta.env.VITE_API_URL;

export class ForumService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  // PUBLIC METHOD - No authentication required for viewing threads
  async fetchThreads(page = 1, limit = 10, category = null) {
    let url = `${API_URL}/forum/threads?page=${page}&limit=${limit}`;

    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch forum threads");
    return response.json();
  }

  // PUBLIC METHOD - No authentication required for viewing categories
  async fetchCategories() {
    const response = await fetch(`${API_URL}/forum/categories`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch forum categories");
    return response.json();
  }

  // PUBLIC METHOD - No authentication required for viewing thread details
  async fetchThreadDetails(threadId, page = 1, limit = 20) {
    const response = await fetch(
      `${API_URL}/forum/threads/${threadId}?page=${page}&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch thread details");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async createThread(title, content, category = "General", photoId = null) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/threads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content, category, photoId }),
    });

    if (!response.ok) throw new Error("Failed to create thread");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async createPost(threadId, content, photoId = null) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/threads/${threadId}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, photoId }),
    });

    if (!response.ok) throw new Error("Failed to create post");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async updateThread(threadId, data) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/threads/${threadId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update thread");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async updatePost(postId, content, photoId = null) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/posts/${postId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, photoId }),
    });

    if (!response.ok) throw new Error("Failed to update post");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async deleteThread(threadId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/threads/${threadId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to delete thread");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async deletePost(postId) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to delete post");
    return response.json();
  }

  // PROTECTED METHOD - Requires authentication
  async clearImageCache() {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/clear-image-cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to clear image cache");
    return response.json();
  }
}
