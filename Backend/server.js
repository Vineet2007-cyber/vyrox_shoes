const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes/apiRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const { testConnection } = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors());

// Configure JSON & URL-encoded parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.send('Vyrox Shoes Backend API Server is running');
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Test MySQL DB connection on startup
  await testConnection();
});
