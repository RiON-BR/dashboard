import axios from 'axios';
import config from '../../../config';

const API_URL = config.API_URL;

const getAuthToken = () => {
  try {
    const raw = localStorage.getItem('authUser');
    if (!raw) return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed?.token || null;
  } catch {
    return null;
  }
};

export const fetchBlogs = async () => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/blogs`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw error;
  }
};

export const fetchMyBlogs = async () => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/blogs/my-blogs`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching my blogs:", error);
    throw error;
  }
};

export const fetchBlogById = async (blogId) => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/blogs/${blogId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching single blog:", error);
    throw error;
  }
};

export const createBlog = async (blogData) => {
  try {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/api/blogs`, blogData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
};

export const updateBlog = async (blogId, blogData) => {
  try {
    const token = getAuthToken();
    const res = await axios.put(`${API_URL}/api/blogs/${blogId}`, blogData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
};

export const deleteBlog = async (blogId) => {
  try {
    const token = getAuthToken();
    const res = await axios.delete(`${API_URL}/api/blogs/${blogId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
};

export const likeBlog = async (blogId) => {
  try {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/api/blogs/${blogId}/like`, {}, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error liking blog:", error);
    throw error;
  }
};

export const clickBlog = async (blogId) => {
  try {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/api/blogs/${blogId}/click`, {}, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error incrementing click count:", error);
    throw error;
  }
};

export const fetchBlogComments = async (blogId) => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/blogs/${blogId}/comments`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching blog comments:", error);
    throw error;
  }
};

export const addBlogComment = async (blogId, commentText) => {
  try {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/api/blogs/${blogId}/comments`, { commentText }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error posting blog comment:", error);
    throw error;
  }
};
