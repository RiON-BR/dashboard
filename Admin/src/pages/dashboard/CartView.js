import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, CardMedia, Button, 
  IconButton, CircularProgress, Paper, Divider, Grid, TextField
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveTab } from '../../redux/actions';

export default function CartView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';
  const authUser = useSelector((state) => state.Auth.user);

  const [cartItems, setCartItems] = useState([]);
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

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const res = await axios.get(`${config.API_URL}/api/cart`, { headers });
      setCartItems(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleUpdateQty = async (id, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) return;

    try {
      const headers = getHeaders();
      await axios.put(`${config.API_URL}/api/cart/${id}`, { qty: newQty }, { headers });
      loadCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      const headers = getHeaders();
      await axios.delete(`${config.API_URL}/api/cart/${id}`, { headers });
      triggerToast('Item removed from cart!');
      loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  };

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CartIcon sx={{ fontSize: '2rem' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
            Shopping Cart
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
        ) : cartItems.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>
            <Typography variant="h6" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>
              Your cart is empty.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {cartItems.map((item) => (
                  <Card key={item.id} sx={{ 
                    display: 'flex', 
                    borderRadius: 3, 
                    border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                    bgcolor: isDark ? '#111827' : '#FFFFFF',
                    overflow: 'hidden'
                  }}>
                    {item.imageData ? (
                      <CardMedia
                        component="img"
                        image={item.imageData}
                        alt={item.name}
                        sx={{ width: 140, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ 
                        width: 140, 
                        bgcolor: isDark ? '#1F2937' : '#F3F4F6', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        color: isDark ? '#9CA3AF' : 'text.secondary'
                      }}>
                        No Image
                      </Box>
                    )}
                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#60A5FA' : 'primary.main' }}>
                            ${(item.price * item.qty).toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, color: isDark ? '#9CA3AF' : 'textSecondary' }}>
                          Price: ${item.price.toFixed(2)} each
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', borderRadius: 2, px: 0.5 }}>
                          <IconButton size="small" onClick={() => handleUpdateQty(item.id, item.qty, -1)} disabled={item.qty <= 1}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1.5, fontWeight: 600 }}>{item.qty}</Typography>
                          <IconButton size="small" onClick={() => handleUpdateQty(item.id, item.qty, 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Order Summary
                </Typography>
                <Divider sx={{ my: 1.5, borderColor: isDark ? '#374151' : '#E5E7EB' }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Total Price</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>

                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  size="large"
                  onClick={handleCheckoutClick}
                  sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                >
                  Checkout
                </Button>
              </Paper>
            </Grid>
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
