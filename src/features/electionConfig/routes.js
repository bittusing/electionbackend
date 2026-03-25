const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.get('/', controller.getConfig);
router.put('/', authorize('SUPER_ADMIN', 'STATE_ADMIN'), controller.createOrUpdateConfig);

module.exports = router;
