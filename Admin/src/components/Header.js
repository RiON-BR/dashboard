import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, IconButton, Avatar, Divider, Badge
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { changeLayoutMode, logoutUser } from '../redux/actions';
import logo from "../assets/images/logo.svg";
import io from 'socket.io-client';
import axios from 'axios';
import config from '../config';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const authUserStr = localStorage.getItem('authUser');
  const authUser = authUserStr ? JSON.parse(authUserStr) : {};
  const token = authUser?.token || authUser?.user?.token;

  // Toggle states
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications and initialize socket
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = response.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => n.IS_UNREAD || n.IS_UNREAD === 1).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();

    const userId = authUser?.id || authUser?.user?.id;
    if (!userId) return;

    const socket = io(config.API_URL);

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('register_user', userId);
    });

    socket.on('NEW_NOTIFICATION', (data) => {
      console.log('Received live notification:', data);
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, authUser?.id, authUser?.user?.id]);

  const handleNotifClick = () => {
    setNotifOpen(!notifOpen);
    setProfileOpen(false); // close other dropdown
    setUnreadCount(0); // clear unread count on open
  };

  const handleProfileClick = () => {
    setProfileOpen(!profileOpen);
    setNotifOpen(false); // close other dropdown
  };

  const toggleTheme = () => {
    const nextMode = layoutMode === 'light' ? 'dark' : 'light';
    dispatch(changeLayoutMode(nextMode));
    setProfileOpen(false);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    try {
      localStorage.removeItem('authUser');
    } catch (e) {}
    dispatch(logoutUser(navigate));
    navigate('/login');
  };

  const isDark = layoutMode === 'dark';
  const headerBg = isDark ? '#1C2536' : '#FFFFFF';
  const headerColor = isDark ? '#E5E7EB' : '#1F2937';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        width: '100%',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        backgroundColor: headerBg,
        color: headerColor,
        borderBottom: `1px solid ${borderColor}`,
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Brand Icon & Text */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src={logo} alt="logo" height="32" />
        <Box sx={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Chatvia
        </Box>
      </Box>

      {/* Right: Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Notification Bell Button */}
        <IconButton onClick={handleNotifClick} sx={{ color: isDark ? '#9DA4AE' : '#495057' }}>
          {unreadCount > 0 ? (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          ) : (
            <NotificationsIcon />
          )}
        </IconButton>

        {/* Profile Avatar Button */}
        <IconButton onClick={handleProfileClick} sx={{ p: 0 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 600, fontSize: '0.9rem' }}>
            {String(authUser.name || authUser.email || 'U').charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Box>

      {/* Notification Dropdown */}
      {notifOpen && (
        <Box
          sx={{
            position: 'absolute',
            right: 80,
            top: 60,
            zIndex: 1300,
            backgroundColor: isDark ? '#1C2536' : '#ffffff',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            width: 280,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {notifications.map((notif) => {
            let text = ''; let icon = '🔔';
            switch(notif.ACTIVITY_TYPE) {
              case 'LIKE': text = `User ${notif.SENDER_NAME} liked your blog "${notif.BLOG_TITLE}"`; icon = '❤️'; break;
              case 'COMMENT': text = `User ${notif.SENDER_NAME} commented on your blog "${notif.BLOG_TITLE}"`; icon = '💬'; break;
              case 'NEW_MSG': text = `New message from ${notif.SENDER_NAME}`; icon = '📩'; break;
              case 'MSG_REQ': text = `Chat request pending from ${notif.SENDER_NAME}`; icon = '👤'; break;
              case 'NEW_ORDER': text = `New order received from ${notif.SENDER_NAME}`; icon = '🛒'; break;
              case 'ORDER_STATUS': text = `Order #${notif.REFERENCE_ID} status changed to ${notif.ADDITIONAL_INFO}`; icon = '📦'; break;
              default: text = notif.message || 'New notification'; break;
            }
            return (
              <Box key={notif.NOTIF_ID} sx={{ display: 'flex', alignItems: 'center', p: 1.5, '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'action.hover' } }}>
                <Box sx={{ mr: 1.5 }}>{icon}</Box>
                <Box sx={{ fontSize: 13, fontWeight: (notif.IS_UNREAD === 1 || notif.IS_UNREAD === true) ? 600 : 400, whiteSpace: 'normal', color: 'inherit' }}>{text}</Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Profile Dropdown */}
      {profileOpen && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            top: 60,
            zIndex: 1300,
            backgroundColor: isDark ? '#1C2536' : '#ffffff',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            width: 200,
            overflow: 'hidden',
          }}
        >
          <Box 
            onClick={toggleTheme} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer', 
              py: 1.5, 
              px: 2, 
              color: 'inherit',
              '&:hover': { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' } 
            }}
          >
            <Box sx={{ display: 'flex', mr: 1.5, alignItems: 'center' }}>
              {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </Box>
            <Box sx={{ fontSize: 14 }}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Box>
          </Box>
          <Divider sx={{ borderColor: borderColor }} />
          <Box 
            onClick={handleLogout} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer', 
              py: 1.5, 
              px: 2, 
              color: 'error.main',
              '&:hover': { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' } 
            }}
          >
            <Box sx={{ display: 'flex', mr: 1.5, alignItems: 'center', color: 'error.main' }}>
              <ExitToAppIcon fontSize="small" />
            </Box>
            <Box sx={{ fontSize: 14, color: 'error.main' }}>
              Logout
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
