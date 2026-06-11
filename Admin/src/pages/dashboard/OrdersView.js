import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, CardMedia, Button, 
  CircularProgress, Paper, Divider, Grid, Rating, TextField
} from '@mui/material';
import { 
  LocalShipping as ShippingIcon, 
  Done as DoneIcon, 
  Inventory as PackIcon, 
  Launch as DispatchIcon,
  RateReview as ReviewIcon,
  ShoppingBag as OrderIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';
import { useSelector } from 'react-redux';

export default function OrdersView({ isSeller = false }) {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';
  const authUser = useSelector((state) => state.Auth.user);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews submission state
  const [reviewsState, setReviewsState] = useState({});

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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const url = isSeller 
        ? `${config.API_URL}/api/orders/received` 
        : `${config.API_URL}/api/orders`;
      const res = await axios.get(url, { headers });
      setOrders(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [isSeller, getHeaders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'Received') nextStatus = 'Packed';
    else if (currentStatus === 'Packed') nextStatus = 'Dispatched';
    else if (currentStatus === 'Dispatched') nextStatus = 'Delivered';

    if (!nextStatus) return;

    try {
      const headers = getHeaders();
      await axios.put(`${config.API_URL}/api/orders/${orderId}/status`, { status: nextStatus }, { headers });
      triggerToast(`Order marked as ${nextStatus}!`);
      loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleReviewChange = (orderId, field, value) => {
    setReviewsState(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const handleSubmitReview = async (orderId) => {
    const reviewData = reviewsState[orderId] || {};
    const rating = reviewData.rating || 5;
    const review = reviewData.review || '';

    try {
      const headers = getHeaders();
      await axios.put(`${config.API_URL}/api/orders/${orderId}/review`, { rating, review }, { headers });
      triggerToast('Review submitted successfully!');
      loadOrders();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const getStatusStep = (status) => {
    const steps = ['Received', 'Packed', 'Dispatched', 'Delivered'];
    return steps.indexOf(status);
  };

  const renderProgressSteps = (currentStatus) => {
    const steps = ['Received', 'Packed', 'Dispatched', 'Delivered'];
    const currentStep = getStatusStep(currentStatus);

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 10px', mt: 3, mb: 1 }}>
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isActive = idx === currentStep;

          return (
            <React.Fragment key={step}>
              <Box
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  minWidth: '80px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 1
                }}
              >
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  bgcolor: isActive ? 'primary.main' : isCompleted ? 'success.main' : (isDark ? '#374151' : '#E5E7EB'),
                  color: isCompleted ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280'),
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: isActive ? '0 0 0 4px rgba(47, 111, 235, 0.25)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {isCompleted ? <DoneIcon sx={{ fontSize: '1.1rem' }} /> : idx + 1}
                </Box>
                <Typography variant="caption" sx={{ mt: 1, fontWeight: isActive || isCompleted ? 700 : 500, color: isActive ? 'primary.main' : isCompleted ? (isDark ? '#E5E7EB' : '#111827') : 'text.secondary' }}>
                  {step}
                </Typography>
              </Box>
              {idx < steps.length - 1 && (
                <Box sx={{ 
                  flexGrow: 1, 
                  height: 3, 
                  bgcolor: idx < currentStep ? 'success.main' : (isDark ? '#374151' : '#E5E7EB'), 
                  mx: -1,
                  mt: -3,
                  transition: 'background-color 0.3s ease'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <OrderIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
            {isSeller ? 'Orders Received' : 'My Orders'}
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
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>
            <Typography variant="h6" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'textSecondary' }}>
              No orders found.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {orders.map((order) => {
              const reviewState = reviewsState[order.ORDER_ID] || {};
              const hasReviewed = order.RATING !== null && order.RATING !== undefined;

              return (
                <Card key={order.ORDER_ID} sx={{ 
                  borderRadius: 3, 
                  border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                  bgcolor: isDark ? '#111827' : '#FFFFFF',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      {/* Left: Product/Buyer Info */}
                      <Grid item xs={12} sm={4}>
                        {order.IMAGE_DATA && (
                          <CardMedia
                            component="img"
                            image={order.IMAGE_DATA}
                            alt={order.PRODUCT_NAME}
                            sx={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 2, mb: 1.5 }}
                          />
                        )}
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {order.PRODUCT_NAME}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ color: isDark ? '#9CA3AF' : 'text.secondary' }}>
                          Qty: {order.QTY} | Total: ${Number(order.TOTAL_AMOUNT || 0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, color: isDark ? '#9CA3AF' : 'text.secondary' }}>
                          Ordered on: {new Date(order.CREATED_AT).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: isDark ? '#1F2937' : '#F3F4F6', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                            Shipping Details:
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {order.ADDRESS}
                          </Typography>
                          {isSeller && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>
                              Buyer: {order.BUYER_NAME}
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Right: Progression & Actions */}
                      <Grid item xs={12} sm={8} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {/* Status Steps */}
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Status: <span style={{ color: order.ORDER_STATUS === 'Delivered' ? '#10B981' : '#2F6FEB' }}>{order.ORDER_STATUS}</span>
                            </Typography>
                            <Typography variant="caption" sx={{ px: 1.5, py: 0.5, bgcolor: order.PAYMENT_STATUS === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: order.PAYMENT_STATUS === 'Paid' ? 'success.main' : 'error.main', borderRadius: 2, fontWeight: 700 }}>
                              Payment: {order.PAYMENT_STATUS}
                            </Typography>
                          </Box>

                          {renderProgressSteps(order.ORDER_STATUS)}
                        </Box>

                        {/* Actions for Seller */}
                        {isSeller && order.ORDER_STATUS !== 'Delivered' && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            {order.ORDER_STATUS === 'Received' && (
                              <Button 
                                variant="contained" 
                                color="primary" 
                                startIcon={<PackIcon />}
                                onClick={() => handleUpdateStatus(order.ORDER_ID, 'Received')}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                Pack Item
                              </Button>
                            )}
                            {order.ORDER_STATUS === 'Packed' && (
                              <Button 
                                variant="contained" 
                                color="warning" 
                                startIcon={<DispatchIcon />}
                                onClick={() => handleUpdateStatus(order.ORDER_ID, 'Packed')}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                Dispatch
                              </Button>
                            )}
                            {order.ORDER_STATUS === 'Dispatched' && (
                              <Button 
                                variant="contained" 
                                color="success" 
                                startIcon={<ShippingIcon />}
                                onClick={() => handleUpdateStatus(order.ORDER_ID, 'Dispatched')}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                Mark Delivered
                              </Button>
                            )}
                          </Box>
                        )}

                        {/* Review actions for Buyer when Delivered */}
                        {!isSeller && order.ORDER_STATUS === 'Delivered' && (
                          <Box sx={{ mt: 3, p: 2, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', borderRadius: 2.5, bgcolor: isDark ? '#1F2937' : '#FAFAFA' }}>
                            {hasReviewed ? (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ReviewIcon color="success" /> Your Rating & Review
                                </Typography>
                                <Rating value={order.RATING} readOnly size="small" />
                                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                                  "{order.REVIEW || 'No written review.'}"
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                                  Review this Product
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <Typography variant="body2">Rating:</Typography>
                                  <Rating
                                    name={`rating-${order.ORDER_ID}`}
                                    value={reviewState.rating || 5}
                                    onChange={(e, val) => handleReviewChange(order.ORDER_ID, 'rating', val)}
                                  />
                                </Box>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Write your review here..."
                                  value={reviewState.review || ''}
                                  onChange={(e) => handleReviewChange(order.ORDER_ID, 'review', e.target.value)}
                                  InputProps={{
                                    sx: { 
                                      bgcolor: isDark ? '#111827' : '#FFFFFF',
                                      color: isDark ? '#F3F4F6' : '#111927'
                                    }
                                  }}
                                  sx={{ mb: 2 }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleSubmitReview(order.ORDER_ID)}
                                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  Submit Review
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
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
