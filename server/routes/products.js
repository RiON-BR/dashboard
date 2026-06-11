const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
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

// GET /api/products -> Fetch all products
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT p.PRODUCT_ID, p.SELLER_ID, p.NAME, p.DESCRIPTION, p.PRICE, p.STOCK_COUNT, p.IMAGE_DATA, p.CREATED_AT,
             COALESCE(prof.FULLNAME, u.USERNAME, u.EMAIL) AS SELLER_NAME
      FROM products p
      JOIN users u ON p.SELLER_ID = u.ID
      LEFT JOIN profiles prof ON prof.USER_ID = u.ID
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

    const products = rows.map(r => ({
      id: r.PRODUCT_ID,
      sellerId: r.SELLER_ID,
      name: r.NAME,
      description: r.DESCRIPTION,
      price: r.PRICE,
      stockCount: r.STOCK_COUNT,
      imageData: r.IMAGE_DATA,
      createdAt: r.CREATED_AT,
      sellerName: r.SELLER_NAME
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch products' });
  }
});

// GET /api/products/my-products -> Fetch seller's own products
router.get('/my-products', requireAuth, requireRole(['seller']), async (req, res) => {
  try {
    const sellerId = Number(req.user?.sub);
    const sql = `
      SELECT p.PRODUCT_ID, p.SELLER_ID, p.NAME, p.DESCRIPTION, p.PRICE, p.STOCK_COUNT, p.IMAGE_DATA, p.CREATED_AT,
             COALESCE(prof.FULLNAME, u.USERNAME, u.EMAIL) AS SELLER_NAME
      FROM products p
      JOIN users u ON p.SELLER_ID = u.ID
      LEFT JOIN profiles prof ON prof.USER_ID = u.ID
      WHERE p.SELLER_ID = :sellerId
      ORDER BY p.CREATED_AT DESC
    `;

    const result = await execute(sql, { sellerId }, {
      fetchInfo: {
        IMAGE_DATA: { type: oracledb.STRING }
      }
    });

    const rows = result.rows || [];
    for (const r of rows) {
      await convertLobRow(r);
    }

    const products = rows.map(r => ({
      id: r.PRODUCT_ID,
      sellerId: r.SELLER_ID,
      name: r.NAME,
      description: r.DESCRIPTION,
      price: r.PRICE,
      stockCount: r.STOCK_COUNT,
      imageData: r.IMAGE_DATA,
      createdAt: r.CREATED_AT,
      sellerName: r.SELLER_NAME
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching my products:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch my products' });
  }
});

// POST /api/products -> Add new product (Sellers only)
router.post('/', requireAuth, requireRole(['seller']), async (req, res) => {
  // Extra guard for role normalization; does not change existing authorization logic.
  // If token role is missing or not 'seller', requireRole will still block with 403.

  

  try {
    const sellerId = Number(req.user?.sub);
    const { name, description, price, stockCount, imageData } = req.body || {};

    if (!name || price === undefined || stockCount === undefined) {
      return res.status(400).json({ message: 'Name, price, and stock count are required' });
    }

    const numPrice = Number(price);
    const numStock = Number(stockCount);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ message: 'Invalid stock count' });
    }

    const insertSql = `
      INSERT INTO products (PRODUCT_ID, SELLER_ID, NAME, DESCRIPTION, PRICE, STOCK_COUNT, IMAGE_DATA, CREATED_AT)
      VALUES (products_seq.NEXTVAL, :sellerId, :name, :description, :price, :stockCount, :imageData, CURRENT_TIMESTAMP)
      RETURNING PRODUCT_ID INTO :id
    `;

    const binds = {
      sellerId,
      name,
      description: description || '',
      price: numPrice,
      stockCount: numStock,
      imageData: imageData || '',
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execute(insertSql, binds, { autoCommit: true });
    const productId = result?.outBinds?.id?.[0];

    res.status(201).json({
      id: productId,
      sellerId,
      name,
      description,
      price: numPrice,
      stockCount: numStock,
      imageData,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:productId -> Edit price/stock count (Sellers only)
router.put('/:productId', requireAuth, requireRole(['seller']), async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const sellerId = Number(req.user?.sub);
    const { price, stockCount } = req.body || {};

    if (price === undefined || stockCount === undefined) {
      return res.status(400).json({ message: 'Price and stock count are required' });
    }

    const numPrice = Number(price);
    const numStock = Number(stockCount);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ message: 'Invalid stock count' });
    }

    const updateSql = `
      UPDATE products
      SET PRICE = :price, STOCK_COUNT = :stockCount
      WHERE PRODUCT_ID = :productId AND SELLER_ID = :sellerId
    `;

    const result = await execute(updateSql, {
      price: numPrice,
      stockCount: numStock,
      productId,
      sellerId
    }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    res.json({ success: true, productId, price: numPrice, stockCount: numStock });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: err.message || 'Failed to update product' });
  }
});

