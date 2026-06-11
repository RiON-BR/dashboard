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

export const fetchTasks = async () => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/tasks`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const token = getAuthToken();
    const res = await axios.post(`${API_URL}/api/tasks`, taskData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const token = getAuthToken();
    const res = await axios.put(`${API_URL}/api/tasks/toggle/${taskId}`, { status }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const token = getAuthToken();
    const res = await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const fetchGlobalTasks = async () => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/tasks/global`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching global tasks:", error);
    throw error;
  }
};

