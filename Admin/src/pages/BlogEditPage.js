import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, TextField, Paper, CircularProgress,
  Divider, AppBar, Toolbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { fetchBlogById, updateBlog, createBlog } from '../helpers/api/services/blogsService';
import logo from "../assets/images/logo.svg";

export default function BlogEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');

  useEffect(() => {
    const authUserStr = localStorage.getItem('authUser');
    if (!authUserStr) {
      alert(id ? 'Please log in to edit this blog.' : 'Please log in to write an article.');
      navigate('/login');
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    const authUser = JSON.parse(authUserStr);
    const userId = Number(authUser.id || authUser.userId || authUser.sub);

    const getBlogDetails = async () => {
      try {
        const res = await fetchBlogById(id);
        const data = res.data || res;
        
        // Ensure user is authorized to edit
        if (Number(data.userId) !== userId) {
          alert('You are not authorized to edit this blog.');
          navigate('/dashboard');
          return;
        }
        setFormTitle(data.title);
        setFormContent(data.content);
        setFormCategory(data.category);
        setFormImage(data.imageData || '');
      } catch (err) {
        console.error("Failed to load blog details for editing:", err);
        alert('Failed to load blog details.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    getBlogDetails();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);
    const payload = {
      title: formTitle,
      content: formContent,
      category: formCategory || 'General',
      imageData: formImage
    };

    try {
      if (id) {
        await updateBlog(id, payload);
        alert('Blog post updated successfully!');
      } else {
        await createBlog(payload);
        alert('Blog post created successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#FAFBFC' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header Navbar */}
      <AppBar position="sticky" sx={{ bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', boxShadow: 'none', borderBottom: '1px solid #EAEFF4' }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src={logo} alt="logo" height="30" />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#7269ef', letterSpacing: 0.5, fontFamily: 'Inter, sans-serif' }}>
              Chatvia
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              borderColor: '#7269ef',
              color: '#7269ef',
              borderRadius: 2.5, 
              textTransform: 'none', 
              fontWeight: 600,
              '&:hover': { borderColor: '#5b52db', bgcolor: 'rgba(114, 105, 239, 0.05)' } 
            }}
          >
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Container */}
      <Container maxWidth="md" sx={{ py: 6, flexGrow: 1 }}>
        <Button 
          variant="text" 
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 4, textTransform: 'none', color: '#64748B', fontWeight: 600 }}
        >
          Back
        </Button>

        <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', fontFamily: 'Inter, sans-serif', mb: 1 }}>
            {id ? 'Edit Blog Article' : 'Write New Blog Article'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
            {id ? 'Update your blog details. Click save to publish changes instantly.' : 'Share your ideas and published piece with the community.'}
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <form onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '65vh', overflowY: 'auto', pr: 1 }}>
              <TextField
                label="Article Title"
                variant="outlined"
                fullWidth
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />

              <TextField
                label="Category"
                variant="outlined"
                fullWidth
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Technology, Design, Life, Health, etc."
                required
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />

              <TextField
                label="Content Body"
                variant="outlined"
                fullWidth
                multiline
                rows={12}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>
                  Cover Image
                </Typography>
                <Button variant="outlined" component="label" sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Upload Cover Image
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {formImage && (
                  <Box sx={{ mt: 3, maxWidth: '100%', maxHeight: 300, overflow: 'hidden', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                    <img 
                      src={formImage} 
                      alt="Preview" 
                      style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} 
                    />
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  onClick={() => navigate(-1)} 
                  color="inherit" 
                  sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  sx={{ 
                    bgcolor: '#7269ef', 
                    borderRadius: 2.5, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#5b52db', boxShadow: 'none' } 
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : id ? 'Save Changes' : 'Publish Article'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
