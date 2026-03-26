require('dotenv').config();
const connectDB = require('../src/config/database');
const permissionService = require('../src/features/permission/service');
const app = require('../src/app');

let isConnected = false;

async function bootstrap() {
  if (isConnected) return;
  await connectDB();
  await permissionService.initializePermissions();
  isConnected = true;
}

module.exports = async (req, res) => {
  try {
    await bootstrap();
    return app(req, res);
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ success: false, message: 'Server initialization failed' });
  }
};
