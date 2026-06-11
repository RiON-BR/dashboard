import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, CircularProgress, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, Container
} from '@mui/material';
import { Delete as DeleteIcon, RssFeed as PostIcon } from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';

export default function AdminPosts() {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser'))?.token : '';
      const res = await axios.get(`${config.API_URL}/api/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setPosts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser'))?.token : '';
        await axios.delete(`${config.API_URL}/api/posts/${postId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setPosts(prev => prev.filter(p => p.id !== postId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete post');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: isDark ? '#0B0F19' : '#F8F9FA' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, height: '100vh', bgcolor: isDark ? '#0B0F19' : '#F8F9FA' }}>
        <Typography color="error" variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PostIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
            Post Moderation
          </Typography>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
          <TableContainer sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Author</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Caption</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Likes</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Comments</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} hover>
                    <TableCell sx={{ color: isDark ? '#9CA3AF' : '#475569' }}>{post.id}</TableCell>
                    <TableCell sx={{ color: isDark ? '#F3F4F6' : '#111927', fontWeight: 500 }}>{post.authorName}</TableCell>
                    <TableCell sx={{ color: isDark ? '#9CA3AF' : '#475569', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.caption || '(No caption)'}
                    </TableCell>
                    <TableCell sx={{ color: isDark ? '#F3F4F6' : '#111927' }}>{post.likesCount}</TableCell>
                    <TableCell sx={{ color: isDark ? '#F3F4F6' : '#111927' }}>{post.comments?.length || 0}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDeletePost(post.id)} color="error" size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: isDark ? '#9CA3AF' : '#64748b', py: 4 }}>
                      No posts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}
