const { execute, oracledb } = require('../db/oracle');

async function getBlogs() {
  // Adjust column names/table names to your schema.
  // Assumptions:
  // blogs table has: ID, TITLE, CONTENT (CLOB), AUTHOR_ID or AUTHOR
  const sql = `
    SELECT ID, TITLE, CONTENT
    FROM blogs
    ORDER BY ID DESC
  `;

  const result = await execute(sql, [], { fetchInfo: { CONTENT: { type: oracledb.CLOB } } });

  const rows = result.rows || [];

  // Convert CLOBs to strings.
  // oracledb OUT_FORMAT_OBJECT already gives LOB objects for CLOB columns.
  for (const r of rows) {
    if (r.CONTENT && typeof r.CONTENT === 'object' && typeof r.CONTENT.getData === 'function') {
      r.CONTENT = await r.CONTENT.getData();
    }
  }

  return rows;
}

module.exports = {
  getBlogs
};

