const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTasks } = require('../services/tasksService');
const { execute, oracledb } = require('../db/oracle');

const router = express.Router();

router.get('/', requireAuth, requireRole(['admin', 'user']), async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const tasks = await getTasks(userId);
    res.json(tasks);
  } catch (err) {
    console.error('Error in GET /api/tasks:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/global -> Fetch all tasks across users (Admin only)
router.get('/global', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const sql = `
      SELECT t.TASK_ID, t.USER_ID, t.TASK_TITLE, t.TASK_DESC, t.IS_COMPLETED, t.CREATED_AT, t.PRIORITY,
             COALESCE(p.FULLNAME, u.USERNAME, u.EMAIL) AS OWNER_NAME
      FROM tasks t
      JOIN users u ON t.USER_ID = u.ID
      LEFT JOIN profiles p ON p.USER_ID = u.ID
      ORDER BY t.TASK_ID DESC
    `;
    const result = await execute(sql);
    const tasks = (result.rows || []).map(row => ({
      id: row.TASK_ID,
      userId: row.USER_ID,
      title: row.TASK_TITLE,
      description: row.TASK_DESC,
      status: row.IS_COMPLETED,
      createdAt: row.CREATED_AT,
      priority: row.PRIORITY,
      ownerName: row.OWNER_NAME
    }));
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching global tasks:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch global tasks' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { title, description, priority, status } = req.body || {};

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const insertSql = `
      INSERT INTO tasks (TASK_ID, USER_ID, TASK_TITLE, TASK_DESC, PRIORITY, IS_COMPLETED, CREATED_AT)
      VALUES (TASKS_SEQ.NEXTVAL, :userId, :title, :description, :priority, :status, CURRENT_TIMESTAMP)
      RETURNING TASK_ID INTO :id
    `;

    const binds = {
      userId,
      title,
      description: description || '',
      priority: priority || 'Medium',
      status: status || 'Todo',
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execute(insertSql, binds, { autoCommit: true });
    const taskId = result?.outBinds?.id?.[0];

    return res.status(201).json({
      id: taskId,
      userId,
      title,
      description,
      priority,
      status,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in POST /api/tasks:', err);
    return res.status(500).json({ message: err.message || 'Failed to create task' });
  }
});

router.put('/toggle/:taskId', requireAuth, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = Number(req.user?.sub);
    const userRole = req.user?.role;
    const { status } = req.body || {};

    if (!Number.isFinite(taskId) || taskId <= 0) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Select the current status to validate transition rules
    const selectSql = userRole === 'admin' 
      ? 'SELECT IS_COMPLETED, USER_ID FROM tasks WHERE TASK_ID = :taskId'
      : 'SELECT IS_COMPLETED, USER_ID FROM tasks WHERE TASK_ID = :taskId AND USER_ID = :userId';
    
    const selectBinds = userRole === 'admin' ? { taskId } : { taskId, userId };
    const taskRes = await execute(selectSql, selectBinds);
    const currentTask = taskRes.rows?.[0];

    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    const currentStatus = currentTask.IS_COMPLETED || 'Todo';
    const targetStatus = status;

    // Progression Sanitization Rules:
    // Only Todo -> In Progress and In Progress -> Completed/Done are valid transitions.
    const cStat = currentStatus.trim().toLowerCase();
    const tStat = targetStatus.trim().toLowerCase();

    const isCompletedState = (s) => s === 'completed' || s === 'done';

    let isValid = false;
    if (cStat === 'todo' && tStat === 'in progress') {
      isValid = true;
    } else if (cStat === 'in progress' && isCompletedState(tStat)) {
      isValid = true;
    } else if (cStat === tStat) {
      // Allow re-applying same status
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({
        message: `Invalid task progression: Blocked moving from "${currentStatus}" to "${targetStatus}". Enforcing unidirectional flow: Todo -> In Progress -> Completed.`
      });
    }

    const updateSql = userRole === 'admin'
      ? 'UPDATE tasks SET IS_COMPLETED = :status WHERE TASK_ID = :taskId'
      : 'UPDATE tasks SET IS_COMPLETED = :status WHERE TASK_ID = :taskId AND USER_ID = :userId';
    
    const updateBinds = userRole === 'admin' ? { status, taskId } : { status, taskId, userId };
    await execute(updateSql, updateBinds, { autoCommit: true });

    return res.json({ success: true, taskId, status });
  } catch (err) {
    console.error('Error in PUT /api/tasks/toggle/:taskId:', err);
    return res.status(500).json({ message: err.message || 'Failed to update task status' });
  }
});

router.delete('/:taskId', requireAuth, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = Number(req.user?.sub);
    const userRole = req.user?.role;

    if (!Number.isFinite(taskId) || taskId <= 0) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const deleteSql = userRole === 'admin'
      ? 'DELETE FROM tasks WHERE TASK_ID = :taskId'
      : 'DELETE FROM tasks WHERE TASK_ID = :taskId AND USER_ID = :userId';
    
    const deleteBinds = userRole === 'admin' ? { taskId } : { taskId, userId };
    const result = await execute(deleteSql, deleteBinds, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    return res.json({ success: true, message: 'Task deleted successfully', taskId });
  } catch (err) {
    console.error('Error in DELETE /api/tasks/:taskId:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete task' });
  }
});

module.exports = router;
