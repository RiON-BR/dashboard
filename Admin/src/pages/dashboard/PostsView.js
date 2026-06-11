import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Container, Paper, Typography, Button, TextField, Avatar, Card, 
  CardHeader, CardContent, CardMedia, CardActions, IconButton, Divider, 
  List, ListItem, ListItemAvatar, ListItemText, Tooltip, CircularProgress
} from '@mui/material';
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon, 
  Comment as CommentIcon, 
  Share as ShareIcon,
  PhotoCamera as PhotoCameraIcon,
  Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';

export default function PostsView({ filterMyOnly = false }) {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCaption, setNewCaption] = useState('');
  const [newImage, setNewImage] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Get current auth user
  const authUserStr = localStorage.getItem('authUser');
  const authUser = authUserStr ? JSON.parse(authUserStr) : {};
  const currentUserName = authUser.name || authUser.email || 'Current User';

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const token = authUser.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint = filterMyOnly ? `${config.API_URL}/api/posts/my-posts` : `${config.API_URL}/api/posts`;
      const res = await axios.get(endpoint, { headers });
      const mapped = (res.data || []).map(p => ({
        ...p,
        isLiked: p.likedByUser || false,
        likes: p.likesCount || 0
      }));
      setPosts(mapped);
    } catch (err) {
      console.error('Failed to fetch posts from backend:', err);
    } finally {
      setLoading(false);
    }
  }, [filterMyOnly, authUser.token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newCaption.trim() && !newImage) {
      alert('Please write a caption or upload an image.');
      return;
    }

    try {
      const token = authUser.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        caption: newCaption,
        imageData: newImage
      };
      const res = await axios.post(`${config.API_URL}/api/posts`, payload, { headers });
      
      const newPost = {
        ...res.data,
        isLiked: res.data.likedByUser || false,
        likes: res.data.likesCount || 0
      };
      setPosts(prev => [newPost, ...prev]);
      setNewCaption('');
      setNewImage('');
      triggerToast('Post published successfully!');
    } catch (err) {
      console.error('Failed to create post:', err);
      alert(err.response?.data?.message || 'Failed to publish post');
    }
  };

  const handleLike = async (id) => {
    // Perform optimistic local state update instantly without layout lag
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    try {
      const token = authUser.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Post request to backend post liking controller route
      await axios.post(`${config.API_URL}/api/posts/${id}/like`, {}, { headers });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert optimistic update on network failure
      setPosts(prev => prev.map(p => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const token = authUser.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${config.API_URL}/api/posts/${postId}/comments`, { commentText }, { headers });
      
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), res.data]
          };
        }
        return post;
      }));

      setCommentInputs({
        ...commentInputs,
        [postId]: ''
      });
      triggerToast('Comment added!');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleCommentInputChange = (postId, val) => {
    setCommentInputs({
      ...commentInputs,
      [postId]: val
    });
  };

  const handleSharePost = async (post) => {
    const shareData = {
      title: 'Check out this post!',
      text: post.caption || '',
      url: `${window.location.origin}/posts/${post.id}`
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing post:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      triggerToast('Post share link copied to clipboard!');
    }
  };

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="sm">
        {/* Page Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
            {filterMyOnly ? 'My Posts Feed' : 'Community Feed'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: isDark ? '#9CA3AF' : 'textSecondary', fontFamily: 'Inter, sans-serif' }}>
            {filterMyOnly ? 'Updates and thoughts you shared.' : 'Discover updates, captions and pictures shared by everyone.'}
          </Typography>
        </Box>

        {/* Create Post Container */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
          <Box component="form" onSubmit={handleCreatePost}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
                {currentUserName.charAt(0).toUpperCase()}
              </Avatar>
              <TextField
                placeholder="What is on your mind?"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                InputLabelProps={{ sx: { color: isDark ? '#9CA3AF' : 'text.secondary' } }}
                inputProps={{ sx: { color: isDark ? '#F3F4F6' : '#111927' } }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: isDark ? '#1F2937' : '#FFFFFF',
                    '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' }
                  } 
                }}
              />
            </Box>
            
            {/* Image Preview */}
            {newImage && (
              <Box sx={{ position: 'relative', mb: 2, borderRadius: 2, overflow: 'hidden', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>
                <img src={newImage} alt="Upload preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => setNewImage('')}
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255, 255, 255, 0.8)', '&:hover': { bgcolor: 'white' } }}
                >
                  Remove
                </Button>
              </Box>
            )}

            <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                component="label"
                variant="text"
                startIcon={<PhotoCameraIcon />}
                sx={{ textTransform: 'none', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 600 }}
              >
                Upload Photo
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
              >
                Publish Post
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Posts List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Typography variant="body1" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>No posts in this feed yet.</Typography>
          </Paper>
        ) : (
          posts.map((post) => (
            <Card key={post.id} sx={{ mb: 4, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none', overflow: 'hidden' }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 600 }}>
                    {String(post.authorName || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#F3F4F6' : '#111927' }}>
                    {post.authorName}
                  </Typography>
                }
                subheader={
                  <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Typography>
                }
              />
              
              {post.imageData && (
                <Box sx={{ width: '100%', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={post.imageData}
                    alt="Post image"
                    sx={{ 
                      width: '100%',
                      maxHeight: 400, 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                  />
                </Box>
              )}

              <CardContent>
                <Typography variant="body1" sx={{ color: isDark ? '#E5E7EB' : '#374151', fontFamily: 'Inter, sans-serif' }}>
                  {post.caption}
                </Typography>
              </CardContent>

              <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              <CardActions sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    startIcon={post.isLiked ? <FavoriteIcon sx={{ color: '#EF4444' }} /> : <FavoriteBorderIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleLike(post.id);
                    }}
                    sx={{ color: post.isLiked ? '#EF4444' : (isDark ? '#9CA3AF' : '#64748B'), fontWeight: 600, textTransform: 'none' }}
                  >
                    {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<CommentIcon />}
                    onClick={() => toggleComments(post.id)}
                    sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 600, textTransform: 'none' }}
                  >
                    {post.comments ? post.comments.length : 0} Comments
                  </Button>
                </Box>
                <Tooltip title="Share Post Link">
                  <IconButton size="small" onClick={() => handleSharePost(post)} sx={{ color: isDark ? '#9CA3AF' : 'inherit' }}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>

              <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* Comments Section */}
              <Box sx={{ p: 2, bgcolor: isDark ? '#1F2937' : '#FAFBFB' }}>
                {/* List of Comments (collapsible behind toggle) */}
                {expandedComments[post.id] && post.comments && post.comments.length > 0 && (
                  <List disablePadding sx={{ mb: 2 }}>
                    {post.comments.map((comment) => (
                      <ListItem key={comment.id} disableGutters alignItems="flex-start" sx={{ py: 1 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#94A3B8' }}>
                            {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#F3F4F6' : '#1E293B' }}>
                                {comment.username}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: isDark ? '#9CA3AF' : 'textSecondary' }}>
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: isDark ? '#E5E7EB' : '#475569', fontSize: '0.825rem', mt: 0.25 }}>
                              {comment.commentText}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* New Comment Input always visible */}
                <Box component="form" onSubmit={(e) => handleAddComment(post.id, e)} sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Add a comment..."
                    size="small"
                    fullWidth
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                    InputLabelProps={{ sx: { color: isDark ? '#9CA3AF' : 'text.secondary' } }}
                    inputProps={{ sx: { color: isDark ? '#F3F4F6' : '#111927' } }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2.5, 
                        bgcolor: isDark ? '#111827' : 'white',
                        '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' }
                      } 
                    }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="small"
                    sx={{ borderRadius: 2.5, minWidth: 40, p: 0 }}
                  >
                    <SendIcon fontSize="small" />
                  </Button>
                </Box>
              </Box>
            </Card>
          ))
        )}
      </Container>

      {/* Toast Alert */}
      {showToast && (
        <Box 
          sx={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
          <span>{toastMsg}</span>
        </Box>
      )}
    </Box>
  );
}
