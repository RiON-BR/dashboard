const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { execute, oracledb } = require('../db/oracle');

const router = express.Router();

// Helper to convert LOB columns
async function convertLobRow(r) {
  if (!r) return r;
  if (r.IMAGE_DATA && typeof r.IMAGE_DATA === 'object' && typeof r.IMAGE_DATA.getData === 'function') {
    r.IMAGE_DATA = await r.IMAGE_DATA.getData();
  }
  return r;
}

// GET /api/posts - Fetch all posts feed
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sql = `
      SELECT p.POST_ID, p.USER_ID, p.CAPTION, p.IMAGE_DATA, p.LIKES_COUNT, p.CREATED_AT,
             COALESCE(pr.FULLNAME, u.USERNAME, u.EMAIL) AS AUTHOR_NAME
      FROM posts p
      JOIN users u ON p.USER_ID = u.ID
      LEFT JOIN profiles pr ON pr.USER_ID = u.ID
      ORDER BY p.CREATED_AT DESC
    `;

    const result = await execute(sql, [], {
      fetchInfo: {
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });

    const rows = result.rows || [];
    for (const r of rows) {
      await convertLobRow(r);
    }

    // Check if the current user has liked each post
    const userId = req.user ? Number(req.user.sub) : null;
    let likedPostIds = new Set();
    if (userId) {
      const likedRes = await execute('SELECT POST_ID FROM post_likes WHERE USER_ID = :userId', { userId });
      likedPostIds = new Set((likedRes.rows || []).map(row => row.POST_ID));
    }

    const posts = [];
    for (const r of rows) {
      // Fetch comments
      const commentsSql = `
        SELECT COMMENT_ID, USER_ID, USERNAME, COMMENT_TEXT, CREATED_AT
        FROM post_comments
        WHERE POST_ID = :postId
        ORDER BY CREATED_AT ASC
      `;
      const commentsRes = await execute(commentsSql, { postId: r.POST_ID });
      const comments = (commentsRes.rows || []).map(c => ({
        id: c.COMMENT_ID,
        userId: c.USER_ID,
        username: c.USERNAME,
        commentText: c.COMMENT_TEXT,
        createdAt: c.CREATED_AT
      }));

      posts.push({
        id: r.POST_ID,
        userId: r.USER_ID,
        caption: r.CAPTION,
        imageData: r.IMAGE_DATA,
        likesCount: r.LIKES_COUNT || 0,
        createdAt: r.CREATED_AT,
        authorName: r.AUTHOR_NAME,
        likedByUser: likedPostIds.has(r.POST_ID),
        comments
      });
    }

    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch posts' });
  }
});

// GET /api/posts/my-posts - Fetch only the logged-in user's posts
router.get('/my-posts', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const sql = `
      SELECT p.POST_ID, p.USER_ID, p.CAPTION, p.IMAGE_DATA, p.LIKES_COUNT, p.CREATED_AT,
             COALESCE(pr.FULLNAME, u.USERNAME, u.EMAIL) AS AUTHOR_NAME
      FROM posts p
      JOIN users u ON p.USER_ID = u.ID
      LEFT JOIN profiles pr ON pr.USER_ID = u.ID
      WHERE p.USER_ID = :userId
      ORDER BY p.CREATED_AT DESC
    `;

    const result = await execute(sql, { userId }, {
      fetchInfo: {
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });

    const rows = result.rows || [];
    for (const r of rows) {
      await convertLobRow(r);
    }

    // Liked posts
    const likedRes = await execute('SELECT POST_ID FROM post_likes WHERE USER_ID = :userId', { userId });
    const likedPostIds = new Set((likedRes.rows || []).map(row => row.POST_ID));

    const posts = [];
    for (const r of rows) {
      const commentsSql = `
        SELECT COMMENT_ID, USER_ID, USERNAME, COMMENT_TEXT, CREATED_AT
        FROM post_comments
        WHERE POST_ID = :postId
        ORDER BY CREATED_AT ASC
      `;
      const commentsRes = await execute(commentsSql, { postId: r.POST_ID });
      const comments = (commentsRes.rows || []).map(c => ({
        id: c.COMMENT_ID,
        userId: c.USER_ID,
        username: c.USERNAME,
        commentText: c.COMMENT_TEXT,
        createdAt: c.CREATED_AT
      }));

      posts.push({
        id: r.POST_ID,
        userId: r.USER_ID,
        caption: r.CAPTION,
        imageData: r.IMAGE_DATA,
        likesCount: r.LIKES_COUNT || 0,
        createdAt: r.CREATED_AT,
        authorName: r.AUTHOR_NAME,
        likedByUser: likedPostIds.has(r.POST_ID),
        comments
      });
    }

    res.json(posts);
  } catch (err) {
    console.error('Error fetching my posts:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch my posts' });
  }
});

