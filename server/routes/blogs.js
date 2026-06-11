const express = require('express');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { execute, oracledb } = require('../db/oracle');

const router = express.Router();

// Helper to convert LOB columns
async function convertLobRow(r) {
  if (!r) return r;
  if (r.CONTENT && typeof r.CONTENT === 'object' && typeof r.CONTENT.getData === 'function') {
    r.CONTENT = await r.CONTENT.getData();
  }
  if (r.IMAGE_DATA && typeof r.IMAGE_DATA === 'object' && typeof r.IMAGE_DATA.getData === 'function') {
    r.IMAGE_DATA = await r.IMAGE_DATA.getData();
  }
  return r;
}

// GET /api/blogs -> Fetch all rows, join with user/profiles
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sql = `
      SELECT b.BLOG_ID, b.USER_ID, b.TITLE, b.CONTENT, b.IMAGE_DATA, b.LIKES_COUNT, b.CREATED_AT, b.CATEGORY, b.CLICK_COUNT,
             COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS AUTHOR_NAME
      FROM blogs b
      JOIN users u ON b.USER_ID = u.ID
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      ORDER BY b.CREATED_AT DESC
    `;

    const result = await execute(sql, [], {
      fetchInfo: {
        CONTENT: { type: oracledb.STRING },
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });

    const rows = result.rows || [];
    for (const r of rows) {
      await convertLobRow(r);
    }

    // Check if the current user has liked each blog
    const userId = req.user ? Number(req.user.sub) : null;
    let likedBlogIds = new Set();
    if (userId) {
      const likedRes = await execute('SELECT BLOG_ID FROM blog_likes WHERE USER_ID = :userId', { userId });
      likedBlogIds = new Set((likedRes.rows || []).map(row => row.BLOG_ID));
    }

    const blogs = rows.map(r => ({
      id: r.BLOG_ID,
      userId: r.USER_ID,
      title: r.TITLE,
      content: r.CONTENT,
      imageData: r.IMAGE_DATA,
      likesCount: r.LIKES_COUNT || 0,
      createdAt: r.CREATED_AT,
      category: r.CATEGORY || 'General',
      clickCount: r.CLICK_COUNT || 0,
      authorName: r.AUTHOR_NAME,
      likedByUser: likedBlogIds.has(r.BLOG_ID)
    }));

    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch blogs' });
  }
});

// GET /api/blogs/my-blogs -> Filter by JWT USER_ID
router.get('/my-blogs', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const sql = `
      SELECT b.BLOG_ID, b.USER_ID, b.TITLE, b.CONTENT, b.IMAGE_DATA, b.LIKES_COUNT, b.CREATED_AT, b.CATEGORY, b.CLICK_COUNT,
             COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS AUTHOR_NAME
      FROM blogs b
      JOIN users u ON b.USER_ID = u.ID
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      WHERE b.USER_ID = :userId
      ORDER BY b.CREATED_AT DESC
    `;

    const result = await execute(sql, { userId }, {
      fetchInfo: {
        CONTENT: { type: oracledb.STRING },
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });

    const rows = result.rows || [];
    for (const r of rows) {
      await convertLobRow(r);
    }

    const likedRes = await execute('SELECT BLOG_ID FROM blog_likes WHERE USER_ID = :userId', { userId });
    const likedBlogIds = new Set((likedRes.rows || []).map(row => row.BLOG_ID));

    const blogs = rows.map(r => ({
      id: r.BLOG_ID,
      userId: r.USER_ID,
      title: r.TITLE,
      content: r.CONTENT,
      imageData: r.IMAGE_DATA,
      likesCount: r.LIKES_COUNT || 0,
      createdAt: r.CREATED_AT,
      category: r.CATEGORY || 'General',
      clickCount: r.CLICK_COUNT || 0,
      authorName: r.AUTHOR_NAME,
      likedByUser: likedBlogIds.has(r.BLOG_ID)
    }));

    res.json(blogs);
  } catch (err) {
    console.error('Error fetching my blogs:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch my blogs' });
  }
});

