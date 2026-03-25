const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return process.env.ENABLE_MULTI_TENANT === 'true';
    }
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: false
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  designation: {
    type: String,
    trim: true
  },
  attendance: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'HALF_DAY'], required: true },
    checkInTime: Date,
    checkOutTime: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  performance: {
    tasksCompleted: { type: Number, default: 0 },
    tasksAssigned: { type: Number, default: 0 },
    votersContacted: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 },
    score: { type: Number, default: 0, min: 0, max: 100 }
  },
  dailyReports: [{
    date: { type: Date, required: true },
    summary: String,
    activitiesCompleted: [String],
    votersContacted: Number,
    issuesReported: [String],
    photos: [String],
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

workerSchema.index({ organizationId: 1, areaId: 1 });
workerSchema.index({ userId: 1 });

module.exports = mongoose.model('Worker', workerSchema);
