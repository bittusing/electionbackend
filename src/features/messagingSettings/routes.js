const express = require('express');
const router = express.Router();
const credentialController = require('./credential.controller');
const templateController = require('./template.controller');
const { protect } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/checkPermission');

router.use(protect);

router.post('/credentials', checkPermission('settings', 'edit'), credentialController.saveCredentials);
router.get('/credentials', checkPermission('settings', 'view'), credentialController.getAllCredentials);
router.get('/credentials/:type', checkPermission('settings', 'view'), credentialController.getCredentialsByType);
router.post('/credentials/:type/test', checkPermission('settings', 'edit'), credentialController.testConnection);
router.get('/credentials/:type/:provider/history', checkPermission('settings', 'view'), credentialController.getVersionHistory);
router.post('/credentials/:type/:provider/restore', checkPermission('settings', 'edit'), credentialController.restoreVersion);
router.get('/credentials/:type/:provider/stats', checkPermission('settings', 'view'), credentialController.getStats);
router.put('/credentials/:credentialId/priority', checkPermission('settings', 'edit'), credentialController.updatePriority);
router.put('/credentials/:credentialId/primary', checkPermission('settings', 'edit'), credentialController.setPrimary);
router.delete('/credentials/:credentialId', checkPermission('settings', 'edit'), credentialController.deleteCredential);

router.post('/templates', checkPermission('settings', 'edit'), templateController.createTemplate);
router.get('/templates', checkPermission('settings', 'view'), templateController.getTemplates);
router.get('/templates/:id', checkPermission('settings', 'view'), templateController.getTemplateById);
router.put('/templates/:id', checkPermission('settings', 'edit'), templateController.updateTemplate);
router.delete('/templates/:id', checkPermission('settings', 'edit'), templateController.deleteTemplate);
router.get('/templates/:id/preview', checkPermission('settings', 'view'), templateController.previewTemplate);
router.post('/templates/:id/test', checkPermission('settings', 'edit'), templateController.sendTestMessage);
router.get('/templates/:id/usage', checkPermission('settings', 'view'), templateController.getTemplateUsage);
router.get('/templates-export', checkPermission('settings', 'view'), templateController.exportTemplates);
router.post('/templates-import', checkPermission('settings', 'edit'), templateController.importTemplates);

module.exports = router;
