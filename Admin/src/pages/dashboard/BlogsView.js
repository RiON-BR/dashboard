import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Button, IconButton, Chip, Avatar, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as ViewIcon 
} from '@mui/icons-material';
import { fetchBlogs, fetchMyBlogs, createBlog, updateBlog, deleteBlog } from '../../helpers/api/services/blogsService';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '../../helpers/roleUtils';
import { useSelector } from 'react-redux';

export default function BlogsView({ filterMyOnly = false }) {
  const navigate = useNavigate();
  const isUserAdmin = isAdmin();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states for CRUD
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');


  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = filterMyOnly ? await fetchMyBlogs() : await fetchBlogs();
      setBlogs(res.data || res || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, [filterMyOnly]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);



  // Click row to view
  const handleViewBlog = (blog) => {
    navigate(`/blogs/${blog.id}`);
  };

  // Create / Edit handlers
  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('Technology');
    setFormImage('');
    setEditorOpen(true);
  };



  const handleOpenDirectEdit = (blog) => {
    navigate(`/blogs/edit/${blog.id}`);
  };

  const handleDirectDelete = async (blog) => {
    if (window.confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      try {
        await deleteBlog(blog.id);
        loadBlogs();
      } catch (err) {
        alert(err.message || 'Failed to delete blog');
      }
    }
  };

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

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Title and content are required');
      return;
    }

    const payload = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      imageData: formImage
    };

    try {
      if (editingBlog) {
        await updateBlog(editingBlog.id, payload);
      } else {
        await createBlog(payload);
      }
      setEditorOpen(false);
      loadBlogs();
    } catch (err) {
      alert(err.message || 'Failed to save blog');
    }
  };

  // Status Chip Maker
  const getStatusChip = (blog) => {
    const clicks = blog.clickCount || 0;
    const likes = blog.likesCount || 0;
    
    if (clicks > 15) {
      return <Chip label="Popular 🔥" color="error" size="small" sx={{ fontWeight: 600 }} />;
    } else if (likes > 5) {
      return <Chip label="Active 💬" color="primary" size="small" sx={{ fontWeight: 600 }} />;
    } else {
      return <Chip label="New" color="secondary" size="small" sx={{ fontWeight: 500 }} />;
    }
  };

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg">
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
              {filterMyOnly ? 'My Blog Articles' : 'Collective Feeds'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, color: isDark ? '#9CA3AF' : 'textSecondary', fontFamily: 'Inter, sans-serif' }}>
              {filterMyOnly ? 'Manage, edit, or delete your published pieces.' : 'Read and discover thoughts shared across the platform.'}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/blogs/create')}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              Write Article
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={loadBlogs} sx={{ mt: 2 }}>Retry</Button>
          </Paper>
        ) : blogs.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2, color: isDark ? '#9CA3AF' : 'textSecondary' }}>No blogs published yet.</Typography>
            <Button variant="outlined" onClick={() => navigate('/blogs/create')}>Publish the first post</Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', boxShadow: 'none', overflow: 'hidden', bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? '#1F2937' : '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>Cover</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>Author</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }} align="right">Interactions</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#F3F4F6' : '#374151', borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow 
                    key={blog.id} 
                    hover 
                    sx={{ 
                      cursor: 'pointer',
                      '& td, & th': { borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB' },
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    <TableCell onClick={() => handleViewBlog(blog)}>
                      <Avatar 
                        src={blog.imageData || ''} 
                        variant="rounded" 
                        sx={{ width: 48, height: 48, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleViewBlog(blog)} sx={{ maxWidth: 280 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#F3F4F6' : '#111927' }}>
                        {blog.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>
                        Created {new Date(blog.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => handleViewBlog(blog)}>
                      <Chip label={blog.category} size="small" variant="outlined" sx={{ color: isDark ? '#F3F4F6' : 'inherit', borderColor: isDark ? '#374151' : 'inherit' }} />
                    </TableCell>
                    <TableCell onClick={() => handleViewBlog(blog)}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {blog.authorName}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => handleViewBlog(blog)}>
                      {getStatusChip(blog)}
                    </TableCell>
                    <TableCell onClick={() => handleViewBlog(blog)} align="right">
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                        💖 {blog.likesCount} &nbsp;&nbsp; 👁️ {blog.clickCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Read Post">
                          <IconButton onClick={(e) => { e.stopPropagation(); handleViewBlog(blog); }} size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(filterMyOnly || isUserAdmin) && (
                          <>
                            {filterMyOnly && (
                              <Tooltip title="Edit Post">
                                <IconButton onClick={(e) => { e.stopPropagation(); handleOpenDirectEdit(blog); }} size="small" color="secondary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Post">
                              <IconButton onClick={(e) => { e.stopPropagation(); handleDirectDelete(blog); }} size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}



        {/* Write / Edit Article Dialog Modal */}
        <Dialog 
          open={editorOpen} 
          onClose={() => setEditorOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: isDark ? '#111827' : '#FFFFFF',
              color: isDark ? '#F3F4F6' : '#111927',
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: isDark ? '#F3F4F6' : '#111927' }}>
            {editingBlog ? 'Edit Blog Post' : 'Write New Blog Post'}
          </DialogTitle>
          <form onSubmit={handleSaveBlog}>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxHeight: '65vh', overflowY: 'auto', borderColor: isDark ? '#374151' : '#E5E7EB' }}>
              <TextField
                label="Article Title"
                variant="outlined"
                fullWidth
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                InputLabelProps={{
                  sx: { color: isDark ? '#9CA3AF' : 'text.secondary' }
                }}
                inputProps={{
                  sx: { color: isDark ? '#F3F4F6' : '#111927' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' },
                    '&:hover fieldset': { borderColor: isDark ? '#60A5FA' : 'primary.main' }
                  }
                }}
              />
              <TextField
                label="Category"
                variant="outlined"
                fullWidth
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Technology, Design, Life, Health, etc."
                required
                InputLabelProps={{
                  sx: { color: isDark ? '#9CA3AF' : 'text.secondary' }
                }}
                inputProps={{
                  sx: { color: isDark ? '#F3F4F6' : '#111927' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' },
                    '&:hover fieldset': { borderColor: isDark ? '#60A5FA' : 'primary.main' }
                  }
                }}
              />
              <TextField
                label="Content Body"
                variant="outlined"
                fullWidth
                multiline
                rows={8}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
                InputLabelProps={{
                  sx: { color: isDark ? '#9CA3AF' : 'text.secondary' }
                }}
                inputProps={{
                  sx: { color: isDark ? '#F3F4F6' : '#111927' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' },
                    '&:hover fieldset': { borderColor: isDark ? '#60A5FA' : 'primary.main' }
                  }
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: isDark ? '#F3F4F6' : '#111927' }}>
                  Cover Image
                </Typography>
                <Button variant="outlined" component="label" size="small" sx={{ mr: 2, color: isDark ? '#F3F4F6' : 'primary.main', borderColor: isDark ? '#374151' : 'primary.main' }}>
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {formImage && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={formImage} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }} 
                    />
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
              <Button onClick={() => setEditorOpen(false)} sx={{ color: isDark ? '#9CA3AF' : 'inherit' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                {editingBlog ? 'Save Changes' : 'Publish Article'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
}
