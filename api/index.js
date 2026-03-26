require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/database');
const permissionService = require('../src/features/permission/service');

let initPromise = null;

function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();
      await permissionService.initializePermissions();
    })().catch(err => {
      console.error('Init failed:', err);
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureInit();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server init failed: ' + err.message });
  }
  app(req, res);
};
