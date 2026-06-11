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
      SELECT c.ID, c.PRODUCT_ID, c.QTY, p.NAME, p.PRICE, p.STOCK_COUNT, p.IMAGE_DATA, p.DESCRIPTION
      FROM cart c
      JOIN products p ON c.PRODUCT_ID = p.PRODUCT_ID
      WHERE c.USER_ID = :userId
      ORDER BY c.ID DESC
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
      qty: r.QTY,
      name: r.NAME,
      price: r.PRICE,
      stockCount: r.STOCK_COUNT,
      imageData: r.IMAGE_DATA,
      description: r.DESCRIPTION
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch cart' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    const { productId, qty = 1 } = req.body || {};

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const checkSql = `SELECT ID, QTY FROM cart WHERE USER_ID = :userId AND PRODUCT_ID = :productId`;
    const checkRes = await execute(checkSql, { userId, productId });
    const existing = checkRes.rows?.[0];

    if (existing) {
      const newQty = existing.QTY + Number(qty);
      const updateSql = `UPDATE cart SET QTY = :newQty WHERE ID = :id`;
      await execute(updateSql, { newQty, id: existing.ID }, { autoCommit: true });
      res.json({ success: true, message: 'Cart updated', id: existing.ID, qty: newQty });
    } else {
      const insertSql = `
        INSERT INTO cart (ID, USER_ID, PRODUCT_ID, QTY)
        VALUES (cart_seq.NEXTVAL, :userId, :productId, :qty)
        RETURNING ID INTO :id
      `;
      const binds = {
        userId,
        productId: Number(productId),
        qty: Number(qty),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
      const result = await execute(insertSql, binds, { autoCommit: true });
      const cartId = result?.outBinds?.id?.[0];
      res.status(201).json({ success: true, message: 'Added to cart', id: cartId, qty });
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ message: err.message || 'Failed to add to cart' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { qty } = req.body || {};

    if (qty === undefined || isNaN(Number(qty)) || Number(qty) <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const updateSql = `UPDATE cart SET QTY = :qty WHERE ID = :id`;
    const result = await execute(updateSql, { qty: Number(qty), id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ success: true, id, qty: Number(qty) });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ message: err.message || 'Failed to update quantity' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleteSql = `DELETE FROM cart WHERE ID = :id`;
    const result = await execute(deleteSql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Removed from cart', id });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ message: err.message || 'Failed to remove from cart' });
  }
});

router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user?.sub);

    const cartSql = `
      SELECT c.ID, c.PRODUCT_ID, c.QTY, p.STOCK_COUNT, p.NAME
      FROM cart c
      JOIN products p ON c.PRODUCT_ID = p.PRODUCT_ID
      WHERE c.USER_ID = :userId
    `;
    const cartRes = await execute(cartSql, { userId });
    const items = cartRes.rows || [];

    if (items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    for (const item of items) {
      if (item.STOCK_COUNT < item.QTY) {
        return res.status(400).json({ message: `Insufficient stock for product ${item.NAME}` });
      }
    }

    for (const item of items) {
      const decSql = `UPDATE products SET STOCK_COUNT = STOCK_COUNT - :qty WHERE PRODUCT_ID = :productId`;
      await execute(decSql, { qty: item.QTY, productId: item.PRODUCT_ID }, { autoCommit: true });

      const orderSql = `
        INSERT INTO orders (ORDER_ID, USER_ID, PRODUCT_ID, QTY)
        VALUES (orders_seq.NEXTVAL, :userId, :productId, :qty)
      `;
      await execute(orderSql, { userId, productId: item.PRODUCT_ID, qty: item.QTY }, { autoCommit: true });
    }

    await execute(`DELETE FROM cart WHERE USER_ID = :userId`, { userId }, { autoCommit: true });

    res.json({ success: true, message: 'Checkout successful!' });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: err.message || 'Checkout failed' });
  }
});

module.exports = router;
