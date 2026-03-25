const mongoose = require('mongoose');

const rallySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide rally title'],
    trim: true
  },
  description: String,
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return process.env.ENABLE_MULTI_TENANT === 'true';
    }
  },
  type: {
    type: String,
    enum: ['RALLY', 'PUBLIC_MEETING', 'DOOR_TO_DOOR', 'CORNER_MEETING', 'ROAD_SHOW', 'PRESS_CONFERENCE', 'OTHER'],
    default: 'RALLY'
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: false
  },
  venue: {
    name: String,
    address: String,
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  schedule: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: String,
    duration: Number
  },
  expectedAttendees: {
    type: Number,
    default: 0
  },
  actualAttendees: {
    type: Number,
    default: 0
  },
  assignedWorkers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    responsibility: String
  }],
  requirements: {
    stage: { type: Boolean, default: false },
    soundSystem: { type: Boolean, default: false },
    chairs: { type: Number, default: 0 },
    banners: { type: Number, default: 0 },
    volunteers: { type: Number, default: 0 },
    security: { type: Number, default: 0 },
    other: [String]
  },
  budget: {
    estimated: { type: Number, default: 0 },
    actual: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'],
    default: 'SCHEDULED'
  },
  photos: [String],
  videos: [String],
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String,
    issues: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String]
}, {
  timestamps: true
});

rallySchema.index({ organizationId: 1, 'schedule.date': 1 });
rallySchema.index({ areaId: 1, status: 1 });

module.exports = mongoose.model('Rally', rallySchema);
