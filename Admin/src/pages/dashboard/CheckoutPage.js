import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Container, Typography, Card, Button, 
  CircularProgress, Paper, Divider, TextField
} from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { setActiveTab } from '../../redux/actions';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';
  const authUser = useSelector((state) => state.Auth.user);

  // Checks if direct checkout was triggered for a specific product
  const directProduct = location.state?.product || null;

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const getHeaders = useCallback(() => {
    const token = authUser?.token || authUser?.user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [authUser]);

  useEffect(() => {
    // If not a direct product purchase, fetch cart items
    if (!directProduct) {
      const loadCart = async () => {
        setLoading(true);
        try {
          const headers = getHeaders();
          const res = await axios.get(`${config.API_URL}/api/cart`, { headers });
          setCartItems(res.data || []);
        } catch (err) {
          console.error('Failed to load cart items for checkout:', err);
        } finally {
          setLoading(false);
        }
      };
      loadCart();
    }
  }, [directProduct, getHeaders]);

  const calculateSubtotal = () => {
    if (directProduct) {
      return directProduct.price;
    }
    return cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      alert("Please enter a shipping address.");
      return;
    }

    setIsProcessingPayment(true);

    // Simulate 2-second payment gateway processing
    setTimeout(async () => {
      try {
        const headers = getHeaders();
        const payload = { address };
        
        if (directProduct) {
          payload.productId = directProduct.id;
          payload.qty = 1;
        }

        await axios.post(`${config.API_URL}/api/orders/checkout`, payload, { headers });
        
        setIsProcessingPayment(false);
        
        // Update active tab to orders and redirect to dashboard
        dispatch(setActiveTab('orders'));
        navigate('/dashboard');
      } catch (err) {
        console.error('Checkout/Payment failed:', err);
        alert(err.response?.data?.message || 'Payment processing failed');
        setIsProcessingPayment(false);
      }
    }, 2000);
  };

  const flatDeliveryFee = 5.00;
  const subtotal = calculateSubtotal();
  const grandTotal = subtotal + flatDeliveryFee;

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PaymentIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Secure Checkout
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: isDark ? '#374151' : '#E5E7EB' }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Order Items Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#E5E7EB' : '#374151' }}>
                  Items Summary
                </Typography>
                {directProduct ? (
                  <Typography variant="body2" sx={{ color: isDark ? '#9CA3AF' : 'text.secondary' }}>
                    1x {directProduct.name} - ${directProduct.price.toFixed(2)}
                  </Typography>
                ) : (
                  cartItems.map(item => (
                    <Typography key={item.id} variant="body2" sx={{ color: isDark ? '#9CA3AF' : 'text.secondary', mb: 0.5 }}>
                      {item.qty}x {item.name} - ${(item.price * item.qty).toFixed(2)}
                    </Typography>
                  ))
                )}
              </Box>

              {/* Price Breakdown */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'text.secondary' }}>Items Subtotal</Typography>
                  <Typography sx={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'text.secondary' }}>Flat Delivery Fee</Typography>
                  <Typography sx={{ fontWeight: 600 }}>${flatDeliveryFee.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1, borderColor: isDark ? '#374151' : '#E5E7EB' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    ${grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Address Form */}
              <form onSubmit={handlePayNow}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#E5E7EB' : '#374151' }}>
                    Shipping Address
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full shipping address..."
                    required
                    InputLabelProps={{ sx: { color: isDark ? '#9CA3AF' : 'text.secondary' } }}
                    inputProps={{ sx: { color: isDark ? '#F3F4F6' : '#111927' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isDark ? '#1F2937' : '#FFFFFF',
                        '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' },
                        '&:hover fieldset': { borderColor: isDark ? '#60A5FA' : 'primary.main' }
                      }
                    }}
                  />
                </Box>

                {/* Submit Actions */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/dashboard')}
                    disabled={isProcessingPayment}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isProcessingPayment}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1, color: '#FFFFFF' }} />
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                </Box>
              </form>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
