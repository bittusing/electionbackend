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
  checkPermission('tasks', 'create'),
  validate(validation.createTaskValidation),
  controller.createTask
);

router.get('/', checkPermission('tasks', 'view'), controller.getTasks);
router.get('/my-tasks', controller.getMyTasks);
router.get('/:id', checkPermission('tasks', 'view'), controller.getTaskById);

router.put('/:id',
  checkPermission('tasks', 'edit'),
  validate(validation.updateTaskValidation),
  controller.updateTask
);

router.post('/:id/complete',
  validate(validation.completeTaskValidation),
  controller.completeTask
);

router.delete('/:id',
  checkPermission('tasks', 'delete'),
  controller.deleteTask
);

module.exports = router;