// GET /api/blogs/:id -> Fetch single blog by ID, join with user/profiles
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    if (!Number.isFinite(blogId) || blogId <= 0) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const sql = `
      SELECT b.BLOG_ID, b.USER_ID, b.TITLE, b.CONTENT, b.IMAGE_DATA, b.LIKES_COUNT, b.CREATED_AT, b.CATEGORY, b.CLICK_COUNT,
             COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS AUTHOR_NAME
      FROM blogs b
      JOIN users u ON b.USER_ID = u.ID
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      WHERE b.BLOG_ID = :blogId
    `;

    const result = await execute(sql, { blogId }, {
      fetchInfo: {
        CONTENT: { type: oracledb.STRING },
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });

    const rows = result.rows || [];
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const r = rows[0];
    await convertLobRow(r);

    // Check if the current user has liked this blog
    const userId = req.user ? Number(req.user.sub) : null;
    let liked = false;
    if (userId) {
      const likedRes = await execute('SELECT COUNT(*) AS CNT FROM blog_likes WHERE BLOG_ID = :blogId AND USER_ID = :userId', { blogId, userId });
      liked = (likedRes.rows?.[0]?.CNT || 0) > 0;
    }

    const blog = {
      id: r.BLOG_ID,
      userId: r.USER_ID,
      title: r.TITLE,
      content: r.CONTENT,
      imageData: r.IMAGE_DATA,
      likesCount: r.LIKES_COUNT || 0,
      createdAt: r.CREATED_AT,
      category: r.CATEGORY || 'General',
      clickCount: r.CLICK_COUNT || 0,
      authorName: r.AUTHOR_NAME,
      likedByUser: liked
    };

    res.json(blog);
  } catch (err) {
    console.error('Error fetching single blog:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch blog' });
  }
});

// POST /api/blogs -> Create a blog post
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { title, content, imageData, category } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const insertSql = `
      INSERT INTO blogs (BLOG_ID, USER_ID, TITLE, CONTENT, IMAGE_DATA, LIKES_COUNT, CREATED_AT, CATEGORY, CLICK_COUNT)
      VALUES (BLOGS_SEQ.NEXTVAL, :userId, :title, :content, :imageData, 0, CURRENT_TIMESTAMP, :category, 0)
      RETURNING BLOG_ID INTO :id
    `;

    const binds = {
      userId,
      title,
      content,
      imageData: imageData || '',
      category: category || 'General',
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execute(insertSql, binds, { autoCommit: true });
    const blogId = result?.outBinds?.id?.[0];

    res.status(201).json({
      id: blogId,
      userId,
      title,
      content,
      imageData,
      category: category || 'General',
      likesCount: 0,
      clickCount: 0,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ message: err.message || 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id -> Update a blog post
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    const userId = Number(req.user?.sub);
    const { title, content, imageData, category } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const updateSql = `
      UPDATE blogs
      SET TITLE = :title, CONTENT = :content, IMAGE_DATA = :imageData, CATEGORY = :category
      WHERE BLOG_ID = :blogId AND USER_ID = :userId
    `;

    const result = await execute(updateSql, {
      title,
      content,
      imageData: imageData || '',
      category: category || 'General',
      blogId,
      userId
    }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Blog not found or not authorized' });
    }

    res.json({ success: true, blogId, title, content, category });
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ message: err.message || 'Failed to update blog' });
  }
});

