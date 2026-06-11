const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { execute, oracledb } = require('../db/oracle');

const router = express.Router();

async function convertLobRow(r) {
  if (!r) return r;
  if (r.IMAGE_DATA && typeof r.IMAGE_DATA === 'object' && typeof r.IMAGE_DATA.getData === 'function') {
    r.IMAGE_DATA = await r.IMAGE_DATA.getData();
  }
  return r;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const sql = `
      SELECT w.ID, w.PRODUCT_ID, p.NAME, p.PRICE, p.STOCK_COUNT, p.IMAGE_DATA, p.DESCRIPTION
      FROM wishlist w
      JOIN products p ON w.PRODUCT_ID = p.PRODUCT_ID
      WHERE w.USER_ID = :userId
      ORDER BY w.ID DESC
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

    const items = rows.map(r => ({
      id: r.ID,
      productId: r.PRODUCT_ID,
      name: r.NAME,
      price: r.PRICE,
      stockCount: r.STOCK_COUNT,
      imageData: r.IMAGE_DATA,
      description: r.DESCRIPTION
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch wishlist' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { productId } = req.body || {};

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const checkSql = `SELECT ID FROM wishlist WHERE USER_ID = :userId AND PRODUCT_ID = :productId`;
    const checkRes = await execute(checkSql, { userId, productId });
    const existing = checkRes.rows?.[0];

    if (existing) {
      const deleteSql = `DELETE FROM wishlist WHERE ID = :id`;
      await execute(deleteSql, { id: existing.ID }, { autoCommit: true });
      res.json({ success: true, action: 'removed', message: 'Removed from wishlist', id: existing.ID });
    } else {
      const insertSql = `
        INSERT INTO wishlist (ID, USER_ID, PRODUCT_ID)
        VALUES (wishlist_seq.NEXTVAL, :userId, :productId)
        RETURNING ID INTO :id
      `;
      const binds = {
        userId,
        productId: Number(productId),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
      const result = await execute(insertSql, binds, { autoCommit: true });
      const wishlistId = result?.outBinds?.id?.[0];
      res.status(201).json({ success: true, action: 'added', message: 'Added to wishlist', id: wishlistId });
    }
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    res.status(500).json({ message: err.message || 'Failed to update wishlist' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleteSql = `DELETE FROM wishlist WHERE ID = :id`;
    const result = await execute(deleteSql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ success: true, message: 'Removed from wishlist', id });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ message: err.message || 'Failed to remove from wishlist' });
  }
});

module.exports = router;
