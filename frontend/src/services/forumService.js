const API_URL = import.meta.env.VITE_API_URL;

export class ForumService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async fetchThreads(page = 1, limit = 10, category = null) {
    const token = await this.getToken();
    let url = `${API_URL}/forum/threads?page=${page}&limit=${limit}`;

    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch forum threads");
    return response.json();
  }

  async fetchCategories() {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch forum categories");
    return response.json();
  }

  async fetchThreadDetails(threadId, page = 1, limit = 20) {
    const token = await this.getToken();
    const response = await fetch(
      `${API_URL}/forum/threads/${threadId}?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch thread details");
    return response.json();
  }

  async createThread(title, content, category = "General") {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/threads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content, category }),
    });

    if (!response.ok) throw new Error("Failed to create thread");
    return response.json();
  }

  async createPost(threadId, content) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/threads/${threadId}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error("Failed to create post");
    return response.json();
  }

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

  async updatePost(postId, content) {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/forum/posts/${postId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error("Failed to update post");
    return response.json();
  }

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
}