// POST /api/products/:productId/buy -> Buy product (decrements stock count)
router.post('/:productId/buy', requireAuth, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const userId = Number(req.user?.sub);

    // Fetch the product first to check stock and seller ID
    const getSql = `SELECT SELLER_ID, STOCK_COUNT, NAME FROM products WHERE PRODUCT_ID = :productId`;
    const getRes = await execute(getSql, { productId });
    const product = getRes.rows?.[0];

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.SELLER_ID === userId) {
      return res.status(400).json({ message: 'You cannot buy your own product listing' });
    }

    if (product.STOCK_COUNT <= 0) {
      return res.status(400).json({ message: 'Product is out of stock' });
    }

    // Decrement stock count
    const updateSql = `
      UPDATE products 
      SET STOCK_COUNT = STOCK_COUNT - 1 
      WHERE PRODUCT_ID = :productId AND STOCK_COUNT > 0
    `;
    const result = await execute(updateSql, { productId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(400).json({ message: 'Failed to purchase product (out of stock)' });
    }

    // Save to orders table
    const orderSql = `
      INSERT INTO orders (ORDER_ID, BUYER_ID, PRODUCT_ID, SELLER_ID, QTY, TOTAL_AMOUNT, ADDRESS, PAYMENT_STATUS, ORDER_STATUS, CREATED_AT)
      VALUES (orders_seq.NEXTVAL, :userId, :productId, :sellerId, 1, :totalAmount, 'Direct Purchase', 'Paid', 'Received', CURRENT_TIMESTAMP)
    `;
    await execute(orderSql, { 
      userId, 
      productId, 
      sellerId: product.SELLER_ID, 
      totalAmount: product.PRICE 
    }, { autoCommit: true });

    res.json({ success: true, message: `Successfully purchased ${product.NAME}!` });
  } catch (err) {
    console.error('Error buying product:', err);
    res.status(500).json({ message: err.message || 'Failed to complete purchase' });
  }
});

// DELETE /api/products/:productId -> Delete product listing (Seller or Admin)
router.delete('/:productId', requireAuth, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const userId = Number(req.user?.sub);
    const userRole = req.user?.role;

    // Check if product exists
    const checkSql = `SELECT SELLER_ID FROM products WHERE PRODUCT_ID = :productId`;
    const checkRes = await execute(checkSql, { productId });
    const product = checkRes.rows?.[0];

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (userRole !== 'admin' && Number(product.SELLER_ID) !== userId) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to delete this listing' });
    }

    // Delete cart/wishlist items referencing this product
    await execute('DELETE FROM cart WHERE PRODUCT_ID = :productId', { productId }, { autoCommit: true });
    await execute('DELETE FROM wishlist WHERE PRODUCT_ID = :productId', { productId }, { autoCommit: true });

    const deleteSql = `DELETE FROM products WHERE PRODUCT_ID = :productId`;
    await execute(deleteSql, { productId }, { autoCommit: true });

    res.json({ success: true, message: 'Product listing deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message || 'Failed to delete product' });
  }
});

module.exports = router;
