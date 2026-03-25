const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/checkPermission');
const { resolveAreaScope } = require('../../middleware/areaScope');
const { validate } = require('../../middleware/validator');
const validation = require('./validation');

router.use(protect);
router.use(resolveAreaScope);

router.post('/', 
  checkPermission('workers', 'create'),
  validate(validation.createWorkerValidation),
  controller.createWorker
);

router.get('/', checkPermission('workers', 'view'), controller.getWorkers);
router.get('/:id', checkPermission('workers', 'view'), controller.getWorkerById);

router.put('/:id',
  checkPermission('workers', 'edit'),
  validate(validation.updateWorkerValidation),
  controller.updateWorker
);

router.post('/:id/attendance',
  checkPermission('workers', 'edit'),
  validate(validation.markAttendanceValidation),
  controller.markAttendance
);

router.post('/:id/daily-report',
  checkPermission('workers', 'edit'),
  validate(validation.addDailyReportValidation),
  controller.addDailyReport
);

router.delete('/:id',
  checkPermission('workers', 'delete'),
  controller.deleteWorker
);

module.exports = router;
