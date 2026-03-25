const mongoose = require('mongoose');

const messagingCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide campaign name'],
    trim: true
  },
  description: String,
  
  // Message Details
  messageType: {
    type: String,
    enum: ['SMS', 'WHATSAPP', 'BOTH'],
    required: true
  },
  messageTemplate: {
    type: String,
    required: function() {
      return !this.templateId; // Required if not using template
    }
  },
  
  // Template reference (optional - use template or messageTemplate)
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },
  
  // Voter Filters (Election Commission style)
  filters: {
    state: String,
    district: String,
    block: String,
    gramPanchayat: String,
    ward: String,
    
    // Additional filters
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    ageMin: Number,
    ageMax: Number,
    caste: { type: String, enum: ['GENERAL', 'OBC', 'SC', 'ST', 'OTHER'] },
    religion: { type: String, enum: ['HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER'] },
    education: String,
    supportLevel: { type: String, enum: ['STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'] },
    
    // Area based filter
    areaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Area' }]
  },
  
  // Campaign Status
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'DRAFT'
  },
  
  // Schedule
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Statistics
  stats: {
    totalVoters: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesDelivered: { type: Number, default: 0 },
    messagesFailed: { type: Number, default: 0 },
    smsSent: { type: Number, default: 0 },
    whatsappSent: { type: Number, default: 0 }
  },
  
  // Message Logs
  messageLogs: [{
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voter' },
    voterName: String,
    voterPhone: String,
    messageType: { type: String, enum: ['SMS', 'WHATSAPP'] },
    status: { type: String, enum: ['SENT', 'DELIVERED', 'FAILED', 'PENDING'] },
    sentAt: Date,
    deliveredAt: Date,
    failureReason: String,
    messageId: String // Provider message ID
  }],
  
  // API Configuration (will be set from settings)
  apiProvider: {
    sms: String, // 'twilio', 'msg91', 'textlocal', etc.
    whatsapp: String // 'twilio', 'gupshup', 'whatsapp-business', etc.
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return process.env.ENABLE_MULTI_TENANT === 'true';
    }
  }
}, {
  timestamps: true
});

messagingCampaignSchema.index({ status: 1, scheduledAt: 1 });
messagingCampaignSchema.index({ 'filters.state': 1, 'filters.district': 1 });
messagingCampaignSchema.index({ createdBy: 1 });

module.exports = mongoose.model('MessagingCampaign', messagingCampaignSchema);
