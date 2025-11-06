const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const smsRoutes = require('./src/routes/sms');
const dlrRoutes = require('./src/routes/dlr');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Yieldera SMS MicroCover',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Africa's Talking routes
app.use('/at', smsRoutes);
app.use('/at', dlrRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Yieldera SMS MicroCover Module',
    description: 'Agricultural insurance SMS service powered by climate intelligence',
    endpoints: {
      health: '/health',
      sms: '/at/sms',
      dlr: '/at/dlr'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Yieldera SMS MicroCover Module running on port ${PORT}`);
  console.log(`📱 SMS endpoint: /at/sms`);
  console.log(`📊 DLR endpoint: /at/dlr`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
