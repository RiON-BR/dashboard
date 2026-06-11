import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Avatar, Typography, Grid, CircularProgress } from '@mui/material';
import axios from 'axios';
import config from '../../../config';

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

export default function ProfileView() {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullname: '',
    email: '',
    address: '',
    bio: ''
  });

  // Numeric summary constants for Instagram-style metrics
  const stats = {
    posts: 12,
    followers: '1.5k',
    following: 382
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${config.API_URL}/api/profile`, { headers });
        if (response.data) {
          setProfile({
            fullname: response.data.FULLNAME || '',
            email: response.data.EMAIL || '',
            address: response.data.ADDRESS || '',
            bio: response.data.BIO || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile in ProfileView:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  const textColor = isDark ? '#E5E7EB' : '#1F2937';
  const labelColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* Profile Metadata Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
        <Avatar 
          sx={{ 
            width: 100, 
            height: 100, 
            bgcolor: 'primary.main', 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            mb: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {profile.fullname ? profile.fullname.charAt(0).toUpperCase() : 'U'}
        </Avatar>

        {/* Display Name */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: textColor, 
            mb: 0.5,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {profile.fullname || 'User'}
        </Typography>

        {/* Email/Location */}
        <Typography 
          variant="body2" 
          sx={{ 
            color: labelColor, 
            mb: 3,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {profile.address || 'No Location specified'}
        </Typography>

        {/* Numeric Metrics Grid Row */}
        <Grid 
          container 
          spacing={2} 
          sx={{ 
            maxWidth: 320, 
            textAlign: 'center', 
            mb: 4,
            py: 1.5,
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textColor }}>{stats.posts}</Typography>
            <Typography variant="caption" sx={{ color: labelColor }}>Posts</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textColor }}>{stats.followers}</Typography>
            <Typography variant="caption" sx={{ color: labelColor }}>Followers</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textColor }}>{stats.following}</Typography>
            <Typography variant="caption" sx={{ color: labelColor }}>Following</Typography>
          </Grid>
        </Grid>

        {/* Biography Box */}
        <Box sx={{ maxWidth: 350, textAlign: 'center', px: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic', 
              color: isDark ? '#D1D5DB' : '#4B5563', 
              lineHeight: 1.6
            }}
          >
            {profile.bio || 'No biography written yet.'}
          </Typography>
        </Box>
      </Box>

    </Box>
  );
}
