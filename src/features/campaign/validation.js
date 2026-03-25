const Joi = require('joi');

exports.createCampaignValidation = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string(),
  type: Joi.string().valid('ELECTION', 'AWARENESS', 'VOTER_REGISTRATION', 'GET_OUT_THE_VOTE', 'FUNDRAISING', 'OTHER'),
  electionType: Joi.string().valid('GENERAL', 'STATE', 'LOCAL', 'BY_ELECTION'),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  electionDate: Joi.date(),
  targetAreas: Joi.array().items(Joi.string().hex().length(24)),
  goals: Joi.object({
    voterRegistration: Joi.number().min(0),
    voterContact: Joi.number().min(0),
    ralliesPlanned: Joi.number().min(0),
    volunteersNeeded: Joi.number().min(0)
  }),
  budget: Joi.object({
    allocated: Joi.number().min(0),
    spent: Joi.number().min(0)
  }),
  team: Joi.array().items(Joi.object({
    userId: Joi.string().hex().length(24),
    role: Joi.string(),
    responsibility: Joi.string()
  })),
  tags: Joi.array().items(Joi.string()),
  notes: Joi.string()
});

exports.updateCampaignValidation = Joi.object({
  name: Joi.string().min(3).max(200),
  description: Joi.string(),
  status: Joi.string().valid('PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED'),
  endDate: Joi.date(),
  goals: Joi.object({
    voterRegistration: Joi.number().min(0),
    voterContact: Joi.number().min(0),
    ralliesPlanned: Joi.number().min(0),
    volunteersNeeded: Joi.number().min(0)
  }),
  progress: Joi.object({
    votersRegistered: Joi.number().min(0),
    votersContacted: Joi.number().min(0),
    ralliesCompleted: Joi.number().min(0),
    volunteersRecruited: Joi.number().min(0)
  }),
  budget: Joi.object({
    allocated: Joi.number().min(0),
    spent: Joi.number().min(0)
  }),
  notes: Joi.string()
});

exports.addMilestoneValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  dueDate: Joi.date().required()
});
