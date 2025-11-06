const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const smsRoutes = require('./src/routes/sms');
const dlrRoutes = require('./src/routes/dlr');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Yieldera Weather SMS Service',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Africa's Talking routes
app.use('/at', smsRoutes);
app.use('/at', dlrRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Yieldera Weather SMS Service',
    description: 'Simple weather SMS service for African farmers',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      sms: '/at/sms',
      dlr: '/at/dlr'
    },
    commands: [
      'WEATHER lat,lng',
      'FORECAST lat,lng', 
      'RAINHISTORY lat,lng',
      'HELP'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: 'Service error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Try again later'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: ['/health', '/at/sms', '/at/dlr']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌤️  Yieldera Weather SMS Service running on port ${PORT}`);
  console.log(`📱 SMS endpoint: /at/sms`);
  console.log(`📊 DLR endpoint: /at/dlr`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌦️  Weather API: ${process.env.WEATHER_BASE || 'https://api.open-meteo.com'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
