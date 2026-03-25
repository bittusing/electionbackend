const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const limiter = require('./middleware/rateLimiter');

const app = express();

// CORS Configuration - Allow frontend to connect
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./features/auth/routes'));
app.use('/api/areas', require('./features/area/routes'));
app.use('/api/voters', require('./features/voter/routes'));
app.use('/api/tasks', require('./features/task/routes'));
app.use('/api/rallies', require('./features/rally/routes'));
app.use('/api/workers', require('./features/worker/routes'));
app.use('/api/campaigns', require('./features/campaign/routes'));
app.use('/api/messaging-campaigns', require('./features/messagingCampaign/routes'));
app.use('/api/messaging-settings', require('./features/messagingSettings/routes'));
app.use('/api/daily-reports', require('./features/dailyReport/routes'));
app.use('/api/permissions', require('./features/permission/routes'));
app.use('/api/analytics', require('./features/analytics/routes'));
app.use('/api/election-config', require('./features/electionConfig/routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
