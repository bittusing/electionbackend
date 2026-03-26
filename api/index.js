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
  await bootstrap();
  return app(req, res);
};
