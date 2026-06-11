import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Box, Typography, Button, 
  IconButton, Chip, Divider, TextField, List, ListItem, ListItemAvatar, 
  ListItemText, Avatar, CircularProgress 
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon, 
  Send as SendIcon 
} from '@mui/icons-material';
import { fetchBlogs, likeBlog, fetchBlogComments, addBlogComment } from '../../helpers/api/services/blogsService';
import { useSelector } from 'react-redux';

export default function BlogModal({ open, blogId, onClose }) {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!blogId) return;

    let mounted = true;
    
    // Load Blog details
    const loadBlogDetails = async () => {
      try {
        const res = await fetchBlogs();
        if (!mounted) return;
        const allBlogs = res.data || res || [];
        const found = allBlogs.find(b => b.id === blogId);
        if (found) {
          setBlog(found);
          setLiked(found.likedByUser);
          setLikesCount(found.likesCount);
        }
      } catch (err) {
        console.error('Error fetching blog details in modal:', err);
      } finally {
        if (mounted) setLoadingBlog(false);
      }
    };

    // Load Comments
    const loadComments = async () => {
      try {
        const res = await fetchBlogComments(blogId);
        if (!mounted) return;
        setComments(res.data || res || []);
      } catch (err) {
        console.error('Error fetching blog comments:', err);
      } finally {
        if (mounted) setLoadingComments(false);
      }
    };

    loadBlogDetails();
    loadComments();

    return () => {
      mounted = false;
    };
  }, [blogId]);

  const handleLikeToggle = async () => {
    if (!blog) return;
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

  if (loadingBlog) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#111827' : '#FFFFFF',
            color: isDark ? '#F3F4F6' : '#111927',
            backgroundImage: 'none'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  if (!blog) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#111827' : '#FFFFFF',
            color: isDark ? '#F3F4F6' : '#111927',
            backgroundImage: 'none'
          }
        }}
      >
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">Blog article not found.</Typography>
          <Button onClick={onClose} sx={{ mt: 2, color: isDark ? '#F3F4F6' : 'primary.main' }}>Close</Button>
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      scroll="body"
      PaperProps={{
        sx: { 
          borderRadius: 4, 
          overflow: 'hidden',
          bgcolor: isDark ? '#111827' : '#FFFFFF',
          color: isDark ? '#F3F4F6' : '#111927',
          backgroundImage: 'none'
        }
      }}
    >
      {/* Hero Banner Cover */}
      {blog.imageData ? (
        <Box sx={{ position: 'relative', width: '100%', height: 320, overflow: 'hidden' }}>
          <img 
            src={blog.imageData} 
            alt={blog.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <IconButton 
            onClick={onClose}
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              bgcolor: 'rgba(0,0,0,0.5)', 
              color: '#FFFFFF',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: isDark ? '#1F2937' : '#F9FAFB' }}>
          <IconButton onClick={onClose} sx={{ color: isDark ? '#F3F4F6' : 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Dialog Title / Header */}
      <DialogContent sx={{ px: 5, py: 4, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={blog.category} 
            color="primary" 
            variant="outlined" 
            sx={{ fontWeight: 600, mb: 1.5, borderRadius: 1.5, color: isDark ? '#60A5FA' : 'primary.main', borderColor: isDark ? '#374151' : '#E5E7EB' }} 
          />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              color: isDark ? '#F3F4F6' : '#111927', 
              lineHeight: 1.3,
              fontFamily: 'Inter, sans-serif',
              mb: 1
            }}
          >
            {blog.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, color: isDark ? '#9CA3AF' : 'text.secondary' }}>
            By <strong>{blog.authorName}</strong> &bull; Published {new Date(blog.createdAt).toLocaleDateString()} &bull; 👁️ {blog.clickCount} views
          </Typography>
        </Box>

        <Divider sx={{ mb: 4, borderColor: isDark ? '#374151' : '#E5E7EB' }} />

        {/* Content Body */}
        <Typography 
          variant="body1" 
          sx={{ 
            color: isDark ? '#D1D5DB' : '#374151', 
            fontSize: '1.05rem', 
            lineHeight: 1.8, 
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'pre-line',
            mb: 5
          }}
        >
          {blog.content}
        </Typography>

        <Divider sx={{ mb: 3, borderColor: isDark ? '#374151' : '#E5E7EB' }} />

        {/* Engagement Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            variant="outlined"
            onClick={handleLikeToggle}
            color={liked ? 'error' : 'inherit'}
            startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              px: 3,
              color: liked ? 'error.main' : (isDark ? '#F3F4F6' : 'inherit'),
              borderColor: liked ? 'error.main' : (isDark ? '#374151' : '#E5E7EB')
            }}
          >
            {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
          </Button>
        </Box>

        {/* Threaded Comments Section */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: isDark ? '#F3F4F6' : '#111927' }}>
            Discussion ({comments.length})
          </Typography>

          {/* Comment text input */}
          <Box component="form" onSubmit={handleAddComment} sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
              U
            </Avatar>
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              <TextField
                placeholder="Join the discussion..."
                fullWidth
                size="small"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                InputLabelProps={{
                  sx: { color: isDark ? '#9CA3AF' : 'text.secondary' }
                }}
                inputProps={{
                  sx: { color: isDark ? '#F3F4F6' : '#111927' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' },
                    '&:hover fieldset': { borderColor: isDark ? '#60A5FA' : 'primary.main' }
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ borderRadius: 2.5, minWidth: 48, p: 0 }}
              >
                <SendIcon fontSize="small" />
              </Button>
            </Box>
          </Box>

          {/* Comments List */}
          {loadingComments ? (
            <CircularProgress size={24} />
          ) : comments.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2, fontStyle: 'italic', color: isDark ? '#9CA3AF' : 'textSecondary' }}>
              No comments posted yet. Be the first to share your thoughts!
            </Typography>
          ) : (
            <List disablePadding>
              {comments.map((comment, index) => (
                <Box key={comment.id || index}>
                  <ListItem disableGutters alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 600, fontSize: '0.85rem' }}>
                        {String(comment.username || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#F3F4F6' : '#111927' }}>
                            {comment.username}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: isDark ? '#D1D5DB' : '#374151', lineHeight: 1.5 }}>
                          {comment.commentText}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < comments.length - 1 && <Divider component="li" sx={{ borderColor: isDark ? '#374151' : '#F3F4F6' }} />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
