const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { execute, oracledb } = require('../db/oracle');

const router = express.Router();

// GET /api/groups - Fetch all groups for current user (where user is a member or creator)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    
    const sql = `
      SELECT DISTINCT g.GROUP_ID, g.NAME, g.DESCRIPTION, g.CREATED_BY, g.CREATED_AT
      FROM groups g
      LEFT JOIN group_members gm ON g.GROUP_ID = gm.GROUP_ID
      WHERE g.CREATED_BY = :userId OR gm.USER_ID = :userId
      ORDER BY g.CREATED_AT DESC
    `;
    const result = await execute(sql, { userId });
    return res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching groups:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch groups' });
  }
});

// POST /api/groups - Create a new group
router.post('/', requireAuth, async (req, res) => {
  try {
    const creatorId = Number(req.user?.sub);
    const { name, description, selectedMembers } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (!selectedMembers || !Array.isArray(selectedMembers) || selectedMembers.length === 0) {
      return res.status(400).json({ message: 'At least one group member must be selected' });
    }

    // 1. Insert into groups table
    const insertGroupSql = `
      INSERT INTO groups (GROUP_ID, NAME, DESCRIPTION, CREATED_BY, CREATED_AT)
      VALUES (groups_seq.NEXTVAL, :name, :description, :creatorId, CURRENT_TIMESTAMP)
      RETURNING GROUP_ID INTO :id
    `;
    
    const binds = {
      name,
      description: description || '',
      creatorId,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execute(insertGroupSql, binds, { autoCommit: true });
    const groupId = result?.outBinds?.id?.[0];

    // 2. Insert members into group_members
    // Always include the creator as a member of the group
    const uniqueMembers = Array.from(new Set([...selectedMembers, creatorId])).map(id => Number(id));

    for (const userId of uniqueMembers) {
      const insertMemberSql = `
        INSERT INTO group_members (GROUP_ID, USER_ID)
        VALUES (:groupId, :userId)
      `;
      await execute(insertMemberSql, { groupId, userId }, { autoCommit: true });
    }

    return res.status(201).json({
      success: true,
      message: 'Group created successfully!',
      group: {
        groupId,
        name,
        description,
        createdBy: creatorId,
        members: uniqueMembers
      }
    });
  } catch (err) {
    console.error('Error creating group:', err);
    return res.status(500).json({ message: err.message || 'Failed to create group' });
  }
});

module.exports = router;
