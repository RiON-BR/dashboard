import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, CardMedia, Button, 
  IconButton, CircularProgress, Paper, Grid
} from '@mui/material';
import { 
  Favorite as FavoriteIcon, 
  ShoppingCart as CartIcon 
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';
import { useSelector } from 'react-redux';

export default function WishlistView() {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';
  const authUser = useSelector((state) => state.Auth.user);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getHeaders = useCallback(() => {
    const token = authUser?.token || authUser?.user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [authUser]);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const res = await axios.get(`${config.API_URL}/api/wishlist`, { headers });
      setWishlistItems(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemoveItem = async (productId) => {
    try {
      const headers = getHeaders();
      await axios.post(`${config.API_URL}/api/wishlist`, { productId }, { headers });
      triggerToast('Removed from wishlist!');
      loadWishlist();
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert(err.response?.data?.message || 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const headers = getHeaders();
      await axios.post(`${config.API_URL}/api/cart`, { productId, qty: 1 }, { headers });
      triggerToast('Added to cart!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FavoriteIcon sx={{ fontSize: '2rem', color: '#EF4444' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
            My Wishlist
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        ) : wishlistItems.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>
            <Typography variant="h6" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>
              Your wishlist is empty.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {wishlistItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  borderRadius: 3, 
                  border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                  bgcolor: isDark ? '#111827' : '#FFFFFF',
                  overflow: 'hidden'
                }}>
                  <IconButton
                    onClick={() => handleRemoveItem(item.productId)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' },
                      zIndex: 2
                    }}
                    color="error"
                  >
                    <FavoriteIcon />
                  </IconButton>

                  {item.imageData ? (
                    <CardMedia
                      component="img"
                      image={item.imageData}
                      alt={item.name}
                      sx={{ height: 200, objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ 
                      height: 200, 
                      bgcolor: isDark ? '#1F2937' : '#F3F4F6', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      color: isDark ? '#9CA3AF' : 'text.secondary'
                    }}>
                      No Image Available
                    </Box>
                  )}
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#60A5FA' : 'primary.main' }}>
                          ${item.price.toFixed(2)}
                        </Typography>
                      </Box>
                      {item.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2, color: isDark ? '#9CA3AF' : 'textSecondary' }}>
                          {item.description}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<CartIcon />}
                      onClick={() => handleAddToCart(item.productId)}
                      sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                      disabled={item.stockCount <= 0}
                    >
                      {item.stockCount <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

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
