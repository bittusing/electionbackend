const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  // Template name (unique within message type)
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  
  // Message type: 'whatsapp', 'sms', 'email'
  type: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true
  },
  
  // Subject (for email only)
  subject: {
    type: String,
    trim: true
  },
  
  // Message content with variable placeholders
  content: {
    type: String,
    required: [true, 'Template content is required']
  },
  
  // Extracted variable placeholders from content
  variables: [{
    type: String
  }],
  
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },
  
  lastUsedAt: Date,
  
  // Active campaigns using this template
  activeCampaignCount: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique template names within message type
messageTemplateSchema.index({ name: 1, type: 1 }, { unique: true });
messageTemplateSchema.index({ type: 1 });
messageTemplateSchema.index({ createdBy: 1 });

// Validation: Email templates must have subject
messageTemplateSchema.pre('validate', function(next) {
  if (this.type === 'email' && !this.subject) {
    this.invalidate('subject', 'Subject is required for email templates');
  }
  next();
});

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
