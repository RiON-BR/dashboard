const { execute } = require('../db/oracle');

function parseDisplayName(row) {
  return row?.DISPLAY_NAME || row?.display_name || row?.FULLNAME || row?.USERNAME || row?.EMAIL || null;
}

/**
 * Heuristic conversation participant resolution:
 * - messages has CONVERSATION_ID and SENDER_ID.
 * - We compute last message per conversation for the current user, then fetch
 *   both participant names using SENDER_ID + current user.
 *
 * This assumes a 1:1 conversation where one participant is the receiver and
 * the other is the sender.
 * If your schema also has a RECEIVER_ID (not provided), you should extend the query.
 */
async function getRecentConversations({ userId }) {
  const sql = `
    SELECT 
        c.CONVERSATION_ID,
        c.USER1_ID,
        c.USER2_ID,
        c.STATUS,
        c.LAST_MESSAGE_AT,
        u.ID as PARTNER_ID,
        u.USERNAME as PARTNER_USERNAME,
        u.EMAIL as PARTNER_EMAIL,
        p.FULLNAME as PARTNER_FULLNAME,
        m.MESSAGE_ID,
        m.SENDER_ID,
        m.TEXT,
        m.CREATED_AT as MSG_CREATED_AT,
        m.IS_READ
    FROM conversations c
    JOIN users u ON u.ID = CASE WHEN c.USER1_ID = :userId THEN c.USER2_ID ELSE c.USER1_ID END
    LEFT JOIN profiles p ON p.USER_ID = u.ID
    LEFT JOIN (
        SELECT m1.CONVERSATION_ID, m1.MESSAGE_ID, m1.SENDER_ID, m1.TEXT, m1.CREATED_AT, m1.IS_READ
        FROM messages m1
        JOIN (
            SELECT CONVERSATION_ID, MAX(MESSAGE_ID) AS MAX_ID
            FROM messages
            GROUP BY CONVERSATION_ID
        ) m2 ON m1.CONVERSATION_ID = m2.CONVERSATION_ID AND m1.MESSAGE_ID = m2.MAX_ID
    ) m ON c.CONVERSATION_ID = m.CONVERSATION_ID
    WHERE c.USER1_ID = :userId OR c.USER2_ID = :userId
    ORDER BY NVL(m.CREATED_AT, NVL(c.LAST_MESSAGE_AT, c.CREATED_AT)) DESC
  `;

  const res = await execute(sql, { userId });
  const rows = res.rows || [];

  return rows.map((row) => {
    const conversationId = Number(row.CONVERSATION_ID);
    const lastSenderId = row.SENDER_ID ? Number(row.SENDER_ID) : null;
    const partnerDisplayName = row.PARTNER_FULLNAME || row.PARTNER_USERNAME || row.PARTNER_EMAIL;

    return {
      id: conversationId,
      name: partnerDisplayName,
      profilePicture: 'Null',
      status: null,
      unRead: 0,
      isGroup: false,
      chatStatus: row.STATUS || 'pending',
      user1Id: Number(row.USER1_ID),
      user2Id: Number(row.USER2_ID),
      messages: row.MESSAGE_ID ? [
        {
          id: Number(row.MESSAGE_ID),
          message: row.TEXT || '',
          time: row.MSG_CREATED_AT ? String(row.MSG_CREATED_AT).slice(11, 16) : null,
          userType: lastSenderId === userId ? 'sender' : 'receiver',
          isImageMessage: false,
          isFileMessage: false,
          isToday: false
        }
      ] : []
    };
  });
}

async function getConversationMessages({ userId, conversationId }) {
  const sql = `
    SELECT
      m.MESSAGE_ID,
      m.CONVERSATION_ID,
      m.SENDER_ID,
      m.TEXT,
      m.CREATED_AT,
      m.IS_READ,
      COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS SENDER_DISPLAY_NAME
    FROM messages m
    JOIN users u ON u.ID = m.SENDER_ID
    LEFT JOIN profiles p ON p.USER_ID = u.ID
    WHERE m.CONVERSATION_ID = :conversationId
    ORDER BY m.MESSAGE_ID ASC
  `;

  const res = await execute(sql, { conversationId });
  const rows = res.rows || [];

  // Map into frontend message shape
  const messages = rows.map((r) => {
    const senderId = Number(r.SENDER_ID);
    const isSender = senderId === userId;
    return {
      id: Number(r.MESSAGE_ID),
      message: r.TEXT || '',
      time: r.CREATED_AT ? String(r.CREATED_AT).slice(11, 16) : null,
      userType: isSender ? 'sender' : 'receiver',
      userName: isSender ? null : (r.SENDER_DISPLAY_NAME || null),
      isImageMessage: false,
      isFileMessage: false
    };
  });

  // Conversation title resolution: query partner's display name from conversations
  const partnerSql = `
    SELECT COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS DISPLAY_NAME, c.STATUS, c.USER1_ID, c.USER2_ID
    FROM conversations c
    JOIN users u ON u.ID = CASE WHEN c.USER1_ID = :userId THEN c.USER2_ID ELSE c.USER1_ID END
    LEFT JOIN profiles p ON p.USER_ID = u.ID
    WHERE c.CONVERSATION_ID = :conversationId
  `;
  const partnerRes = await execute(partnerSql, { userId, conversationId });
  const partnerRow = partnerRes.rows?.[0];
  const title = partnerRow?.DISPLAY_NAME || String(conversationId);

  return {
    id: Number(conversationId),
    name: title,
    chatStatus: partnerRow?.STATUS || 'pending',
    user1Id: partnerRow?.USER1_ID ? Number(partnerRow.USER1_ID) : null,
    user2Id: partnerRow?.USER2_ID ? Number(partnerRow.USER2_ID) : null,
    messages
  };

}

module.exports = {
  getRecentConversations,
  getConversationMessages
};

