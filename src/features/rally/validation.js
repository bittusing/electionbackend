const Joi = require('joi');

exports.createRallyValidation = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string(),
  type: Joi.string().valid('RALLY', 'PUBLIC_MEETING', 'DOOR_TO_DOOR', 'CORNER_MEETING', 'ROAD_SHOW', 'PRESS_CONFERENCE', 'OTHER'),
  areaId: Joi.string().hex().length(24),
  venue: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    landmark: Joi.string(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  }),
  schedule: Joi.object({
    date: Joi.date().min('now').required(),
    startTime: Joi.string().required(),
    endTime: Joi.string(),
    duration: Joi.number()
  }).required(),
  expectedAttendees: Joi.number().min(0),
  assignedWorkers: Joi.array().items(Joi.object({
    userId: Joi.string().hex().length(24),
    role: Joi.string(),
    responsibility: Joi.string()
  })),
  requirements: Joi.object({
    stage: Joi.boolean(),
    soundSystem: Joi.boolean(),
    chairs: Joi.number().min(0),
    banners: Joi.number().min(0),
    volunteers: Joi.number().min(0),
    security: Joi.number().min(0),
    other: Joi.array().items(Joi.string())
  }),
  budget: Joi.object({
    estimated: Joi.number().min(0),
    actual: Joi.number().min(0)
  }),
  tags: Joi.array().items(Joi.string())
});

exports.updateRallyValidation = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string(),
  venue: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    landmark: Joi.string()
  }),
  schedule: Joi.object({
    date: Joi.date(),
    startTime: Joi.string(),
    endTime: Joi.string()
  }),
  expectedAttendees: Joi.number().min(0),
  actualAttendees: Joi.number().min(0),
  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'),
  feedback: Joi.object({
    rating: Joi.number().min(1).max(5),
    comments: Joi.string(),
    issues: Joi.array().items(Joi.string())
  })
});
