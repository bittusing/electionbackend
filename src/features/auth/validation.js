const Joi = require('joi');

exports.registerValidation = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_MANAGER', 'WARD_MANAGER', 'BOOTH_WORKER', 'VOLUNTEER'),
  organizationId: Joi.string().hex().length(24),
  assignedAreas: Joi.array().items(Joi.string().hex().length(24)),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED') // Added status
});

exports.loginValidation = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  password: Joi.string().required()
}).xor('email', 'phone');

exports.updateProfileValidation = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  profileImage: Joi.string()
});

exports.changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});
