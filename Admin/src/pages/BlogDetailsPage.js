import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, AppBar, Toolbar, Avatar, Chip,
  TextField, List, ListItem, ListItemAvatar, ListItemText, Divider,
  Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { fetchBlogById, likeBlog, fetchBlogComments, addBlogComment, clickBlog } from '../helpers/api/services/blogsService';
import logo from "../assets/images/logo.svg";
import avatar1 from '../assets/images/users/avatar-1.jpg';

export default function BlogDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: blog?.title || 'Check out this article!',
      text: blog?.content ? blog.content.substring(0, 100) + '...' : '',
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error invoking native share:', err);
        }
      }
    } else {
      setShareModalOpen(true);
    }
  };

  useEffect(() => {
    const authUser = localStorage.getItem('authUser');
    setIsAuthenticated(!!authUser);

    if (!id) return;

    // Log the click count
    const logClick = async () => {
      try {
        await clickBlog(id);
      } catch (e) {
        console.error('Failed to log click interaction:', e);
      }
    };
    logClick();

    // Fetch blog details
    const getBlogDetails = async () => {
      try {
        const res = await fetchBlogById(id);
        const data = res.data || res;
        setBlog(data);
        setLiked(data.likedByUser);
        setLikesCount(data.likesCount);
      } catch (err) {
        console.error("Failed to load blog details:", err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch comments
    const getComments = async () => {
      try {
        const res = await fetchBlogComments(id);
        setComments(res.data || res || []);
      } catch (err) {
        console.error("Failed to load blog comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    getBlogDetails();
    getComments();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!blog) return;
    if (!isAuthenticated) {
      alert('Please log in to like this post.');
      navigate('/login');
      return;
    }
    try {
      const res = await likeBlog(blog.id);
      const data = res.data || res;
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !blog) return;
    if (!isAuthenticated) {
      alert('Please log in to add a comment.');
      navigate('/login');
      return;
    }

    try {
      const res = await addBlogComment(blog.id, newComment);
      const postedComment = res.data || res;
      setComments(prev => [...prev, {
        id: postedComment.id,
        username: postedComment.username,
        commentText: postedComment.commentText,
        createdAt: postedComment.createdAt
      }]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#FAFBFC' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!blog) {
    return (
      <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#FAFBFC', height: '100vh' }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>Blog article not found.</Typography>
        <Button variant="contained" onClick={() => navigate('/')} startIcon={<ArrowBackIcon />}>Back to Home</Button>
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isAuthenticated ? (
              <Button 
                variant="contained" 
                onClick={navigateToLogin}
                sx={{ 
                  bgcolor: '#7269ef', 
                  borderRadius: 2.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#5b52db', boxShadow: 'none' } 
                }}
              >
                Login / Register
              </Button>
            ) : (
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
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container maxWidth="md" sx={{ py: 6, flexGrow: 1 }}>
        <Button 
          variant="text" 
          onClick={() => {
            // If they came from dashboard, go back there, else go home
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 4, textTransform: 'none', color: '#64748B', fontWeight: 600 }}
        >
          Back
        </Button>

        <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: 'none', overflow: 'hidden' }}>
          {/* Hero Banner Cover */}
          {blog.imageData && (
            <Box sx={{ width: '100%', maxHeight: 400, borderRadius: 3, overflow: 'hidden', mb: 4 }}>
              <img 
                src={blog.imageData} 
                alt={blog.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          )}

          {/* Article Header Info */}
          <Box sx={{ mb: 3 }}>
            <Chip 
              label={blog.category} 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 600, mb: 1.5, borderRadius: 1.5 }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 850, 
                color: '#1E293B', 
                lineHeight: 1.3,
                fontFamily: 'Inter, sans-serif',
                mb: 2,
                fontSize: { xs: '1.8rem', sm: '2.5rem' }
              }}
            >
              {blog.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={avatar1} sx={{ width: 36, height: 36 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  By {blog.authorName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Published {new Date(blog.createdAt).toLocaleDateString()} &bull; 👁️ {blog.clickCount} views
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Content Body */}
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#334155', 
              fontSize: '1.1rem', 
              lineHeight: 1.85, 
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'pre-line',
              mb: 5
            }}
          >
            {blog.content}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Engagement Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              variant="outlined"
              onClick={handleLikeToggle}
              color={liked ? 'error' : 'inherit'}
              startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              sx={{ 
                borderRadius: 2.5, 
                textTransform: 'none', 
                fontWeight: 600,
                px: 3.5,
                py: 1,
                borderColor: liked ? 'error.main' : '#E2E8F0',
                mr: 2
              }}
            >
              {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleShare}
              color="inherit"
              startIcon={<ShareIcon />}
              sx={{ 
                borderRadius: 2.5, 
                textTransform: 'none', 
                fontWeight: 600,
                px: 3.5,
                py: 1,
                borderColor: '#E2E8F0',
                color: '#64748B'
              }}
            >
              Share
            </Button>
          </Box>

          {/* Threaded Comments Section */}
          <Box sx={{ mt: 5 }}>
            <Typography variant="h6" sx={{ fontWeight: 750, mb: 3, color: '#1E293B' }}>
              Discussion ({comments.length})
            </Typography>

            {/* Comment text input */}
            <Box component="form" onSubmit={handleAddComment} sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#7269ef', fontWeight: 600 }}>
                {isAuthenticated ? 'U' : 'G'}
              </Avatar>
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                <TextField
                  placeholder={isAuthenticated ? "Join the discussion..." : "Please log in to leave a comment..."}
                  fullWidth
                  size="small"
                  disabled={!isAuthenticated}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={!isAuthenticated || !newComment.trim()}
                  sx={{ borderRadius: 2.5, minWidth: 48, p: 0, bgcolor: '#7269ef', '&:hover': { bgcolor: '#5b52db' } }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </Box>

            {/* Comments List */}
            {loadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : comments.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ py: 2, fontStyle: 'italic' }}>
                No comments posted yet. Be the first to share your thoughts!
              </Typography>
            ) : (
              <List disablePadding>
                {comments.map((comment, index) => (
                  <Box key={comment.id || index}>
                    <ListItem disableGutters alignItems="flex-start" sx={{ py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#94A3B8', fontWeight: 600, fontSize: '0.85rem' }}>
                          {String(comment.username || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                              {comment.username}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>
                            {comment.commentText}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < comments.length - 1 && <Divider component="li" sx={{ borderColor: '#F1F5F9' }} />}
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Footer copyright */}
      <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid #EAEFF4', bgcolor: '#FFFFFF', mt: 'auto' }}>
        <Typography variant="body2" color="textSecondary">
          &copy; {new Date().getFullYear()} Chatvia. All rights reserved. Crafted with passion.
        </Typography>
      </Box>
      {/* Fallback Share Dialog */}
      <Dialog open={shareModalOpen} onClose={() => setShareModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Share this article</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog?.title || '')}`, '_blank');
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Share on Twitter / X
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Share on Facebook
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Share on LinkedIn
            </Button>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareModalOpen(false);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Copy Link to Clipboard
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareModalOpen(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
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
          gap: '8px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
          <span>Blog URL copied to clipboard!</span>
        </div>
      )}
    </Box>
  );
}
