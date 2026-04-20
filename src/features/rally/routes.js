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
  checkPermission('rallies', 'create'),
  validate(validation.createRallyValidation),
  controller.createRally
);

router.get('/', checkPermission('rallies', 'view'), controller.getRallies);
router.get('/upcoming', checkPermission('rallies', 'view'), controller.getUpcomingRallies);
router.get('/:id/audience', checkPermission('rallies', 'view'), controller.getRallyAudience);
router.get('/:id', checkPermission('rallies', 'view'), controller.getRallyById);

router.put('/:id',
  checkPermission('rallies', 'edit'),
  validate(validation.updateRallyValidation),
  controller.updateRally
);

router.post('/:id/status',
  checkPermission('rallies', 'edit'),
  controller.updateRallyStatus
);

router.delete('/:id',
  checkPermission('rallies', 'delete'),
  controller.deleteRally
);

module.exports = router;
