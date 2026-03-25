const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide campaign name'],
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
    enum: ['ELECTION', 'AWARENESS', 'VOTER_REGISTRATION', 'GET_OUT_THE_VOTE', 'FUNDRAISING', 'OTHER'],
    default: 'ELECTION'
  },
  electionType: {
    type: String,
    enum: ['GENERAL', 'STATE', 'LOCAL', 'BY_ELECTION'],
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  electionDate: Date,
  status: {
    type: String,
    enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED'],
    default: 'PLANNING'
  },
  targetAreas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  }],
  goals: {
    voterRegistration: { type: Number, default: 0 },
    voterContact: { type: Number, default: 0 },
    ralliesPlanned: { type: Number, default: 0 },
    volunteersNeeded: { type: Number, default: 0 }
  },
  progress: {
    votersRegistered: { type: Number, default: 0 },
    votersContacted: { type: Number, default: 0 },
    ralliesCompleted: { type: Number, default: 0 },
    volunteersRecruited: { type: Number, default: 0 }
  },
  budget: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  },
  team: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    responsibility: String
  }],
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
    completedDate: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

campaignSchema.index({ organizationId: 1, status: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
