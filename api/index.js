try {
  require('dotenv').config();
} catch (e) {
  console.error('dotenv error:', e.message);
}

let app;
try {
  app = require('../src/app');
} catch (e) {
  console.error('App load error:', e.message, e.stack);
  module.exports = (req, res) => {
    res.status(500).json({ success: false, error: 'App failed to load: ' + e.message });
  };
  return;
}

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
    return res.status(500).json({ success: false, message: 'DB connection failed: ' + err.message });
  }
  app(req, res);
};
