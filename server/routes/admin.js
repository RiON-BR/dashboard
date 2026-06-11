const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { execute } = require('../db/oracle');

const router = express.Router();

router.get('/metrics', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    // 1. Total Platform Users
    const usersRes = await execute('SELECT COUNT(*) AS CNT FROM users');
    const totalUsers = usersRes.rows?.[0]?.CNT || 0;

    // 2. Total Tasks Created
    const tasksRes = await execute('SELECT COUNT(*) AS CNT FROM tasks');
    const totalTasks = tasksRes.rows?.[0]?.CNT || 0;

    // 3. Total Blogs Published
    const blogsRes = await execute('SELECT COUNT(*) AS CNT FROM blogs');
    const totalBlogs = blogsRes.rows?.[0]?.CNT || 0;

    // 4. Total Active Chats (accepted conversations)
    const chatsRes = await execute("SELECT COUNT(*) AS CNT FROM conversations WHERE STATUS = 'accepted'");
    const totalActiveChats = chatsRes.rows?.[0]?.CNT || 0;

    // Other metrics for compatibility
    const commentsRes = await execute('SELECT COUNT(*) AS CNT FROM comments');
    const totalComments = commentsRes.rows?.[0]?.CNT || 0;

    const engagementRes = await execute(`
      SELECT 
        SUM(COALESCE(LIKES_COUNT, 0)) AS TOTAL_LIKES,
        SUM(COALESCE(CLICK_COUNT, 0)) AS TOTAL_CLICKS
      FROM blogs
    `);
    const totalLikes = engagementRes.rows?.[0]?.TOTAL_LIKES || 0;
    const totalClicks = engagementRes.rows?.[0]?.TOTAL_CLICKS || 0;

    const priorityRes = await execute(`
      SELECT PRIORITY, COUNT(*) AS CNT 
      FROM tasks 
      GROUP BY PRIORITY
    `);
    const priorityBreakdown = priorityRes.rows || [];

    const categoryRes = await execute(`
      SELECT CATEGORY, COUNT(*) AS CNT 
      FROM blogs 
      GROUP BY CATEGORY
    `);
    const categoryBreakdown = categoryRes.rows || [];

    res.json({
      totalUsers,
      totalTasks,
      totalBlogs,
      totalActiveChats,
      totalComments,
      totalLikes,
      totalClicks,
      priorityBreakdown,
      categoryBreakdown
    });
  } catch (err) {
    console.error('Error fetching admin metrics:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch admin metrics' });
  }
});

module.exports = router;
