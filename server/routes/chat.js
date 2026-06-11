const express = require('express');
const { execute, oracledb } = require('../db/oracle');

const { requireAuth } = require('../middleware/auth');
const {
  getRecentConversations,
  getConversationMessages
} = require('../services/chatService');

const router = express.Router();

// All chat routes are protected
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const data = await getRecentConversations({ userId });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch recent chats' });
  }
});

router.get('/conversation/:conversationId', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const conversationId = Number(req.params.conversationId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    const data = await getConversationMessages({ userId, conversationId });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch conversation' });
  }
});

router.post('/new-by-email', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // 1. Find user by email
    const userSql = `SELECT ID, EMAIL, USERNAME FROM users WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`;
    const userRes = await execute(userSql, { email });
    const targetUser = userRes.rows?.[0];

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetId = Number(targetUser.ID);

    if (userId === targetId) {
      return res.status(400).json({ message: 'You cannot start a chat with yourself' });
    }

    // 2. Check if conversation already exists
    const checkSql = `
      SELECT CONVERSATION_ID 
      FROM conversations 
      WHERE (USER1_ID = :userId AND USER2_ID = :targetId)
         OR (USER1_ID = :targetId AND USER2_ID = :userId)
    `;
    const checkRes = await execute(checkSql, { userId, targetId });
    let conversationId = checkRes.rows?.[0]?.CONVERSATION_ID;

    // 3. Create if it doesn't exist
    if (!conversationId) {
      const insertSql = `
        INSERT INTO conversations (CONVERSATION_ID, USER1_ID, USER2_ID, CREATED_AT)
        VALUES (seq_conv.NEXTVAL, :userId, :targetId, CURRENT_TIMESTAMP)
        RETURNING CONVERSATION_ID INTO :id
      `;
      const binds = {
        userId,
        targetId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
      const result = await execute(insertSql, binds, { autoCommit: true });
      conversationId = result?.outBinds?.id?.[0];

      // Notification
      const senderRes = await execute('SELECT COALESCE(FULLNAME, USERNAME, EMAIL) AS NAME FROM users u LEFT JOIN profiles p ON p.USER_ID = u.ID WHERE u.ID = :userId', { userId });
      const senderName = senderRes.rows?.[0]?.NAME || 'Someone';

      const notifSql = `
        INSERT INTO notifications (NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT)
        VALUES (notif_seq.NEXTVAL, :recipient, :sender, 'MSG_REQ', NULL, :refId, NULL, 1, SYSTIMESTAMP)
        RETURNING NOTIF_ID INTO :id
      `;
      const notifRes = await execute(notifSql, {
        recipient: targetId,
        sender: senderName,
        refId: conversationId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }, { autoCommit: true });
      const notifId = notifRes?.outBinds?.id?.[0];

      const io = req.app.get('io');
      if (io) {
        io.to(targetId).emit('NEW_NOTIFICATION', {
          NOTIF_ID: notifId,
          RECIPIENT_ID: targetId,
          SENDER_NAME: senderName,
          ACTIVITY_TYPE: 'MSG_REQ',
          BLOG_TITLE: null,
          REFERENCE_ID: conversationId,
          ADDITIONAL_INFO: null,
          IS_UNREAD: 1,
          CREATED_AT: new Date().toISOString()
        });
      }
    }

    // 4. Return conversation with messages
    const data = await getConversationMessages({ userId, conversationId });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to start conversation' });
  }
});

