const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { execute, oracledb } = require('../db/oracle');

const router = express.Router();

// GET /api/orders - Get orders for current buyer
router.get('/', requireAuth, async (req, res) => {
  try {
    const buyerId = Number(req.user?.sub);
    const sql = `
      SELECT o.ORDER_ID, o.PRODUCT_ID, o.SELLER_ID, o.QTY, o.TOTAL_AMOUNT, o.ADDRESS, o.PAYMENT_STATUS, o.ORDER_STATUS, o.RATING, o.REVIEW, o.CREATED_AT,
             p.NAME AS PRODUCT_NAME, p.PRICE AS PRODUCT_PRICE, p.IMAGE_DATA
      FROM orders o
      JOIN products p ON o.PRODUCT_ID = p.PRODUCT_ID
      WHERE o.BUYER_ID = :buyerId
      ORDER BY o.CREATED_AT DESC
    `;
    
    const result = await execute(sql, { buyerId }, {
      fetchInfo: {
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });
    
    return res.json(result.rows || []);
  } catch (err) {
    console.error('Error getting buyer orders:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch orders' });
  }
});

// GET /api/orders/received - Get orders received for a seller
router.get('/received', requireAuth, async (req, res) => {
  try {
    const sellerId = Number(req.user?.sub);
    const sql = `
      SELECT o.*, p.NAME FROM orders o JOIN products p ON o.PRODUCT_ID = p.PRODUCT_ID WHERE o.SELLER_ID = :sellerId ORDER BY o.CREATED_AT DESC
    `;
    
    const result = await execute(sql, { sellerId });
    const mapped = (result.rows || []).map(r => ({
      ORDER_ID: r.ORDER_ID,
      BUYER_ID: r.BUYER_ID,
      PRODUCT_ID: r.PRODUCT_ID,
      SELLER_ID: r.SELLER_ID,
      QTY: r.QTY,
      TOTAL_AMOUNT: r.TOTAL_AMOUNT,
      ADDRESS: r.ADDRESS,
      PAYMENT_STATUS: r.PAYMENT_STATUS,
      ORDER_STATUS: r.ORDER_STATUS,
      CREATED_AT: r.CREATED_AT,
      PRODUCT_NAME: r.NAME,
      NAME: r.NAME
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('Error getting seller orders:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch received orders' });
  }
});

// POST /api/orders/checkout - Create orders (checkout)
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const buyerId = Number(req.user?.sub);
    const { address, productId, qty = 1 } = req.body || {};

    if (!address) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // 1. Get cart items or direct item
    let items = [];
    if (productId) {
      const prodSql = `SELECT PRODUCT_ID, STOCK_COUNT, NAME, PRICE, SELLER_ID FROM products WHERE PRODUCT_ID = :productId`;
      const prodRes = await execute(prodSql, { productId: Number(productId) });
      const product = prodRes.rows?.[0];

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.STOCK_COUNT < qty) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.NAME}` });
      }

      items.push({
        PRODUCT_ID: product.PRODUCT_ID,
        QTY: qty,
        PRICE: product.PRICE,
        SELLER_ID: product.SELLER_ID
      });
    } else {
      const cartSql = `
        SELECT c.ID, c.PRODUCT_ID, c.QTY, p.STOCK_COUNT, p.NAME, p.PRICE, p.SELLER_ID
        FROM cart c
        JOIN products p ON c.PRODUCT_ID = p.PRODUCT_ID
        WHERE c.USER_ID = :buyerId
      `;
      const cartRes = await execute(cartSql, { buyerId });
      const rows = cartRes.rows || [];

      if (rows.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      for (const item of rows) {
        if (item.STOCK_COUNT < item.QTY) {
          return res.status(400).json({ message: `Insufficient stock for product ${item.NAME}` });
        }
      }

      items = rows.map(r => ({
        PRODUCT_ID: r.PRODUCT_ID,
        QTY: r.QTY,
        PRICE: r.PRICE,
        SELLER_ID: r.SELLER_ID
      }));
    }

    // 2. Process checkout and save to orders table
    for (const item of items) {
      // Decrement stock
      const decSql = `UPDATE products SET STOCK_COUNT = STOCK_COUNT - :qty WHERE PRODUCT_ID = :productId`;
      await execute(decSql, { qty: item.QTY, productId: item.PRODUCT_ID }, { autoCommit: true });

      // Total Amount: item price * qty
      const totalAmount = item.PRICE * item.QTY;

      // Insert order record
      const orderSql = `
        INSERT INTO orders (ORDER_ID, BUYER_ID, PRODUCT_ID, SELLER_ID, QTY, TOTAL_AMOUNT, ADDRESS, PAYMENT_STATUS, ORDER_STATUS, CREATED_AT)
        VALUES (orders_seq.NEXTVAL, :buyerId, :productId, :sellerId, :qty, :totalAmount, :address, 'Paid', 'Received', CURRENT_TIMESTAMP)
        RETURNING ORDER_ID INTO :id
      `;
      const binds = {
        buyerId,
        productId: item.PRODUCT_ID,
        sellerId: item.SELLER_ID,
        qty: item.QTY,
        totalAmount,
        address,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
      const result = await execute(orderSql, binds, { autoCommit: true });
      const orderId = result?.outBinds?.id?.[0];

      // Notification
      const buyerRes = await execute('SELECT COALESCE(FULLNAME, USERNAME, EMAIL) AS NAME FROM users u LEFT JOIN profiles p ON p.USER_ID = u.ID WHERE u.ID = :buyerId', { buyerId });
      const buyerName = buyerRes.rows?.[0]?.NAME || 'Someone';

      const notifSql = `
        INSERT INTO notifications (NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT)
        VALUES (notif_seq.NEXTVAL, :recipient, :sender, 'NEW_ORDER', NULL, :refId, NULL, 1, SYSTIMESTAMP)
        RETURNING NOTIF_ID INTO :id
      `;
      const notifRes = await execute(notifSql, {
        recipient: item.SELLER_ID,
        sender: buyerName,
        refId: orderId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }, { autoCommit: true });
      const notifId = notifRes?.outBinds?.id?.[0];

      const io = req.app.get('io');
      if (io) {
        io.to(item.SELLER_ID).emit('NEW_NOTIFICATION', {
          NOTIF_ID: notifId,
          RECIPIENT_ID: item.SELLER_ID,
          SENDER_NAME: buyerName,
          ACTIVITY_TYPE: 'NEW_ORDER',
          BLOG_TITLE: null,
          REFERENCE_ID: orderId,
          ADDITIONAL_INFO: null,
          IS_UNREAD: 1,
          CREATED_AT: new Date().toISOString()
        });
      }
    }

    // 3. Clear cart if this was a cart checkout
    if (!productId) {
      await execute(`DELETE FROM cart WHERE USER_ID = :buyerId`, { buyerId }, { autoCommit: true });
    }

    return res.status(201).json({ success: true, message: 'Order placed successfully!' });
  } catch (err) {
    console.error('Error placing order:', err);
    return res.status(500).json({ message: err.message || 'Checkout failed' });
  }
});

// PUT /api/orders/:orderId/status - Update order status (Seller update)
router.put('/:orderId/status', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Check if order exists
    const checkSql = `SELECT ORDER_ID, SELLER_ID, BUYER_ID FROM orders WHERE ORDER_ID = :orderId`;
    const checkRes = await execute(checkSql, { orderId });
    if (checkRes.rows?.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const buyerId = checkRes.rows?.[0]?.BUYER_ID;

    const updateSql = `UPDATE orders SET ORDER_STATUS = :status WHERE ORDER_ID = :orderId`;
    await execute(updateSql, { status, orderId }, { autoCommit: true });

    // Notification
    const sellerId = Number(req.user?.sub);
    const sellerRes = await execute('SELECT COALESCE(FULLNAME, USERNAME, EMAIL) AS NAME FROM users u LEFT JOIN profiles p ON p.USER_ID = u.ID WHERE u.ID = :userId', { userId: sellerId });
    const sellerName = sellerRes.rows?.[0]?.NAME || 'Someone';

    const notifSql = `
      INSERT INTO notifications (NOTIF_ID, RECIPIENT_ID, SENDER_NAME, ACTIVITY_TYPE, BLOG_TITLE, REFERENCE_ID, ADDITIONAL_INFO, IS_UNREAD, CREATED_AT)
      VALUES (notif_seq.NEXTVAL, :recipient, :sender, 'ORDER_STATUS', NULL, :refId, :info, 1, SYSTIMESTAMP)
      RETURNING NOTIF_ID INTO :id
    `;
    const notifRes = await execute(notifSql, {
      recipient: buyerId,
      sender: sellerName,
      refId: orderId,
      info: status,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }, { autoCommit: true });
    const notifId = notifRes?.outBinds?.id?.[0];

    const io = req.app.get('io');
    if (io) {
      io.to(buyerId).emit('NEW_NOTIFICATION', {
        NOTIF_ID: notifId,
        RECIPIENT_ID: buyerId,
        SENDER_NAME: sellerName,
        ACTIVITY_TYPE: 'ORDER_STATUS',
        BLOG_TITLE: null,
        REFERENCE_ID: orderId,
        ADDITIONAL_INFO: status,
        IS_UNREAD: 1,
        CREATED_AT: new Date().toISOString()
      });
    }

    return res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ message: err.message || 'Failed to update order status' });
  }
});

// PUT /api/orders/:orderId/review - Submit rating/review (Buyer submit)
router.put('/:orderId/review', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { rating, review } = req.body || {};

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating (must be between 1 and 5)' });
    }

    // Check if order exists and is delivered
    const checkSql = `SELECT ORDER_ID, BUYER_ID, ORDER_STATUS FROM orders WHERE ORDER_ID = :orderId`;
    const checkRes = await execute(checkSql, { orderId });
    const order = checkRes.rows?.[0];

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.ORDER_STATUS !== 'Delivered') {
      return res.status(400).json({ message: 'Cannot review an order that has not been delivered' });
    }

    const updateSql = `UPDATE orders SET RATING = :rating, REVIEW = :review WHERE ORDER_ID = :orderId`;
    await execute(updateSql, { rating: Number(rating), review: review || '', orderId }, { autoCommit: true });

    return res.json({ success: true, message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('Error submitting review:', err);
    return res.status(500).json({ message: err.message || 'Failed to submit review' });
  }
});

module.exports = router;
