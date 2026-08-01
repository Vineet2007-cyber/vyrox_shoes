const { pool, createDatabaseIfNotExists } = require('./db');
const fs = require('fs');
const path = require('path');

const initDb = async () => {
  console.log('Initializing Vyrox Shoes Database...');
  const created = await createDatabaseIfNotExists();

  if (!created) {
    console.error('Database initialization aborted: Could not connect to MySQL server.');
    return false;
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL statements by semicolon
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const connection = await pool.getConnection();

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log('Vyrox Shoes database schema and tables created/verified successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error executing DB schema initialization:', error.message);
    return false;
  }
};

if (require.main === module) {
  initDb().then(() => process.exit());
}

module.exports = initDb;
