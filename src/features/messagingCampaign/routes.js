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

router.post('/filter-count',
  checkPermission('campaigns', 'view'),
  validate(validation.getFilteredVotersValidation),
  controller.getFilteredVoterCount
);

router.post('/filter-voters',
  checkPermission('campaigns', 'view'),
  validate(validation.getFilteredVotersValidation),
  controller.getFilteredVoters
);

router.get('/', checkPermission('campaigns', 'view'), controller.getCampaigns);
router.get('/:id', checkPermission('campaigns', 'view'), controller.getCampaignById);
router.get('/:id/stats', checkPermission('campaigns', 'view'), controller.getCampaignStats);

router.put('/:id',
  checkPermission('campaigns', 'edit'),
  validate(validation.updateCampaignValidation),
  controller.updateCampaign
);

router.post('/:id/send',
  checkPermission('campaigns', 'edit'),
  controller.sendCampaign
);

router.delete('/:id',
  checkPermission('campaigns', 'delete'),
  controller.deleteCampaign
);

module.exports = router;
