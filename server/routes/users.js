const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { execute } = require('../db/oracle');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
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

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const sql = `
      SELECT u.ID, u.EMAIL, u.USERNAME, u.ROLE, COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS DISPLAY_NAME
      FROM users u
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      WHERE u.ID != :userId
      ORDER BY COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) ASC
    `;

    const result = await execute(sql, { userId });
    return res.json(result.rows || []);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch users' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const currentUserId = Number(req.user?.sub);
    const userRole = req.user?.role;

    if (userRole !== 'admin' && currentUserId !== targetUserId) {
      return res.status(403).json({ message: 'Access denied: Cannot delete other profiles unless admin' });
    }

    // Delete dependent tables first in case constraints exist
    await execute('DELETE FROM profiles WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
    
    try {
      await execute('DELETE FROM tasks WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM products WHERE SELLER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM blog_likes WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM comments WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM post_likes WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM post_comments WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM posts WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
      await execute('DELETE FROM blogs WHERE USER_ID = :targetUserId', { targetUserId }, { autoCommit: true });
    } catch (dbErr) {
      console.warn('Cascaded deletion warning:', dbErr);
    }

    const result = await execute('DELETE FROM users WHERE ID = :targetUserId', { targetUserId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ success: true, message: 'User profile deleted successfully', userId: targetUserId });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete user' });
  }
});

module.exports = router;
