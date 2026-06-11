import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, 
  Divider, Tooltip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Chat as ChatIcon, 
  Group as GroupIcon, 
  Contacts as ContactsIcon, 
  Assignment as AssignmentIcon, 
  Book as BookIcon, 
  Settings as SettingsIcon, 
  Person as PersonIcon, 
  Article as ArticleIcon,
  LibraryBooks as LibraryBooksIcon,
  Today as TodayIcon,
  History as HistoryIcon,
  RssFeed as RssFeedIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { setActiveTab } from '../redux/actions';
import { isAdmin, getCurrentUserRole } from '../helpers/roleUtils';

const drawerCollapsedWidth = 70;
const drawerExpandedWidth = 240;

export default function Sidebar() {
  const dispatch = useDispatch();
  const isUserAdmin = isAdmin();
  const userRole = getCurrentUserRole() ? String(getCurrentUserRole()).toLowerCase() : '';

  const activeTab = useSelector((state) => state.Layout.activeTab);
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';

  // Toggle states for headers
  const [blogsOpen, setBlogsOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [postsOpen, setPostsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const handleTabSelect = (tab) => {
    dispatch(setActiveTab(tab));
  };

  const isDark = layoutMode === 'dark';
  const sidebarBg = isDark ? '#1C2536' : '#FFFFFF';
  const sidebarColor = isDark ? '#9DA4AE' : '#495057';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  const activeBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const renderNavButton = (tabName, icon, label, isSub = false) => {
    const isSelected = activeTab === tabName;

    return (
      <ListItem disablePadding sx={{ mb: 0.5, justifyContent: 'center' }}>
        <Tooltip title={label} placement="right" arrow>
          <ListItemButton
            onClick={() => handleTabSelect(tabName)}
            aria-current={isSelected ? 'page' : undefined}
            sx={{
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              px: 2,
              width: '100%',
              height: isSub ? 38 : 48,
              position: 'relative',
              overflow: 'hidden',

              // hover / active
              color: isSelected ? (isDark ? 'common.white' : 'primary.main') : sidebarColor,
              backgroundColor: isSelected ? activeBg : 'transparent',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(114, 94, 229, 0.10)',
                color: isDark ? 'common.white' : 'primary.main',
              },
              transition: 'background-color 160ms ease, color 160ms ease',

              // left accent bar
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: '0 6px 6px 0',
                backgroundColor: isSelected ? (isDark ? 'primary.light' : 'primary.main') : 'transparent',
                transition: 'background-color 160ms ease',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 'auto',
                mr: 2,
                justifyContent: 'center',
                transition: 'color 160ms ease',
                color: isSelected ? (isDark ? 'primary.light' : 'primary.main') : sidebarColor,
              }}
            >
              {icon}
            </ListItemIcon>

            <Box
              className="sidebar-label"
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {label}
            </Box>
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  const renderHeaderToggle = (isOpen, setIsOpen, icon, label) => {
    return (
      <ListItem disablePadding sx={{ mb: 0.5, px: 1, width: '100%' }}>
        <Tooltip title={label} placement="right" arrow>
          <ListItemButton
            onClick={() => setIsOpen(!isOpen)}
            sx={{
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              height: 48,
              px: 2,
              color: isOpen ? (isDark ? 'common.white' : 'primary.main') : sidebarColor,
              backgroundColor: isOpen ? hoverBg : 'transparent',
              '&:hover': { backgroundColor: hoverBg },
              transition: 'all 160ms ease',
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', mr: 2, color: 'inherit' }}>{icon}</ListItemIcon>
            <Box
              className="sidebar-label"
              sx={{
                color: 'inherit',
              }}
            >
              {label}
            </Box>
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Box sx={{ flexShrink: 0 }}>
      <Drawer
        id="sidebarHoverZone"
        variant="permanent"
        sx={{
          width: drawerCollapsedWidth,
          overflowX: 'visible',
          transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            width: drawerExpandedWidth,
          },
          '& .MuiDrawer-paper': {
            width: 'inherit',
            transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxSizing: 'border-box',
            backgroundColor: sidebarBg,
            color: sidebarColor,
            borderRight: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
          },
          '& .sidebar-label': {
            opacity: 0,
            visibility: 'hidden',
            transform: 'translateX(-10px)',
            whiteSpace: 'nowrap',
            transition: 'all 200ms ease',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif',
            fontSize: 14,
            fontWeight: 500,
          },
          '&:hover .sidebar-label': {
            opacity: 1,
            visibility: 'visible',
            transform: 'translateX(0)',
          },
        }}
      >
        {/* Main Navigation List */}
        <Box sx={{ flexGrow: 1, pt: 2, px: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          <List disablePadding>
            
            {/* Admin Overview Menu */}
            {isUserAdmin && (
              <>
                {renderNavButton('admin-overview', <DashboardIcon />, 'Overview')}
                {renderNavButton('admin-global-tasks', <AssignmentIcon />, 'Global Tasks')}
                {renderNavButton('admin-blogs', <BookIcon />, 'Manage Blogs')}
                {renderNavButton('admin-posts', <RssFeedIcon />, 'Manage Posts')}
                {renderNavButton('admin-products', <StoreIcon />, 'Manage Products')}
                <Divider sx={{ borderColor: borderColor, my: 1.5 }} />
              </>
            )}
            
            {/* Chat routes for general users */}
            {!isUserAdmin && (
              <>
                {renderNavButton('chat', <ChatIcon />, 'Chats')}
                {renderNavButton('group', <GroupIcon />, 'Groups')}
                {renderNavButton('contacts', <ContactsIcon />, 'Contacts')}
                <Divider sx={{ borderColor: borderColor, my: 1.5 }} />
              </>
            )}

            {renderNavButton('profile', <PersonIcon />, 'Profile')}

            {/* Blogs Dropdown Header */}
            {renderHeaderToggle(blogsOpen, setBlogsOpen, <BookIcon />, 'Blogs')}
            {blogsOpen && (
              <Box sx={{ pl: 0, py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {renderNavButton('blogs-my', <ArticleIcon />, 'My Blogs', true)}
                {renderNavButton('blogs-all', <LibraryBooksIcon />, 'All Blogs', true)}
              </Box>
            )}

            {/* Tasks Dropdown Header */}
            {renderHeaderToggle(tasksOpen, setTasksOpen, <AssignmentIcon />, 'Tasks')}
            {tasksOpen && (
              <Box sx={{ pl: 0, py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {renderNavButton('tasks-today', <TodayIcon />, "Today's Tasks", true)}
                {renderNavButton('tasks-records', <HistoryIcon />, 'Task Record', true)}
              </Box>
            )}

            {/* Posts Dropdown Header */}
            {renderHeaderToggle(postsOpen, setPostsOpen, <RssFeedIcon />, 'Posts')}
            {postsOpen && (
              <Box sx={{ pl: 0, py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {renderNavButton('posts-my', <PersonIcon />, 'My Posts', true)}
                {renderNavButton('posts-all', <PeopleIcon />, 'All Posts', true)}
              </Box>
            )}

            {/* Products Menu */}
            {userRole === 'seller' && renderHeaderToggle(productsOpen, setProductsOpen, <StoreIcon />, 'Products')}
            {userRole === 'seller' && productsOpen && (
              <Box sx={{ pl: 0, py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {renderNavButton('products-my', <PersonIcon />, 'My Products', true)}
                {renderNavButton('products-all', <PeopleIcon />, 'All Products', true)}
              </Box>
            )}
            {userRole === 'user' && renderNavButton('products-all', <StoreIcon />, 'Products')}

            {userRole !== 'admin' && (
              <>
                {renderNavButton('cart', <ShoppingCartIcon />, 'Cart')}
                {renderNavButton('wishlist', <FavoriteIcon />, 'Wishlist')}
                {renderNavButton('orders', <AssignmentIcon />, 'My Orders')}
              </>
            )}

            {userRole === 'seller' && renderNavButton('orders-received', <HistoryIcon />, 'Orders Received')}

            {renderNavButton('settings', <SettingsIcon />, 'Settings')}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
