const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vyrox_shoes',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Ensures the target database exists on MySQL server
 */
const createDatabaseIfNotExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    console.log(`Database '${dbConfig.database}' checked/created successfully.`);
    await connection.end();
    return true;
  } catch (error) {
    console.error(`Database creation check failed: ${error.message}`);
    return false;
  }
};

/**
 * Tests connection to the MySQL database
 */
const testConnection = async () => {
  try {
    await createDatabaseIfNotExists();
    const connection = await pool.getConnection();
    console.log(`MySQL connected successfully to database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return {
      success: true,
      message: `Connected to MySQL database '${dbConfig.database}' successfully.`
    };
  } catch (error) {
    console.error(`MySQL Connection Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      hint: 'Ensure MySQL Server is installed and running on port 3306, and check your .env parameters.'
    };
  }
};

module.exports = {
  pool,
  dbConfig,
  createDatabaseIfNotExists,
  testConnection
};
