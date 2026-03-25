const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/checkPermission');
const { resolveAreaScope } = require('../../middleware/areaScope');
const { validate } = require('../../middleware/validator');
const validation = require('./validation');

router.post('/login', validate(validation.loginValidation), controller.login);

router.use(protect);
router.use(resolveAreaScope);

router.post('/register', checkPermission('users', 'create'), validate(validation.registerValidation), controller.register);
router.get('/users', checkPermission('users', 'view'), controller.getAllUsers);
router.get('/profile', controller.getProfile);
router.put('/profile', validate(validation.updateProfileValidation), controller.updateProfile);
router.put('/change-password', validate(validation.changePasswordValidation), controller.changePassword);

module.exports = router;
