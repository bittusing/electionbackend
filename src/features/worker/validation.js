const Joi = require('joi');

exports.createWorkerValidation = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  areaId: Joi.string().hex().length(24),
  designation: Joi.string(),
  joiningDate: Joi.date()
});

exports.updateWorkerValidation = Joi.object({
  areaId: Joi.string().hex().length(24),
  designation: Joi.string(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'ON_LEAVE')
});

exports.markAttendanceValidation = Joi.object({
  status: Joi.string().valid('PRESENT', 'ABSENT', 'HALF_DAY').required(),
  checkInTime: Joi.date(),
  checkOutTime: Joi.date(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  })
});

exports.addDailyReportValidation = Joi.object({
  summary: Joi.string().required(),
  activitiesCompleted: Joi.array().items(Joi.string()),
  votersContacted: Joi.number().min(0),
  issuesReported: Joi.array().items(Joi.string()),
  photos: Joi.array().items(Joi.string()),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  })
});
