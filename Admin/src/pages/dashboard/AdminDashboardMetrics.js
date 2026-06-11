import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Chart from 'react-apexcharts';
import { 
  Box, Container, Grid, Card, CardContent, Typography, Avatar, 
  Paper, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import { 
  People as PeopleIcon, 
  AssignmentTurnedIn as TasksIcon, 
  Book as BookIcon, 
  Chat as ChatIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { fetchAdminMetrics, fetchUsers, deleteUser } from '../../helpers/api/services/adminService';
import { fetchBlogs, deleteBlog } from '../../helpers/api/services/blogsService';
import axios from 'axios';
import config from '../../config';

export default function AdminDashboardMetrics() {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [blogsList, setBlogsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const rawToken = localStorage.getItem('authUser');
        const token = rawToken ? JSON.parse(rawToken)?.token : '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [metricsRes, usersRes, blogsRes, productsRes] = await Promise.all([
          fetchAdminMetrics(),
          fetchUsers(),
          fetchBlogs(),
          axios.get(`${config.API_URL}/api/products`, { headers })
        ]);
        if (mounted) {
          setMetrics(metricsRes.data || metricsRes);
          setUsersList(usersRes.data || usersRes || []);
          setBlogsList(blogsRes.data || blogsRes || []);
          setProductsList(productsRes.data || productsRes || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load dashboard data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);
        setUsersList(prev => prev.filter(u => (u.ID || u.id) !== userId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlog(blogId);
        setBlogsList(prev => prev.filter(b => b.id !== blogId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete blog');
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const rawToken = localStorage.getItem('authUser');
        const token = rawToken ? JSON.parse(rawToken)?.token : '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`${config.API_URL}/api/products/${productId}`, { headers });
        setProductsList(prev => prev.filter(p => p.id !== productId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#F8F9FA' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: '#F8F9FA', height: '100vh' }}>
        <Typography color="error" variant="h6">Error loading analytics: {error}</Typography>
      </Box>
    );
  }

  const {
    totalUsers = 0,
    totalTasks = 0,
    totalBlogs = 0,
    totalActiveChats = 0,
    totalLikes = 0,
    totalClicks = 0,
    priorityBreakdown = [],
    categoryBreakdown = []
  } = metrics || {};

  const textColor = isDark ? '#E5E7EB' : '#1F2937';
  const labelColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // 1. Monthly App Usage Chart Configs
  const monthlyAppUsageSeries = [
    { name: 'Active Visitors', data: [44, 55, 41, 56, 22, 43, 21, 17, 15, 13, 30, 48] },
    { name: 'API Requests (k)', data: [88, 110, 82, 112, 44, 86, 42, 34, 30, 26, 60, 96] }
  ];
  
  const monthlyAppUsageOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { colors: labelColor } }
    },
    yaxis: { labels: { style: { colors: labelColor } } },
    fill: { opacity: 1 },
    grid: { borderColor: gridBorderColor },
    legend: { labels: { colors: textColor } },
    colors: ['#2F6FEB', '#10B981'],
    theme: { mode: isDark ? 'dark' : 'light' }
  };

  // 2. Tasks Priority Chart Configs
  const taskPrioritySeries = [
    { name: 'Tasks Count', data: priorityBreakdown.map(p => p.CNT || 0) }
  ];

  const taskPriorityOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '50%', borderRadius: 3 } },
    dataLabels: { enabled: true, style: { colors: ['#fff'] } },
    xaxis: {
      categories: priorityBreakdown.map(p => p.PRIORITY ? p.PRIORITY.charAt(0).toUpperCase() + p.PRIORITY.slice(1).toLowerCase() : 'Normal'),
      labels: { style: { colors: labelColor } }
    },
    yaxis: { labels: { style: { colors: labelColor } } },
    grid: { borderColor: gridBorderColor },
    colors: ['#EF4444'],
    theme: { mode: isDark ? 'dark' : 'light' }
  };

  // 3. User Engagement Spline Area Chart Configs
  const engagementFlowSeries = [
    { name: 'Article Clicks', data: [totalClicks * 0.1, totalClicks * 0.15, totalClicks * 0.12, totalClicks * 0.2, totalClicks * 0.18, totalClicks * 0.11, totalClicks * 0.13].map(Math.round) },
    { name: 'Total Likes', data: [totalLikes * 0.08, totalLikes * 0.11, totalLikes * 0.09, totalLikes * 0.15, totalLikes * 0.12, totalLikes * 0.07, totalLikes * 0.09].map(Math.round) }
  ];

  const engagementFlowOptions = {
    chart: { type: 'area', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: labelColor } }
    },
    yaxis: { labels: { style: { colors: labelColor } } },
    grid: { borderColor: gridBorderColor },
    legend: { labels: { colors: textColor } },
    colors: ['#2F6FEB', '#EF4444'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  };

  // 4. Blogs Category Distribution Donut Chart Configs
  const blogCategorySeries = categoryBreakdown.map(c => c.CNT || 0);
  const blogCategoryOptions = {
    chart: { type: 'donut' },
    labels: categoryBreakdown.map(c => c.CATEGORY ? c.CATEGORY.charAt(0).toUpperCase() + c.CATEGORY.slice(1).toLowerCase() : 'General'),
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      labels: { colors: textColor }
    },
    colors: ['#2F6FEB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    theme: { mode: isDark ? 'dark' : 'light' }
  };

  const cellStyle = { 
    py: 0.5, 
    px: 1.5, 
    fontSize: '0.85rem',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' 
  };
  const headerCellStyle = { 
    ...cellStyle,
    bgcolor: isDark ? '#1F2937' : '#F3F4F6', 
    color: isDark ? '#F3F4F6' : '#111927', 
    fontWeight: 600 
  };

  const renderMetricCard = (title, value, icon, color, bgLight, badgeText, badgeIsSuccess) => (
    <Card sx={{ 
      borderRadius: 3, 
      boxShadow: '0 4px 12px 0 rgba(0,0,0,0.03)', 
      border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
      bgcolor: isDark ? '#111827' : '#FFFFFF',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8}>
            <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 600, letterSpacing: 0.5, fontSize: '0.75rem', color: isDark ? '#9CA3AF' : 'textSecondary' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700, color: isDark ? '#F3F4F6' : '#111927' }}>
              {value}
            </Typography>
            {/* Dynamic Metric Comparison Badge */}
            {badgeText && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', mt: 1, px: 1, py: 0.25, borderRadius: '4px', bgcolor: badgeIsSuccess ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#E6FAF4') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEECEB') }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: badgeIsSuccess ? '#10B981' : '#EF4444' }}>
                  {badgeText}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Avatar sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : bgLight, color: color, width: 56, height: 56, borderRadius: 2 }}>
              {icon}
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ py: 2, px: 3, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', color: isDark ? '#F3F4F6' : '#111927', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, color: isDark ? '#9CA3AF' : 'textSecondary', fontFamily: 'Inter, sans-serif' }}>
            Operational metrics and real-time user engagement control center.
          </Typography>
        </Box>

        {/* 4 Cards Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            {renderMetricCard('Total Users', totalUsers, <PeopleIcon sx={{ fontSize: '1.8rem' }} />, '#2F6FEB', '#EBF2FE', '+12% vs last month', true)}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderMetricCard('Total Active Chats', totalActiveChats, <ChatIcon sx={{ fontSize: '1.8rem' }} />, '#10B981', '#E6FAF4', '+5% vs last week', true)}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderMetricCard('Total Blogs Published', totalBlogs, <BookIcon sx={{ fontSize: '1.8rem' }} />, '#F59E0B', '#FEF8EB', '+20% vs last month', true)}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderMetricCard('Total Tasks Created', totalTasks, <TasksIcon sx={{ fontSize: '1.8rem' }} />, '#EF4444', '#FEECEB', '-8% decrease', false)}
          </Grid>
        </Grid>

        {/* Analytics Charts - 2x2 Grid Matrix */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Monthly App Usage (Clustered Vertical Bar Chart) */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927', textAlign: 'left' }}>
                Monthly App Usage (Traffic)
              </Typography>
              <Chart 
                options={monthlyAppUsageOptions}
                series={monthlyAppUsageSeries}
                type="bar"
                height={260}
              />
            </Paper>
          </Grid>

          {/* Tasks Priority Breakdown (Horizontal Bar Chart) */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927', textAlign: 'left' }}>
                Tasks Priority Breakdown
              </Typography>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                <Chart 
                  options={taskPriorityOptions}
                  series={taskPrioritySeries}
                  type="bar"
                  height={260}
                  width="100%"
                />
              </Box>
            </Paper>
          </Grid>

          {/* User Engagement Flow (Spline Area Chart) */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927', textAlign: 'left' }}>
                User Engagement Flow
              </Typography>
              <Chart 
                options={engagementFlowOptions}
                series={engagementFlowSeries}
                type="area"
                height={260}
              />
            </Paper>
          </Grid>

          {/* Blogs Category Distribution Donut */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927', textAlign: 'left' }}>
                Blogs Category Distribution
              </Typography>
              {categoryBreakdown.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, height: 260 }}>
                  <Typography variant="body2" color="textSecondary">No blog data available.</Typography>
                </Box>
              ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Chart 
                    options={blogCategoryOptions}
                    series={blogCategorySeries}
                    type="donut"
                    height={260}
                    width="100%"
                  />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* System Users and Published Blogs Tables */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* Users Table */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927' }}>
                System Users
              </Typography>
              <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellStyle}>ID</TableCell>
                      <TableCell sx={headerCellStyle}>Name</TableCell>
                      <TableCell sx={headerCellStyle}>Email</TableCell>
                      <TableCell sx={headerCellStyle}>Role</TableCell>
                      <TableCell sx={headerCellStyle}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersList.map((user) => {
                      const id = user.ID || user.id;
                      const email = user.EMAIL || user.email;
                      const role = user.ROLE || user.role;
                      const displayName = user.DISPLAY_NAME || user.displayName || user.username || user.USERNAME || email;
                      return (
                        <TableRow key={id} hover>
                          <TableCell sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#475569' }}>{id}</TableCell>
                          <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927', fontWeight: 500 }}>{displayName}</TableCell>
                          <TableCell sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#475569' }}>{email}</TableCell>
                          <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927', textTransform: 'capitalize' }}>{role}</TableCell>
                          <TableCell sx={cellStyle}>
                            <IconButton onClick={() => handleDeleteUser(id)} color="error" size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {usersList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#64748b', py: 4 }}>
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Blogs Table */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927' }}>
                Published Blogs
              </Typography>
              <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellStyle}>ID</TableCell>
                      <TableCell sx={headerCellStyle}>Title</TableCell>
                      <TableCell sx={headerCellStyle}>Author</TableCell>
                      <TableCell sx={headerCellStyle}>Category</TableCell>
                      <TableCell sx={headerCellStyle}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {blogsList.map((blog) => (
                      <TableRow key={blog.id} hover>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#475569' }}>{blog.id}</TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {blog.title}
                        </TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#475569' }}>{blog.authorName}</TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927' }}>{blog.category}</TableCell>
                        <TableCell sx={cellStyle}>
                          <IconButton onClick={() => handleDeleteBlog(blog.id)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {blogsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#64748b', py: 4 }}>
                          No blogs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Master Products Table */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', bgcolor: isDark ? '#111827' : '#FFFFFF', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#F3F4F6' : '#111927' }}>
                Platform Products
              </Typography>
              <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellStyle}>ID</TableCell>
                      <TableCell sx={headerCellStyle}>Name</TableCell>
                      <TableCell sx={headerCellStyle}>Seller</TableCell>
                      <TableCell sx={headerCellStyle}>Price</TableCell>
                      <TableCell sx={headerCellStyle}>Stock Left</TableCell>
                      <TableCell sx={headerCellStyle}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productsList.map((prod) => (
                      <TableRow key={prod.id} hover>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#475569' }}>{prod.id}</TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927', fontWeight: 500 }}>{prod.name}</TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#475569' }}>{prod.sellerName || `ID: ${prod.sellerId}`}</TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927' }}>${prod.price?.toFixed(2)}</TableCell>
                        <TableCell sx={{ ...cellStyle, color: isDark ? '#F3F4F6' : '#111927' }}>{prod.stockCount}</TableCell>
                        <TableCell sx={cellStyle}>
                          <IconButton onClick={() => handleDeleteProduct(prod.id)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {productsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ ...cellStyle, color: isDark ? '#9CA3AF' : '#64748b', py: 4 }}>
                          No products found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
