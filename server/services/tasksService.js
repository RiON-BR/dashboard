const { execute } = require('../db/oracle');

async function getTasks(userId) {
  const sql = `
    SELECT TASK_ID, USER_ID, TASK_TITLE, TASK_DESC, IS_COMPLETED, CREATED_AT, PRIORITY
    FROM tasks
    WHERE USER_ID = :userId
    ORDER BY TASK_ID DESC
  `;

  const result = await execute(sql, { userId });
  return (result.rows || []).map(row => ({
    id: row.TASK_ID,
    userId: row.USER_ID,
    title: row.TASK_TITLE,
    description: row.TASK_DESC,
    status: row.IS_COMPLETED,
    createdAt: row.CREATED_AT,
    priority: row.PRIORITY
  }));
}

module.exports = {
  getTasks
};

