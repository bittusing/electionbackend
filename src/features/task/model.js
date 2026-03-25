const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide task title'],
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: false
  },
  taskType: {
    type: String,
    enum: ['VOTER_CONTACT', 'SURVEY', 'EVENT', 'DOOR_TO_DOOR', 'PHONE_BANKING', 'DATA_ENTRY', 'OTHER'],
    default: 'OTHER'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  dueDate: Date,
  startDate: Date,
  completionDate: Date,
  completionProof: {
    photos: [String],
    notes: String,
    votersContacted: Number,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String]
}, {
  timestamps: true
});

taskSchema.index({ organizationId: 1, areaId: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
