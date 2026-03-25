const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { resolveAreaScope } = require('../../middleware/areaScope');

router.use(protect);
router.use(resolveAreaScope);

router.get('/dashboard', controller.getDashboardStats);
router.get('/area-map-stats', controller.getAreaMapStats);
router.get('/area/:areaId/performance', controller.getAreaPerformance);
router.get('/worker-performance', controller.getWorkerPerformance);
router.get('/voter-engagement', controller.getVoterEngagementStats);
router.get('/voter-demographics', controller.getVoterDemographics);
router.get('/task-completion', controller.getTaskCompletionStats);

module.exports = router;
