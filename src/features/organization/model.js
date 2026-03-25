const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide organization name'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['POLITICAL_PARTY', 'INDEPENDENT', 'NGO', 'OTHER'],
    default: 'POLITICAL_PARTY'
  },
  logo: String,
  contactEmail: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email']
  },
  contactPhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide valid 10 digit phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
      default: 'FREE'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  settings: {
    enableWhatsApp: { type: Boolean, default: false },
    enableSMS: { type: Boolean, default: false },
    enableEmail: { type: Boolean, default: false },
    maxUsers: { type: Number, default: 10 },
    maxAreas: { type: Number, default: 50 }
  },
  stats: {
    totalUsers: { type: Number, default: 0 },
    totalAreas: { type: Number, default: 0 },
    totalVoters: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'],
    default: 'TRIAL'
  }
}, {
  timestamps: true
});

// Generate slug before saving
organizationSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
