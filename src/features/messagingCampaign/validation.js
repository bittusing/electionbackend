const Joi = require('joi');

exports.createCampaignValidation = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string(),
  messageType: Joi.string().valid('SMS', 'WHATSAPP', 'BOTH').required(),
  messageTemplate: Joi.string().required(),
  filters: Joi.object({
    state: Joi.string(),
    district: Joi.string(),
    block: Joi.string(),
    gramPanchayat: Joi.string(),
    ward: Joi.string(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    ageMin: Joi.number().min(18).max(120),
    ageMax: Joi.number().min(18).max(120),
    caste: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER'),
    religion: Joi.string().valid('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER'),
    education: Joi.string(),
    supportLevel: Joi.string().valid('STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'),
    areaIds: Joi.array().items(Joi.string().hex().length(24))
  }),
  scheduledAt: Joi.date()
});

exports.updateCampaignValidation = Joi.object({
  name: Joi.string().min(3).max(200),
  description: Joi.string(),
  messageTemplate: Joi.string(),
  filters: Joi.object({
    state: Joi.string(),
    district: Joi.string(),
    block: Joi.string(),
    gramPanchayat: Joi.string(),
    ward: Joi.string(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    ageMin: Joi.number().min(18).max(120),
    ageMax: Joi.number().min(18).max(120),
    caste: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER'),
    religion: Joi.string().valid('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER'),
    education: Joi.string(),
    supportLevel: Joi.string().valid('STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'),
    areaIds: Joi.array().items(Joi.string().hex().length(24))
  }),
  status: Joi.string().valid('DRAFT', 'SCHEDULED', 'CANCELLED'),
  scheduledAt: Joi.date()
});

exports.getFilteredVotersValidation = Joi.object({
  filters: Joi.object({
    state: Joi.string(),
    district: Joi.string(),
    block: Joi.string(),
    gramPanchayat: Joi.string(),
    ward: Joi.string(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    ageMin: Joi.number().min(18).max(120),
    ageMax: Joi.number().min(18).max(120),
    caste: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER'),
    religion: Joi.string().valid('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER'),
    education: Joi.string(),
    supportLevel: Joi.string().valid('STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'),
    areaIds: Joi.array().items(Joi.string().hex().length(24))
  }).required()
});
