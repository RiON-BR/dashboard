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

export const fetchAdminMetrics = async () => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/admin/metrics`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${API_URL}/api/users`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const token = getAuthToken();
    const res = await axios.delete(`${API_URL}/api/users/${userId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
