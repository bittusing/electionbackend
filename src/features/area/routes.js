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
  checkPermission('areas', 'create'),
  validate(validation.createAreaValidation),
  controller.createArea
);

router.get('/', checkPermission('areas', 'view'), controller.getAreas);

router.patch(
  '/:id/field-campaign',
  checkPermission('voters', 'edit'),
  validate(validation.patchFieldCampaignValidation),
  controller.patchFieldCampaign
);

router.get('/:id', checkPermission('areas', 'view'), controller.getAreaById);
router.get('/:id/hierarchy', checkPermission('areas', 'view'), controller.getAreaHierarchy);
router.get('/:id/stats', checkPermission('areas', 'view'), controller.getAreaStats);

router.put('/:id',
  checkPermission('areas', 'edit'),
  validate(validation.updateAreaValidation),
  controller.updateArea
);

router.delete('/:id',
  checkPermission('areas', 'delete'),
  controller.deleteArea
);

module.exports = router;