// DELETE /api/blogs/:id -> Delete a blog post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    const userId = Number(req.user?.sub);

    // Delete comments first
    await execute('DELETE FROM comments WHERE BLOG_ID = :blogId', { blogId }, { autoCommit: true });
    // Delete likes
    await execute('DELETE FROM blog_likes WHERE BLOG_ID = :blogId', { blogId }, { autoCommit: true });

    // Delete blog
    const userRole = req.user?.role;
    const deleteSql = userRole === 'admin'
      ? 'DELETE FROM blogs WHERE BLOG_ID = :blogId'
      : 'DELETE FROM blogs WHERE BLOG_ID = :blogId AND USER_ID = :userId';
    const deleteBinds = userRole === 'admin' ? { blogId } : { blogId, userId };
    const result = await execute(deleteSql, deleteBinds, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Blog not found or not authorized' });
    }

    res.json({ success: true, message: 'Blog deleted successfully', blogId });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ message: err.message || 'Failed to delete blog' });
  }
});

// POST /api/blogs/:id/like -> Toggle user like uniquely
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    const userId = Number(req.user?.sub);

    // Check if user already liked this blog
    const checkSql = 'SELECT COUNT(*) AS CNT FROM blog_likes WHERE BLOG_ID = :blogId AND USER_ID = :userId';
    const checkRes = await execute(checkSql, { blogId, userId });
    const hasLiked = checkRes.rows?.[0]?.CNT > 0;

    let liked = false;
    if (hasLiked) {
      // Unlike
      await execute('DELETE FROM blog_likes WHERE BLOG_ID = :blogId AND USER_ID = :userId', { blogId, userId }, { autoCommit: true });
      await execute('UPDATE blogs SET LIKES_COUNT = COALESCE(LIKES_COUNT, 1) - 1 WHERE BLOG_ID = :blogId', { blogId }, { autoCommit: true });
      liked = false;
    } else {
      // Like
      await execute('INSERT INTO blog_likes (BLOG_ID, USER_ID) VALUES (:blogId, :userId)', { blogId, userId }, { autoCommit: true });
      await execute('UPDATE blogs SET LIKES_COUNT = COALESCE(LIKES_COUNT, 0) + 1 WHERE BLOG_ID = :blogId', { blogId }, { autoCommit: true });
      liked = true;

      // Notification
      const blogDetailRes = await execute('SELECT USER_ID, TITLE FROM blogs WHERE BLOG_ID = :blogId', { blogId });
      const blogOwner = blogDetailRes.rows?.[0]?.USER_ID;
      const blogTitle = blogDetailRes.rows?.[0]?.TITLE;

      if (blogOwner && blogOwner !== userId) {
        const senderRes = await execute('SELECT COALESCE(FULLNAME, USERNAME, EMAIL) AS NAME FROM users u LEFT JOIN profiles p ON p.USER_ID = u.ID WHERE u.ID = :userId', { userId });
        const senderName = senderRes.rows?.[0]?.NAME || 'Someone';

        const notifSql = `
          INSERT INTO notifications (NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT)
          VALUES (notif_seq.NEXTVAL, :recipient, :sender, 'LIKE', :title, :refId, NULL, 1, SYSTIMESTAMP)
          RETURNING NOTIF_ID INTO :id
        `;
        const notifRes = await execute(notifSql, {
          recipient: blogOwner,
          sender: senderName,
          title: blogTitle || '',
          refId: blogId,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }, { autoCommit: true });
        const notifId = notifRes?.outBinds?.id?.[0];

        const io = req.app.get('io');
        if (io) {
          io.to(blogOwner).emit('NEW_NOTIFICATION', {
            NOTIF_ID: notifId,
            RECIPIENT_ID: blogOwner,
            SENDER_NAME: senderName,
            ACTIVITY_TYPE: 'LIKE',
            BLOG_TITLE: blogTitle || '',
            REFERENCE_ID: blogId,
            ADDITIONAL_INFO: null,
            IS_UNREAD: 1,
            CREATED_AT: new Date().toISOString()
          });
        }
      }
    }

    // Get current likes count
    const countRes = await execute('SELECT LIKES_COUNT FROM blogs WHERE BLOG_ID = :blogId', { blogId });
    const likesCount = countRes.rows?.[0]?.LIKES_COUNT || 0;

    res.json({ liked, likesCount });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: err.message || 'Failed to toggle like' });
  }
});

