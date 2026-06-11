const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const { initOraclePool } = require('./db/oracle');
const authRoutes = require('./routes/auth');
const blogsRoutes = require('./routes/blogs');
const tasksRoutes = require('./routes/tasks');
const chatRoutes = require('./routes/chat');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const postsRoutes = require('./routes/posts');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const ordersRoutes = require('./routes/orders');
const groupsRoutes = require('./routes/groups');


const { requireAuth } = require('./middleware/auth');
const { execute } = require('./db/oracle');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true })); // URL encoded data ke liye

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const sql = `
      SELECT p.FULLNAME, COALESCE(p.EMAIL, u.EMAIL) AS EMAIL, p.PHONE, p.ADDRESS, p.DOB, p.BIO
      FROM users u
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      WHERE u.ID = :userId
    `;

    const result = await execute(sql, { userId });
    const profile = result.rows?.[0];

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch profile' });
  }
});

app.post('/api/profile', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { fullname, address, bio } = req.body || {};

    const checkRes = await execute('SELECT COUNT(*) AS CNT FROM profiles WHERE USER_ID = :userId', { userId });
    const exists = checkRes.rows?.[0]?.CNT > 0;

    if (exists) {
      await execute(
        'UPDATE profiles SET FULLNAME = :fullname, ADDRESS = :address, BIO = :bio WHERE USER_ID = :userId',
        { fullname: fullname || '', address: address || '', bio: bio || '', userId },
        { autoCommit: true }
      );
    } else {
      await execute(
        'INSERT INTO profiles (USER_ID, FULLNAME, ADDRESS, BIO) VALUES (:userId, :fullname, :address, :bio)',
        { userId, fullname: fullname || '', address: address || '', bio: bio || '' },
        { autoCommit: true }
      );
    }

    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
});

app.post('/api/user/change-password', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const sql = `SELECT PASSWORD FROM users WHERE ID = :userId`;
    const result = await execute(sql, { userId });
    const user = result.rows?.[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.PASSWORD);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateSql = `UPDATE users SET PASSWORD = :password WHERE ID = :userId`;
    await execute(updateSql, { password: hashedPassword, userId }, { autoCommit: true });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ message: err.message || 'Failed to change password' });
  }
});

// Get User Notifications
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const sql = `
      SELECT NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT 
      FROM notifications 
      WHERE RECIPIENT_ID = :userId 
      ORDER BY CREATED_AT DESC
    `;
    const result = await execute(sql, { userId });
    return res.json(result.rows || []);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch notifications' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Routes - Prefix added here to match your API structure
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/groups', groupsRoutes);

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('register_user', (userId) => {
    if (userId) {
      const uIdNum = Number(userId);
      userSockets.set(uIdNum, socket.id);
      socket.join(uIdNum);
      socket.join(String(uIdNum));
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) {
        userSockets.delete(uid);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('userSockets', userSockets);

const port = process.env.PORT || 8000;

// Database initialization and server start
initOraclePool()
  .then(() => {
    server.listen(port, () => {
      console.log(`Chatvia backend listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize Oracle pool:', err);
    process.exit(1);
  });