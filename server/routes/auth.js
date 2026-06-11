const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Bcrypt import zaroori hai
const { execute, oracledb } = require('../db/oracle'); // oracledb import ensure karein

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    // Check if user already exists to prevent ORA-00001
    const checkSql = `SELECT COUNT(*) AS CNT FROM users WHERE email = :email OR username = :username`;
    const checkRes = await execute(checkSql, { email, username: username || '' });
    const count = checkRes.rows?.[0]?.CNT || 0;
    if (count > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 1. Password Hash karein (Yahan function ke andar)
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = role ? String(role).toLowerCase() : 'user';


    const insertSql = `
      INSERT INTO users (ID, EMAIL, USERNAME, PASSWORD, ROLE)
      VALUES (users_seq.NEXTVAL, :email, :username, :password, :role)
      RETURNING ID INTO :id
    `;

    const binds = {
      email,
      username: username || '',
      password: hashedPassword, // Hash kiya hua password
      role: normalizedRole,

      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    // 2. autoCommit: true ke saath execute karein
    const result = await execute(insertSql, binds, { autoCommit: true });
    const userId = result?.outBinds?.id?.[0] || null;

    const token = jwt.sign(
      { role, sub: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    return res.status(201).json({ id: userId, name: username || email, email, role, token });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const email = username?.trim();

    console.log('[Login Debug] Request body:', req.body);
    console.log('[Login Debug] Extracted email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'username(email) and password are required' });
    }

    const sql = `SELECT ID, EMAIL, USERNAME, PASSWORD, ROLE FROM users WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`;
    const result = await execute(sql, { email });
    const row = result.rows?.[0];

    console.log('[Login Debug] Found database row:', row);

    if (!row) {
      console.log('[Login Debug] No user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Bcrypt se password compare karein
    const isMatch = await bcrypt.compare(password, row.PASSWORD);
    console.log('[Login Debug] password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { role: row.ROLE, sub: String(row.ID) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    return res.status(200).json({ id: row.ID, name: row.USERNAME || row.EMAIL, email: row.EMAIL, role: row.ROLE, token });
  } catch (err) {
    console.error('[Login Debug] Error during login:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;