// POST /api/posts - Create new post
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { caption, imageData } = req.body || {};

    if (!caption && !imageData) {
      return res.status(400).json({ message: 'Caption or Image is required' });
    }

    const insertSql = `
      INSERT INTO posts (POST_ID, USER_ID, CAPTION, IMAGE_DATA, LIKES_COUNT, CREATED_AT)
      VALUES (posts_seq.NEXTVAL, :userId, :caption, :imageData, 0, CURRENT_TIMESTAMP)
      RETURNING POST_ID INTO :id
    `;

    const binds = {
      userId,
      caption: caption || '',
      imageData: imageData || '',
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execute(insertSql, binds, { autoCommit: true });
    const postId = result?.outBinds?.id?.[0];

    // Fetch user's display name
    const userSql = `
      SELECT COALESCE(pr.FULLNAME, u.USERNAME, u.EMAIL) AS DISPLAY_NAME
      FROM users u
      LEFT JOIN profiles pr ON pr.USER_ID = u.ID
      WHERE u.ID = :userId
    `;
    const userRes = await execute(userSql, { userId });
    const displayName = userRes.rows?.[0]?.DISPLAY_NAME || 'Unknown User';

    res.status(201).json({
      id: postId,
      userId,
      caption: caption || '',
      imageData: imageData || '',
      likesCount: 0,
      likedByUser: false,
      comments: [],
      authorName: displayName,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: err.message || 'Failed to create post' });
  }
});

// POST /api/posts/:id/like - Toggle post like
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.user?.sub);

    // Check if user already liked
    const checkSql = 'SELECT COUNT(*) AS CNT FROM post_likes WHERE POST_ID = :postId AND USER_ID = :userId';
    const checkRes = await execute(checkSql, { postId, userId });
    const hasLiked = checkRes.rows?.[0]?.CNT > 0;

    let liked = false;
    if (hasLiked) {
      await execute('DELETE FROM post_likes WHERE POST_ID = :postId AND USER_ID = :userId', { postId, userId }, { autoCommit: true });
      await execute('UPDATE posts SET LIKES_COUNT = COALESCE(LIKES_COUNT, 1) - 1 WHERE POST_ID = :postId', { postId }, { autoCommit: true });
      liked = false;
    } else {
      await execute('INSERT INTO post_likes (POST_ID, USER_ID) VALUES (:postId, :userId)', { postId, userId }, { autoCommit: true });
      await execute('UPDATE posts SET LIKES_COUNT = COALESCE(LIKES_COUNT, 0) + 1 WHERE POST_ID = :postId', { postId }, { autoCommit: true });
      liked = true;
    }

    const countRes = await execute('SELECT LIKES_COUNT FROM posts WHERE POST_ID = :postId', { postId });
    const likesCount = countRes.rows?.[0]?.LIKES_COUNT || 0;

    res.json({ liked, likesCount });
  } catch (err) {
    console.error('Error toggling post like:', err);
    res.status(500).json({ message: err.message || 'Failed to toggle post like' });
  }
});

// POST /api/posts/:id/comments - Add comment to post
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.user?.sub);
    const { commentText } = req.body || {};

    if (!commentText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Fetch user's display name
    const userSql = `
      SELECT COALESCE(pr.FULLNAME, u.USERNAME, u.EMAIL) AS DISPLAY_NAME
      FROM users u
      LEFT JOIN profiles pr ON pr.USER_ID = u.ID
      WHERE u.ID = :userId
    `;
    const userRes = await execute(userSql, { userId });
    const displayName = userRes.rows?.[0]?.DISPLAY_NAME || 'Unknown User';

    const insertSql = `
      INSERT INTO post_comments (COMMENT_ID, POST_ID, USER_ID, USERNAME, COMMENT_TEXT, CREATED_AT)
      VALUES (post_comments_seq.NEXTVAL, :postId, :userId, :username, :commentText, CURRENT_TIMESTAMP)
      RETURNING COMMENT_ID INTO :id
    `;

    const result = await execute(insertSql, {
      postId,
      userId,
      username: displayName,
      commentText,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }, { autoCommit: true });

    const commentId = result?.outBinds?.id?.[0];

    res.status(201).json({
      id: commentId,
      postId,
      userId,
      username: displayName,
      commentText,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error adding post comment:', err);
    res.status(500).json({ message: err.message || 'Failed to post comment' });
  }
});

// DELETE /api/posts/:id -> Delete a post (Creator or Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.user?.sub);
    const userRole = req.user?.role;

    // Check if post exists
    const checkSql = 'SELECT USER_ID FROM posts WHERE POST_ID = :postId';
    const checkRes = await execute(checkSql, { postId });
    const post = checkRes.rows?.[0];

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (userRole !== 'admin' && Number(post.USER_ID) !== userId) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to delete this post' });
    }

    // Delete post comments first
    await execute('DELETE FROM post_comments WHERE POST_ID = :postId', { postId }, { autoCommit: true });
    // Delete post likes
    await execute('DELETE FROM post_likes WHERE POST_ID = :postId', { postId }, { autoCommit: true });

    // Delete post
    const deleteSql = 'DELETE FROM posts WHERE POST_ID = :postId';
    await execute(deleteSql, { postId }, { autoCommit: true });

    res.json({ success: true, message: 'Post deleted successfully', postId });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: err.message || 'Failed to delete post' });
  }
});

module.exports = router;