// POST /api/blogs/:id/click -> Click count tracking
router.post('/:id/click', requireAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    await execute('UPDATE blogs SET CLICK_COUNT = COALESCE(CLICK_COUNT, 0) + 1 WHERE BLOG_ID = :blogId', { blogId }, { autoCommit: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating click count:', err);
    res.status(500).json({ message: err.message || 'Failed to update click count' });
  }
});

// GET /api/blogs/:id/comments -> Get comments for a blog
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    const sql = `
      SELECT COMMENT_ID, BLOG_ID, USER_ID, USERNAME, COMMENT_TEXT, CREATED_AT
      FROM comments
      WHERE BLOG_ID = :blogId
      ORDER BY CREATED_AT ASC
    `;
    const result = await execute(sql, { blogId });
    const comments = (result.rows || []).map(row => ({
      id: row.COMMENT_ID,
      blogId: row.BLOG_ID,
      userId: row.USER_ID,
      username: row.USERNAME,
      commentText: row.COMMENT_TEXT,
      createdAt: row.CREATED_AT
    }));
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch comments' });
  }
});

// POST /api/blogs/:id/comments -> Add a comment to a blog
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    const userId = Number(req.user?.sub);
    const { commentText } = req.body || {};

    if (!commentText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Fetch user's display name
    const userSql = `
      SELECT COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS DISPLAY_NAME
      FROM users u
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      WHERE u.ID = :userId
    `;
    const userRes = await execute(userSql, { userId });
    const displayName = userRes.rows?.[0]?.DISPLAY_NAME || 'Unknown User';

    const insertSql = `
      INSERT INTO comments (COMMENT_ID, BLOG_ID, USER_ID, USERNAME, COMMENT_TEXT, CREATED_AT)
      VALUES (COMMENTS_SEQ.NEXTVAL, :blogId, :userId, :username, :commentText, CURRENT_TIMESTAMP)
      RETURNING COMMENT_ID INTO :id
    `;

    const result = await execute(insertSql, {
      blogId,
      userId,
      username: displayName,
      commentText,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }, { autoCommit: true });

    const commentId = result?.outBinds?.id?.[0];

    // Notification
    const blogDetailRes = await execute('SELECT USER_ID, TITLE FROM blogs WHERE BLOG_ID = :blogId', { blogId });
    const blogOwner = blogDetailRes.rows?.[0]?.USER_ID;
    const blogTitle = blogDetailRes.rows?.[0]?.TITLE;

    if (blogOwner && blogOwner !== userId) {
      const notifSql = `
        INSERT INTO notifications (NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT)
        VALUES (notif_seq.NEXTVAL, :recipient, :sender, 'COMMENT', :title, :refId, NULL, 1, SYSTIMESTAMP)
        RETURNING NOTIF_ID INTO :id
      `;
      const notifRes = await execute(notifSql, {
        recipient: blogOwner,
        sender: displayName,
        title: blogTitle || '',
        refId: blogId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }, { autoCommit: true });
      const notifId = notifRes?.outBinds?.id?.[0];

      const io = req.app.get('io');
      if (io) {
        io.to(blogOwner).emit('NEW_NOTIFICATION', {
          NOTIF_ID: notifId,
          RECIPIENT_ID: blogOwner,
          SENDER_NAME: displayName,
          ACTIVITY_TYPE: 'COMMENT',
          BLOG_TITLE: blogTitle || '',
          REFERENCE_ID: blogId,
          ADDITIONAL_INFO: null,
          IS_UNREAD: 1,
          CREATED_AT: new Date().toISOString()
        });
      }
    }

    res.status(201).json({
      id: commentId,
      blogId,
      userId,
      username: displayName,
      commentText,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error posting comment:', err);
    res.status(500).json({ message: err.message || 'Failed to post comment' });
  }
});

module.exports = router;
