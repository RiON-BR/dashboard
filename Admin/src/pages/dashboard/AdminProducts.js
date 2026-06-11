import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, CircularProgress, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, Container
} from '@mui/material';
import { Delete as DeleteIcon, Store as StoreIcon } from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';

export default function AdminProducts() {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser'))?.token : '';
      const res = await axios.get(`${config.API_URL}/api/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product listing?')) {
      try {
        const token = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser'))?.token : '';
        await axios.delete(`${config.API_URL}/api/products/${productId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
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
          <StoreIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
            Product Moderation
          </Typography>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
          <TableContainer sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Seller</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Price</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Stock Left</TableCell>
                  <TableCell sx={{ bgcolor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#F3F4F6' : '#111927', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((prod) => (
                  <TableRow key={prod.id} hover>
                    <TableCell sx={{ color: isDark ? '#9CA3AF' : '#475569' }}>{prod.id}</TableCell>
                    <TableCell sx={{ color: isDark ? '#F3F4F6' : '#111927', fontWeight: 500 }}>{prod.name}</TableCell>
                    <TableCell sx={{ color: isDark ? '#9CA3AF' : '#475569' }}>{prod.sellerName || `ID: ${prod.sellerId}`}</TableCell>
                    <TableCell sx={{ color: isDark ? '#F3F4F6' : '#111927' }}>${prod.price?.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: isDark ? '#F3F4F6' : '#111927' }}>{prod.stockCount}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDeleteProduct(prod.id)} color="error" size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: isDark ? '#9CA3AF' : '#64748b', py: 4 }}>
                      No products found.
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
