const mongoose = require('mongoose');

const credentialVersionSchema = new mongoose.Schema({
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const messagingCredentialSchema = new mongoose.Schema({
  // Provider type: 'whatsapp', 'sms', 'email'
  type: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true
  },
  
  // Provider name: 'twilio', 'gupshup', 'msg91', 'aws-ses', etc.
  provider: {
    type: String,
    required: true
  },
  
  // Encrypted credentials (stored as encrypted JSON string)
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Status flags
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPrimary: {
    type: Boolean,
    default: false
  },
  
  // Priority order for fallback (lower number = higher priority)
  priority: {
    type: Number,
    default: 0
  },
  
  // Version history (keep last 5 versions)
  versionHistory: [credentialVersionSchema],
  
  // Usage tracking
  lastUsedAt: Date,
  lastTestedAt: Date,
  lastTestStatus: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  lastTestError: String,
  
  // Statistics
  stats: {
    messagesSentToday: { type: Number, default: 0 },
    messagesSentThisWeek: { type: Number, default: 0 },
    messagesSentThisMonth: { type: Number, default: 0 },
    lastResetDate: Date
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

// Indexes for efficient querying
messagingCredentialSchema.index({ type: 1, isActive: 1 });
messagingCredentialSchema.index({ type: 1, isPrimary: 1 });
messagingCredentialSchema.index({ type: 1, priority: 1 });

// Ensure only one primary provider per type
messagingCredentialSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary flag from other credentials of same type
    await this.constructor.updateMany(
      { 
        type: this.type, 
        _id: { $ne: this._id },
        isPrimary: true 
      },
      { $set: { isPrimary: false } }
    );
  }
  next();
});

module.exports = mongoose.model('MessagingCredential', messagingCredentialSchema);
