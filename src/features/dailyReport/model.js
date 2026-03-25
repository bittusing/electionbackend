const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
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
    ref: 'Area'
  },
  
  // Work Summary
  workSummary: {
    tasksCompleted: { type: Number, default: 0 },
    tasksPending: { type: Number, default: 0 },
    votersContacted: { type: Number, default: 0 },
    newVotersAdded: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 },
    hoursWorked: { type: Number, default: 0 }
  },
  
  // Activities
  activities: [{
    type: { type: String, enum: ['DOOR_TO_DOOR', 'PHONE_CALL', 'MEETING', 'RALLY', 'SURVEY', 'DATA_ENTRY', 'OTHER'] },
    description: String,
    startTime: String,
    endTime: String,
    location: String,
    peopleContacted: Number
  }],
  
  // Issues & Challenges
  issues: [{
    type: String,
    description: String,
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    resolved: { type: Boolean, default: false }
  }],
  
  // Feedback from Ground
  groundFeedback: {
    publicSentiment: { type: String, enum: ['VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE'] },
    keyIssues: [String],
    suggestions: String,
    competitorActivity: String
  },
  
  // Attendance
  attendance: {
    checkInTime: String,
    checkOutTime: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    verified: { type: Boolean, default: false }
  },
  
  // Media
  photos: [String],
  videos: [String],
  
  // Notes
  notes: String,
  
  // Approval
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'DRAFT'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  rejectionReason: String
}, {
  timestamps: true
});

dailyReportSchema.index({ userId: 1, date: -1 });
dailyReportSchema.index({ organizationId: 1, date: -1 });
dailyReportSchema.index({ areaId: 1, date: -1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
