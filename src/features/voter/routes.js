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
  checkPermission('voters', 'create'),
  validate(validation.createVoterValidation),
  controller.createVoter
);

router.post('/bulk-import',
  checkPermission('voters', 'bulkImport'),
  controller.uploadMiddleware,
  controller.bulkImport
);

router.post('/bulk-import-pdf',
  checkPermission('voters', 'bulkImport'),
  controller.uploadPdfMiddleware,
  controller.bulkImportPdf
);

router.get('/', checkPermission('voters', 'view'), controller.getVoters);
router.get('/:id', checkPermission('voters', 'view'), controller.getVoterById);

router.put('/:id',
  checkPermission('voters', 'edit'),
  validate(validation.updateVoterValidation),
  controller.updateVoter
);

router.post('/:id/interaction',
  checkPermission('voters', 'edit'),
  validate(validation.addInteractionValidation),
  controller.addInteraction
);

router.delete('/:id',
  checkPermission('voters', 'delete'),
  controller.deleteVoter
);

module.exports = router;
