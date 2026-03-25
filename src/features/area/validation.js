const Joi = require('joi');

exports.createAreaValidation = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('STATE', 'DISTRICT', 'BLOCK', 'VILLAGE', 'WARD', 'BOOTH').required(),
  code: Joi.string().max(50),
  parentId: Joi.string().hex().length(24).allow(null),
  assignedManager: Joi.string().hex().length(24),
  metadata: Joi.object({
    population: Joi.number().min(0),
    totalVoters: Joi.number().min(0),
    maleVoters: Joi.number().min(0),
    femaleVoters: Joi.number().min(0),
    otherVoters: Joi.number().min(0)
  }),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  })
});

exports.updateAreaValidation = Joi.object({
  name: Joi.string().min(2).max(100),
  assignedManager: Joi.string().hex().length(24).allow(null),
  metadata: Joi.object({
    population: Joi.number().min(0),
    totalVoters: Joi.number().min(0),
    maleVoters: Joi.number().min(0),
    femaleVoters: Joi.number().min(0),
    otherVoters: Joi.number().min(0)
  }),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }),
  status: Joi.string().valid('ACTIVE', 'INACTIVE')
});
