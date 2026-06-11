import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Container, Grid, Card, CardContent, CardMedia, Typography, 
  Button, TextField, IconButton, CircularProgress, Paper
} from '@mui/material';
import { Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input, Row, Col, Button as RSButton } from 'reactstrap';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon, 
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';
import { getCurrentUserRole, getCurrentUserId } from '../../helpers/roleUtils';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function ProductsView({ filterMyOnly = false }) {
  const navigate = useNavigate();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [products, setProducts] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth User Details
  const authUser = useSelector((state) => state.Auth.user);
  const currentUserId = getCurrentUserId() || authUser?.id || authUser?.user?.id;
  const userRole = getCurrentUserRole() ? String(getCurrentUserRole()).toLowerCase() : '';

  // Add Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [image, setImage] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  // Toast State
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

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const url = filterMyOnly 
        ? `${config.API_URL}/api/products/my-products` 
        : `${config.API_URL}/api/products`;
      
      const res = await axios.get(url, { headers });
      setProducts(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filterMyOnly, getHeaders]);

  const loadWishlist = useCallback(async () => {
    try {
      const headers = getHeaders();
      const res = await axios.get(`${config.API_URL}/api/wishlist`, { headers });
      setWishlistItems(res.data || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadProducts();
    if (!filterMyOnly) {
      loadWishlist();
    }
  }, [loadProducts, loadWishlist, filterMyOnly]);

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

  const handleToggleWishlist = async (productId) => {
    try {
      const headers = getHeaders();
      const res = await axios.post(`${config.API_URL}/api/wishlist`, { productId }, { headers });
      triggerToast(res.data?.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist!');
      loadWishlist();
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      alert(err.response?.data?.message || 'Failed to toggle wishlist');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || price === '' || stockCount === '') {
      alert('Product Name, Price, and Stock Count are required');
      return;
    }

    try {
      const headers = getHeaders();
      const payload = {
        name,
        description,
        price: Number(price),
        stockCount: Number(stockCount),
        imageData: image
      };

      await axios.post(`${config.API_URL}/api/products`, payload, { headers });
      
      setModalOpen(false);
      setName('');
      setDescription('');
      setPrice('');
      setStockCount('');
      setImage('');
      triggerToast('Product listing created successfully!');
      loadProducts();
    } catch (err) {
      console.error('Failed to add product:', err);
      alert(err.response?.data?.message || 'Failed to create product listing');
    }
  };

  const handleStartEdit = (prod) => {
    setEditingId(prod.id);
    setEditPrice(prod.price);
    setEditStock(prod.stockCount);
  };

  const handleSaveEdit = async (productId) => {
    if (editPrice === '' || editStock === '') {
      alert('Price and Stock Count are required');
      return;
    }

    try {
      const headers = getHeaders();
      const payload = {
        price: Number(editPrice),
        stockCount: Number(editStock)
      };

      await axios.put(`${config.API_URL}/api/products/${productId}`, payload, { headers });
      
      setEditingId(null);
      triggerToast('Product updated successfully!');
      loadProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
      alert(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const headers = getHeaders();
      await axios.delete(`${config.API_URL}/api/products/${productId}`, { headers });
      triggerToast('Product deleted successfully!');
      loadProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleBuyProduct = (prod) => {
    navigate('/checkout', { state: { product: prod } });
  };

  // Filter out the seller's own products in "All Products" for sellers
  const displayedProducts = products.filter(prod => {
    if (!filterMyOnly && userRole === 'seller') {
      // Sellers can buy products listed by other sellers
      return Number(prod.sellerId) !== Number(currentUserId);
    }
    return true;
  });

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg">
        {/* Header Block */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
              {filterMyOnly ? 'My Store Listings' : 'Marketplace'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, color: isDark ? '#9CA3AF' : 'textSecondary', fontFamily: 'Inter, sans-serif' }}>
              {filterMyOnly 
                ? 'Create, manage, and edit your e-commerce product inventories.' 
                : 'Browse, select, and buy goods listed across the network.'}
            </Typography>
          </Box>
          {(userRole === 'seller' || userRole === 'admin') && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setModalOpen(true)}
                sx={{ 
                  borderRadius: 2.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                Add New Product
              </Button>
            </Box>
          )}
        </Box>

        {/* Loading / Error States */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={loadProducts} sx={{ mt: 2 }}>Retry</Button>
          </Paper>
        ) : displayedProducts.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', borderRadius: 3, bgcolor: isDark ? '#111827' : '#FFFFFF' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2, color: isDark ? '#9CA3AF' : 'textSecondary' }}>
              {filterMyOnly ? 'No products listed yet.' : 'No available products in the marketplace.'}
            </Typography>
            {filterMyOnly && (userRole === 'seller' || userRole === 'admin') && (
              <Button variant="outlined" onClick={() => setModalOpen(true)}>Create Your First Listing</Button>
            )}

          </Paper>
        ) : (
          <Grid container spacing={2}>
            {displayedProducts.map((prod) => {
              const isEditing = editingId === prod.id;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={prod.id}>
                  <Card sx={{ 
                    position: 'relative',
                    height: '100%', 
                    maxWidth: 320,
                    mx: 'auto',
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.03)', 
                    border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                    bgcolor: isDark ? '#111827' : '#FFFFFF',
                    overflow: 'hidden'
                  }}>
                    {!filterMyOnly && (
                      <IconButton
                        onClick={() => handleToggleWishlist(prod.id)}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                          '&:hover': { bgcolor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)' },
                          zIndex: 3
                        }}
                        color="error"
                      >
                        {wishlistItems.some(w => Number(w.productId) === Number(prod.id)) ? (
                          <FavoriteIcon />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                    )}

                    {/* Strict 1:1 aspect-ratio square media layer */}
                    <Box sx={{ 
                      width: '100%', 
                      aspectRatio: '1/1', 
                      overflow: 'hidden', 
                      position: 'relative',
                      borderBottom: '1px solid',
                      borderColor: isDark ? '#374151' : '#E5E7EB'
                    }}>
                      {/* Dynamic retail badges */}
                      <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {prod.stockCount === 0 ? (
                          <Paper elevation={0} sx={{ px: 1, py: 0.25, bgcolor: '#EF4444', color: '#FFFFFF', borderRadius: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Sold Out
                          </Paper>
                        ) : prod.stockCount <= 5 ? (
                          <Paper elevation={0} sx={{ px: 1, py: 0.25, bgcolor: '#F59E0B', color: '#FFFFFF', borderRadius: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Limited Stock
                          </Paper>
                        ) : (
                          <Paper elevation={0} sx={{ px: 1, py: 0.25, bgcolor: '#10B981', color: '#FFFFFF', borderRadius: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Best Seller
                          </Paper>
                        )}
                      </Box>
                      {prod.imageData ? (
                        <CardMedia
                          component="img"
                          image={prod.imageData}
                          alt={prod.name}
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                            '&:hover': { transform: 'scale(1.03)' }
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          width: '100%', 
                          height: '100%', 
                          bgcolor: isDark ? '#1F2937' : '#F3F4F6', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          color: isDark ? '#9CA3AF' : 'text.secondary'
                        }}>
                          No Image Available
                        </Box>
                      )}
                    </Box>

                    {/* Borderless and divider-free content segment */}
                    <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Bold headline title */}
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'left', mb: 0.5 }}>
                        {prod.name}
                      </Typography>

                      {/* Product description (ellipsized to fit) */}
                      {prod.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: isDark ? '#9CA3AF' : '#6B7280', 
                            mb: 1, 
                            textAlign: 'left',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.85rem'
                          }}
                        >
                          {prod.description}
                        </Typography>
                      )}

                      {/* Stock Status & Seller details above footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          Seller: {prod.sellerName || 'user2'}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          color: prod.stockCount > 5 ? '#10B981' : prod.stockCount > 0 ? '#F59E0B' : '#EF4444' 
                        }}>
                          {prod.stockCount > 5 ? 'In Stock' : prod.stockCount > 0 ? 'Limited Stock' : 'Out of Stock'}
                        </Typography>
                      </Box>

                      {/* Edit Fields (if seller is editing their own list) */}
                      {isEditing && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1.5 }}>
                          <TextField
                            label="Price ($)"
                            size="small"
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            InputLabelProps={{ sx: { color: isDark ? '#9CA3AF' : 'text.secondary' } }}
                            inputProps={{ sx: { color: isDark ? '#F3F4F6' : '#111927' } }}
                            sx={{
                              flexGrow: 1,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' }
                              }
                            }}
                          />
                          <TextField
                            label="Stock"
                            size="small"
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            InputLabelProps={{ sx: { color: isDark ? '#9CA3AF' : 'text.secondary' } }}
                            inputProps={{ sx: { color: isDark ? '#F3F4F6' : '#111927' } }}
                            sx={{
                              flexGrow: 1,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: isDark ? '#374151' : '#E5E7EB' }
                              }
                            }}
                          />
                        </Box>
                      )}

                      {/* Base Footer Row: Price tag alongside compact action items */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap' }}>
                          ${prod.price.toFixed(2)}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1 }}>
                          {filterMyOnly && (userRole === 'seller' || userRole === 'admin') ? (
                            isEditing ? (
                              <>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<SaveIcon />}
                                  onClick={() => handleSaveEdit(prod.id)}
                                  sx={{ textTransform: 'none', borderRadius: '4px', fontWeight: 600, py: 0.5, px: 1, fontSize: '0.75rem' }}
                                >
                                  Save
                                </Button>
                                <IconButton 
                                  color="error" 
                                  size="small" 
                                  onClick={() => setEditingId(null)}
                                  sx={{ border: '1px solid', borderRadius: '4px', borderColor: isDark ? '#EF4444' : 'error.main', p: 0.5 }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleStartEdit(prod)}
                                  sx={{ textTransform: 'none', borderRadius: '4px', fontWeight: 600, py: 0.5, px: 1, fontSize: '0.75rem' }}
                                >
                                  Edit
                                </Button>
                                <IconButton 
                                  color="error" 
                                  size="small" 
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this product?')) {
                                      handleDeleteProduct(prod.id);
                                    }
                                  }}
                                  sx={{ border: '1px solid', borderRadius: '4px', borderColor: isDark ? '#EF4444' : 'error.main', p: 0.5 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )
                          ) : (
                            <>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => handleAddToCart(prod.id)}
                                disabled={prod.stockCount === 0}
                                sx={{ textTransform: 'none', borderRadius: '4px', fontWeight: 600, px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                              >
                                Add to Cart
                              </Button>
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleBuyProduct(prod)}
                                disabled={prod.stockCount === 0}
                                sx={{ textTransform: 'none', borderRadius: '4px', fontWeight: 600, px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                              >
                                Buy Now
                              </Button>
                            </>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Add Product Modal */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
          <ModalHeader toggle={() => setModalOpen(false)}>
            Add New Product Listing
          </ModalHeader>
          <ModalBody>
            <Form onSubmit={handleAddProduct}>
              <FormGroup className="mb-3">
                <Label for="productName">Product Name</Label>
                <Input
                  type="text"
                  id="productName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </FormGroup>
              <FormGroup className="mb-3">
                <Label for="description">Description</Label>
                <Input
                  type="textarea"
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                />
              </FormGroup>
              <Row>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <Label for="price">Price ($)</Label>
                    <Input
                      type="number"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <Label for="stockCount">Initial Stock Count</Label>
                    <Input
                      type="number"
                      id="stockCount"
                      value={stockCount}
                      onChange={(e) => setStockCount(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup className="mb-3">
                <Label for="imageUpload">Product Image</Label>
                <Input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mb-2"
                />
                {image && (
                  <div className="mt-2 text-center">
                    <img 
                      src={image} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: '1px solid #E5E7EB' }} 
                    />
                  </div>
                )}
              </FormGroup>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <RSButton type="button" color="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </RSButton>
                <RSButton type="submit" color="primary">
                  Create Listing
                </RSButton>
              </div>
            </Form>
          </ModalBody>
        </Modal>
      </Container>

      {/* Success Toast Notification */}
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
