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
  checkPermission('campaigns', 'create'),
  validate(validation.createCampaignValidation),
  controller.createCampaign
);

router.get('/', checkPermission('campaigns', 'view'), controller.getCampaigns);
router.get('/active', controller.getActiveCampaigns);
router.get('/:id', checkPermission('campaigns', 'view'), controller.getCampaignById);

router.put('/:id',
  checkPermission('campaigns', 'edit'),
  validate(validation.updateCampaignValidation),
  controller.updateCampaign
);

router.post('/:id/milestone',
  checkPermission('campaigns', 'edit'),
  validate(validation.addMilestoneValidation),
  controller.addMilestone
);

router.put('/:id/milestone/status',
  checkPermission('campaigns', 'edit'),
  controller.updateMilestoneStatus
);

router.delete('/:id',
  checkPermission('campaigns', 'delete'),
  controller.deleteCampaign
);

module.exports = router;
