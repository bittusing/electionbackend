const Joi = require('joi');

exports.createTaskValidation = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string(),
  assignedTo: Joi.string().hex().length(24).required(),
  areaId: Joi.string().hex().length(24),
  taskType: Joi.string().valid('VOTER_CONTACT', 'SURVEY', 'EVENT', 'DOOR_TO_DOOR', 'PHONE_BANKING', 'DATA_ENTRY', 'OTHER'),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  dueDate: Joi.date().min('now'),
  startDate: Joi.date(),
  tags: Joi.array().items(Joi.string())
});

exports.updateTaskValidation = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string(),
  assignedTo: Joi.string().hex().length(24),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
  dueDate: Joi.date(),
  tags: Joi.array().items(Joi.string())
});

exports.completeTaskValidation = Joi.object({
  notes: Joi.string().required(),
  votersContacted: Joi.number().min(0),
  photos: Joi.array().items(Joi.string()),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  })
});
