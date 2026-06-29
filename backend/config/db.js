const config = require('./index');

// 测试环境：使用 mock 代替真实数据库连接
if (process.env.NODE_ENV === 'test') {
  const mockDb = require('../__tests__/helpers/db-mock');
  module.exports = mockDb;
} else {
  const mysql = require('mysql2/promise');

  const pool = mysql.createPool(config.db);

  // Test connection on startup
  pool.getConnection()
    .then(conn => {
      console.log('✅ MySQL connected successfully');
      conn.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection failed:', err.message);
    });

  module.exports = pool;
}