router.post('/conversation/:conversationId/message', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const conversationId = Number(req.params.conversationId);
    const { message } = req.body || {};

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Check if conversation status is pending
    const statusSql = `SELECT STATUS FROM conversations WHERE CONVERSATION_ID = :conversationId`;
    const statusRes = await execute(statusSql, { conversationId });
    const conv = statusRes.rows?.[0];
    if (conv && conv.STATUS === 'pending') {
      return res.status(403).json({ message: 'Cannot send messages in a pending conversation.' });
    }

    // 1. Insert message
    const insertSql = `
      INSERT INTO messages (MESSAGE_ID, CONVERSATION_ID, SENDER_ID, TEXT, CREATED_AT, IS_READ)
      VALUES (seq_msgs.NEXTVAL, :conversationId, :userId, :text, CURRENT_TIMESTAMP, 0)
      RETURNING MESSAGE_ID INTO :id
    `;

    const binds = {
      conversationId,
      userId,
      text: message,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execute(insertSql, binds, { autoCommit: true });
    const messageId = result?.outBinds?.id?.[0];

    // Notification
    const convRes = await execute('SELECT USER1_ID, USER2_ID FROM conversations WHERE CONVERSATION_ID = :conversationId', { conversationId });
    const convData = convRes.rows?.[0];
    if (convData) {
      const recipientId = convData.USER1_ID === userId ? convData.USER2_ID : convData.USER1_ID;
      const senderRes = await execute('SELECT COALESCE(FULLNAME, USERNAME, EMAIL) AS NAME FROM users u LEFT JOIN profiles p ON p.USER_ID = u.ID WHERE u.ID = :userId', { userId });
      const senderName = senderRes.rows?.[0]?.NAME || 'Someone';

      const notifSql = `
        INSERT INTO notifications (NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT)
        VALUES (notif_seq.NEXTVAL, :recipient, :sender, 'NEW_MSG', NULL, :refId, NULL, 1, SYSTIMESTAMP)
        RETURNING NOTIF_ID INTO :id
      `;
      const notifRes = await execute(notifSql, {
        recipient: recipientId,
        sender: senderName,
        refId: conversationId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }, { autoCommit: true });
      const notifId = notifRes?.outBinds?.id?.[0];

      const io = req.app.get('io');
      if (io) {
        io.to(recipientId).emit('NEW_NOTIFICATION', {
          NOTIF_ID: notifId,
          RECIPIENT_ID: recipientId,
          SENDER_NAME: senderName,
          ACTIVITY_TYPE: 'NEW_MSG',
          BLOG_TITLE: null,
          REFERENCE_ID: conversationId,
          ADDITIONAL_INFO: null,
          IS_UNREAD: 1,
          CREATED_AT: new Date().toISOString()
        });
      }
    }

    // 2. Update conversation LAST_MESSAGE_AT
    const updateConvSql = `
      UPDATE conversations 
      SET LAST_MESSAGE_AT = CURRENT_TIMESTAMP 
      WHERE CONVERSATION_ID = :conversationId
    `;
    await execute(updateConvSql, { conversationId }, { autoCommit: true });

    // 3. Return the new message
    let d = new Date();
    var n = d.getSeconds();

    return res.status(201).json({
      id: messageId,
      message: message,
      time: String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0'),
      userType: 'sender',
      userName: null,
      isImageMessage: false,
      isFileMessage: false
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ message: err.message || 'Failed to send message' });
  }
});

router.post('/conversation/:conversationId/accept', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const conversationId = Number(req.params.conversationId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    const updateSql = `
      UPDATE conversations 
      SET STATUS = 'accepted' 
      WHERE CONVERSATION_ID = :conversationId AND USER2_ID = :userId
    `;
    const result = await execute(updateSql, { conversationId, userId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      const checkSql = `SELECT USER1_ID, USER2_ID, STATUS FROM conversations WHERE CONVERSATION_ID = :conversationId`;
      const checkRes = await execute(checkSql, { conversationId });
      const conv = checkRes.rows?.[0];
      if (conv && conv.STATUS === 'accepted') {
        return res.json({ message: 'Request already accepted', status: 'accepted' });
      }
      return res.status(400).json({ message: 'You are not authorized to accept this request or request not found' });
    }

    return res.json({ message: 'Chat request accepted successfully', status: 'accepted' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to accept chat request' });
  }
});

router.post('/conversation/:conversationId/reject', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const conversationId = Number(req.params.conversationId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    // Delete messages first
    await execute('DELETE FROM messages WHERE CONVERSATION_ID = :conversationId', { conversationId }, { autoCommit: true });
    
    // Delete conversation
    const deleteSql = `
      DELETE FROM conversations 
      WHERE CONVERSATION_ID = :conversationId AND USER2_ID = :userId
    `;
    const result = await execute(deleteSql, { conversationId, userId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(400).json({ message: 'Request not found or not authorized to reject' });
    }

    return res.json({ message: 'Chat request rejected and deleted successfully', status: 'rejected' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to reject chat request' });
  }
});

module.exports = router;

