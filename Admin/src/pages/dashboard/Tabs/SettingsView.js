import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, Typography, TextField, Button, Switch, FormControlLabel, CircularProgress, Divider, InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import config from '../../../config';
import { changeLayoutMode } from '../../../redux/actions';

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

export default function SettingsView() {
  const dispatch = useDispatch();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullname: '',
    email: '',
    address: '',
    bio: ''
  });

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

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
        console.error('Failed to fetch profile in SettingsView:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${config.API_URL}/api/profile`, {
        fullname: profile.fullname,
        address: profile.address,
        bio: profile.bio
      }, { headers });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert('All password fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('New Password and Confirm New Password do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${config.API_URL}/api/user/change-password`, {
        currentPassword,
        newPassword
      }, { headers });
      
      alert(response.data?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Failed to change password:', err);
      alert(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const nextMode = layoutMode === 'light' ? 'dark' : 'light';
    dispatch(changeLayoutMode(nextMode));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  const textColor = isDark ? '#E5E7EB' : '#1F2937';
  const labelColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* Settings Control Form */}
      <Box component="form" onSubmit={handleSaveProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: textColor, mb: 1, fontFamily: 'Inter, sans-serif' }}>
          Account Configuration
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textColor, mb: -1, fontFamily: 'Inter, sans-serif' }}>
          Edit Profile Details
        </Typography>

        <TextField
          label="Display Name"
          variant="outlined"
          fullWidth
          value={profile.fullname}
          onChange={(e) => handleInputChange('fullname', e.target.value)}
          InputLabelProps={{ sx: { color: labelColor } }}
          inputProps={{ sx: { color: textColor } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: inputBg,
              '& fieldset': { borderColor: borderColor }
            }
          }}
        />

        <TextField
          label="Location"
          variant="outlined"
          fullWidth
          value={profile.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          InputLabelProps={{ sx: { color: labelColor } }}
          inputProps={{ sx: { color: textColor } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: inputBg,
              '& fieldset': { borderColor: borderColor }
            }
          }}
        />

        <TextField
          label="Bio"
          variant="outlined"
          multiline
          rows={3}
          fullWidth
          value={profile.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          InputLabelProps={{ sx: { color: labelColor } }}
          inputProps={{ sx: { color: textColor } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: inputBg,
              '& fieldset': { borderColor: borderColor }
            }
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={isDark} 
                onChange={handleThemeToggle} 
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ color: textColor }}>
                {isDark ? 'Dark Theme' : 'Light Theme'}
              </Typography>
            }
          />

          <Button 
            type="submit" 
            variant="contained" 
            disabled={saving}
            sx={{ px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save Updates'}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 4, borderColor: borderColor }} />

      {/* Security & Password Form Section */}
      <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textColor, mb: -1, fontFamily: 'Inter, sans-serif' }}>
          Security & Password
        </Typography>

        <TextField
          label="Current Password"
          variant="outlined"
          type={showCurrent ? 'text' : 'password'}
          fullWidth
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          InputLabelProps={{ sx: { color: labelColor } }}
          inputProps={{ sx: { color: textColor } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" sx={{ color: labelColor }}>
                  {showCurrent ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: inputBg,
              '& fieldset': { borderColor: borderColor }
            }
          }}
        />

        <TextField
          label="New Password"
          variant="outlined"
          type={showNew ? 'text' : 'password'}
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          InputLabelProps={{ sx: { color: labelColor } }}
          inputProps={{ sx: { color: textColor } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNew(!showNew)} edge="end" sx={{ color: labelColor }}>
                  {showNew ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: inputBg,
              '& fieldset': { borderColor: borderColor }
            }
          }}
        />

        <TextField
          label="Confirm New Password"
          variant="outlined"
          type={showConfirm ? 'text' : 'password'}
          fullWidth
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          InputLabelProps={{ sx: { color: labelColor } }}
          inputProps={{ sx: { color: textColor } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: labelColor }}>
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: inputBg,
              '& fieldset': { borderColor: borderColor }
            }
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={passwordSaving}
            sx={{ px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {passwordSaving ? 'Updating...' : 'Change Password'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
