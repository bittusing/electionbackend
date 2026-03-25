const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { protect, authorize } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/checkPermission');
const { resolveAreaScope } = require('../../middleware/areaScope');

router.use(protect);
router.use(resolveAreaScope);

router.post('/', controller.createReport);
router.get('/', checkPermission('reports', 'viewAll'), controller.getReports);
router.get('/my-reports', controller.getMyReports);
router.get('/summary', checkPermission('reports', 'viewAll'), controller.getReportSummary);
router.get('/:id', controller.getReportById);
router.put('/:id', controller.updateReport);
router.post('/:id/submit', controller.submitReport);
router.post('/:id/approve',
  authorize('SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_MANAGER'),
  controller.approveReport
);
router.post('/:id/reject',
  authorize('SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_MANAGER'),
  controller.rejectReport
);

module.exports = router;
