const { testConnection } = require('./config/db');

const runTest = async () => {
  console.log('Testing MySQL Connection...');
  const result = await testConnection();

  if (result.success) {
    console.log('✅ TEST PASSED: Successfully connected to MySQL database!');
  } else {
    console.log('❌ TEST FAILED:', result.error);
    console.log('ℹ️  Hint:', result.hint);
  }

  process.exit(result.success ? 0 : 1);
};

runTest();
