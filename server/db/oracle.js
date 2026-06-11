const oracledb = require('oracledb');
require('dotenv').config();

let pool;

async function initOraclePool() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1
  });

  // Ensure blog_likes and conversations STATUS updates exist
  try {
    const conn = await pool.getConnection();
    try {
      await conn.execute(`
        CREATE TABLE blog_likes (
          BLOG_ID NUMBER NOT NULL,
          USER_ID NUMBER NOT NULL,
          PRIMARY KEY (BLOG_ID, USER_ID)
        )
      `);
      console.log('Created blog_likes table successfully');
    } catch (err) {
      if (err.errorNum !== 955) { // ORA-00955: name is already used by an existing object
        console.error('Error creating blog_likes table:', err);
      }
    }

    try {
      await conn.execute(`
        CREATE TABLE posts (
          POST_ID NUMBER NOT NULL,
          USER_ID NUMBER NOT NULL,
          CAPTION VARCHAR2(4000),
          IMAGE_DATA CLOB,
          LIKES_COUNT NUMBER DEFAULT 0,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (POST_ID)
        )
      `);
      console.log('Created posts table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating posts table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE posts_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created posts_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating posts_seq:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE post_likes (
          POST_ID NUMBER NOT NULL,
          USER_ID NUMBER NOT NULL,
          PRIMARY KEY (POST_ID, USER_ID)
        )
      `);
      console.log('Created post_likes table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating post_likes table:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE post_comments (
          COMMENT_ID NUMBER NOT NULL,
          POST_ID NUMBER NOT NULL,
          USER_ID NUMBER NOT NULL,
          USERNAME VARCHAR2(255),
          COMMENT_TEXT VARCHAR2(4000) NOT NULL,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (COMMENT_ID)
        )
      `);
      console.log('Created post_comments table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating post_comments table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE post_comments_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created post_comments_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating post_comments_seq:', err);
    }

    try {
      await conn.execute(`
        ALTER TABLE conversations ADD STATUS VARCHAR2(20) DEFAULT 'pending'
      `);
      console.log('Added STATUS column to conversations successfully');
    } catch (err) {
      if (err.errorNum !== 1430) { // ORA-01430: column being added already exists in table
        console.error('Error altering conversations table:', err);
      }
    }

    try {
      await conn.execute(`
        CREATE TABLE products (
          PRODUCT_ID NUMBER NOT NULL,
          SELLER_ID NUMBER NOT NULL,
          NAME VARCHAR2(255) NOT NULL,
          DESCRIPTION VARCHAR2(4000),
          PRICE NUMBER NOT NULL,
          STOCK_COUNT NUMBER NOT NULL,
          IMAGE_DATA CLOB,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (PRODUCT_ID)
        )
      `);
      console.log('Created products table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating products table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE products_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created products_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating products_seq:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE cart (
          ID NUMBER NOT NULL,
          USER_ID NUMBER NOT NULL,
          PRODUCT_ID NUMBER NOT NULL,
          QTY NUMBER NOT NULL,
          PRIMARY KEY (ID)
        )
      `);
      console.log('Created cart table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating cart table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE cart_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created cart_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating cart_seq:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE wishlist (
          ID NUMBER NOT NULL,
          USER_ID NUMBER NOT NULL,
          PRODUCT_ID NUMBER NOT NULL,
          PRIMARY KEY (ID)
        )
      `);
      console.log('Created wishlist table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating wishlist table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE wishlist_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created wishlist_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating wishlist_seq:', err);
    }

    try {
      const checkOrders = await conn.execute("SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'ORDERS' AND COLUMN_NAME = 'BUYER_ID'");
      if (checkOrders.rows.length === 0) {
        await conn.execute("DROP TABLE orders");
        console.log("Dropped old orders table");
      }
    } catch (err) {
      // Ignore if table doesn't exist
    }

    try {
      await conn.execute(`
        CREATE TABLE orders (
          ORDER_ID NUMBER PRIMARY KEY,
          BUYER_ID NUMBER,
          PRODUCT_ID NUMBER,
          SELLER_ID NUMBER,
          QTY NUMBER,
          TOTAL_AMOUNT NUMBER,
          ADDRESS VARCHAR2(500),
          PAYMENT_STATUS VARCHAR2(50),
          ORDER_STATUS VARCHAR2(50),
          RATING NUMBER DEFAULT NULL,
          REVIEW VARCHAR2(1000),
          CREATED_AT TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created orders table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating orders table:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE groups (
          GROUP_ID NUMBER PRIMARY KEY,
          NAME VARCHAR2(255) NOT NULL,
          DESCRIPTION VARCHAR2(1000),
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created groups table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating groups table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE groups_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created groups_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating groups_seq:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE group_members (
          GROUP_ID NUMBER,
          USER_ID NUMBER,
          PRIMARY KEY (GROUP_ID, USER_ID)
        )
      `);
      console.log('Created group_members table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating group_members table:', err);
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE orders_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created orders_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating orders_seq:', err);
    }

    try {
      await conn.execute(`
        CREATE TABLE notifications (
          NOTIF_ID NUMBER PRIMARY KEY,
          RECIPIENT_ID NUMBER NOT NULL,
          SENDER_NAME VARCHAR2(100) NULL,
          ACTIVITY_TYPE VARCHAR2(50) NOT NULL CHECK (ACTIVITY_TYPE IN ('LIKE', 'COMMENT', 'NEW_MSG', 'MSG_REQ', 'NEW_ORDER', 'ORDER_STATUS')),
          BLOG_TITLE VARCHAR2(100) NULL,
          REFERENCE_ID NUMBER NULL,
          ADDITIONAL_INFO VARCHAR2(255) NULL,
          IS_UNREAD NUMBER DEFAULT 1,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created notifications table successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating notifications table:', err);
    }

    try {
      await conn.execute(`
        ALTER TABLE notifications MODIFY (SENDER_NAME VARCHAR2(100) NULL)
      `);
    } catch (err) {
      // Ignore if column is already nullable (ORA-01442) or other ignorable DB errors
    }

    try {
      await conn.execute(`
        ALTER TABLE notifications MODIFY (BLOG_TITLE VARCHAR2(100) NULL)
      `);
    } catch (err) {
      // Ignore
    }

    try {
      await conn.execute(`
        ALTER TABLE notifications ADD (REFERENCE_ID NUMBER NULL)
      `);
    } catch (err) {
      // Ignore if column already exists (ORA-01430)
    }

    try {
      await conn.execute(`
        ALTER TABLE notifications ADD (ADDITIONAL_INFO VARCHAR2(255) NULL)
      `);
    } catch (err) {
      // Ignore
    }

    try {
      // Drop existing activity type check constraints if they might exist under a different definition
      try {
        await conn.execute(`ALTER TABLE notifications DROP CONSTRAINT chk_activity_type`);
      } catch (_) {}
      await conn.execute(`
        ALTER TABLE notifications ADD CONSTRAINT chk_activity_type CHECK (ACTIVITY_TYPE IN ('LIKE', 'COMMENT', 'NEW_MSG', 'MSG_REQ', 'NEW_ORDER', 'ORDER_STATUS'))
      `);
      console.log('Added CHECK constraint to notifications table successfully');
    } catch (err) {
      // Ignore if constraint already exists
    }

    try {
      await conn.execute(`
        CREATE SEQUENCE notif_seq START WITH 1 INCREMENT BY 1
      `);
      console.log('Created notif_seq sequence successfully');
    } catch (err) {
      if (err.errorNum !== 955) console.error('Error creating notif_seq sequence:', err);
    } finally {
      try { await conn.close(); } catch (_) {}
    }
  } catch (err) {
    console.error('Failed to run database initializations:', err);
  }

  return pool;
}

async function getConnection() {
  if (!pool) await initOraclePool();
  return pool.getConnection();
}

async function execute(query, binds = [], options = {}) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(query, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: 50,
      ...options
    });
    return result;
  } finally {
    try { await conn.close(); } catch (_) {}
  }
}

module.exports = {
  initOraclePool,
  getConnection,
  execute,
  oracledb
};

