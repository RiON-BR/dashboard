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

export const sendMessage = async (conversationId, messageText) => {
  try {
    const token = getAuthToken();
    const res = await axios.post(
      `${API_URL}/api/chat/conversation/${conversationId}/message`,
      { message: messageText },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );
    return res && res.data ? res : { data: res };
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
