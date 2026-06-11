import { jwtDecode } from 'jwt-decode';

const getAuthUser = () => {
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

const getToken = () => getAuthUser()?.token;

const getCurrentUserRole = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded?.role || null;
  } catch {
    return null;
  }
};

const getCurrentUserId = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded?.sub ? Number(decoded.sub) : null;
  } catch {
    return null;
  }
};

const isAdmin = () => {
  const role = getCurrentUserRole();
  return String(role || '').toLowerCase() === 'admin';
};

const normalizeRole = (role) => (role ? String(role).toLowerCase() : '');

export { getCurrentUserRole, getCurrentUserId, isAdmin, normalizeRole };

