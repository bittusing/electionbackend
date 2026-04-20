const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Made optional
    trim: true
  },
  phone: {
    type: String,
    required: false, // Made optional
    match: [/^[0-9]{10}$/, 'Please provide valid 10 digit phone number']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email']
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
    required: false // Made optional
  },
  address: {
    street: String,
    landmark: String,
    pincode: String,
    // Election Commission style location fields
    state: String,
    district: String,
    block: String,
    gramPanchayat: String,
    ward: String
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  age: Number,
  dateOfBirth: Date,
  occupation: String,
  voterIdNumber: String,
  
  // Caste & Religion
  caste: {
    type: String,
    enum: ['GENERAL', 'OBC', 'SC', 'ST', 'OTHER']
  },
  subCaste: String,
  religion: {
    type: String,
    enum: ['HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER']
  },
  
  // Employment & Economic Status
  employmentType: {
    type: String,
    enum: ['GOVERNMENT', 'PRIVATE', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'HOMEMAKER', 'DAILY_WAGE', 'FARMER']
  },
  isGovernmentEmployee: {
    type: Boolean,
    default: false
  },
  governmentDepartment: String,
  monthlyIncome: {
    type: String,
    enum: ['BELOW_10K', '10K_25K', '25K_50K', '50K_1L', 'ABOVE_1L', 'NOT_DISCLOSED']
  },
  
  // Migration Status
  isMigrant: {
    type: Boolean,
    default: false
  },
  migrantType: {
    type: String,
    enum: ['SEASONAL', 'PERMANENT', 'TEMPORARY', 'NOT_APPLICABLE']
  },
  originalState: String,
  originalDistrict: String,
  migrationReason: {
    type: String,
    enum: ['EMPLOYMENT', 'EDUCATION', 'MARRIAGE', 'BUSINESS', 'OTHER']
  },
  
  // Family Details
  familyMembers: {
    total: { type: Number, default: 1 },
    voters: { type: Number, default: 1 },
    children: { type: Number, default: 0 }
  },
  headOfFamily: {
    type: Boolean,
    default: false
  },
  
  // Property & Assets
  hasOwnHouse: {
    type: Boolean,
    default: false
  },
  hasVehicle: {
    type: Boolean,
    default: false
  },
  vehicleType: {
    type: String,
    enum: ['TWO_WHEELER', 'FOUR_WHEELER', 'BOTH', 'NONE']
  },
  
  // Benefits & Schemes
  governmentSchemes: [{
    schemeName: String,
    beneficiaryId: String,
    status: { type: String, enum: ['ACTIVE', 'PENDING', 'REJECTED'] }
  }],
  hasRationCard: {
    type: Boolean,
    default: false
  },
  rationCardType: {
    type: String,
    enum: ['APL', 'BPL', 'AAY', 'NONE']
  },
  
  // Education
  education: {
    type: String,
    enum: ['ILLITERATE', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'GRADUATE', 'POST_GRADUATE', 'PROFESSIONAL']
  },
  
  // Social & Political
  isInfluencer: {
    type: Boolean,
    default: false
  },
  influenceLevel: {
    type: String,
    enum: ['NONE', 'LOCAL', 'AREA', 'DISTRICT']
  },
  socialGroups: [String],
  politicalAffiliation: String,
  consentStatus: {
    type: String,
    enum: ['GIVEN', 'NOT_GIVEN', 'WITHDRAWN'],
    default: 'NOT_GIVEN'
  },
  consentDate: Date,
  interestTags: [String],
  engagementLevel: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
    default: 'NONE'
  },
  supportLevel: {
    type: String,
    enum: ['STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  interactions: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['CALL', 'VISIT', 'EVENT', 'CAMPAIGN', 'SURVEY'] },
    notes: String,
    contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Problems/Issues faced by voter
  problems: [{
    category: {
      type: String,
      enum: ['HOUSING', 'WATER', 'ELECTRICITY', 'ROAD', 'DRAINAGE', 'SANITATION', 'HEALTH', 'EDUCATION', 'EMPLOYMENT', 'PENSION', 'RATION_CARD', 'GOVERNMENT_SCHEME', 'CUSTOM'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    customCategory: String, // Used when category is 'CUSTOM'
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'PENDING'
    },
    reportedDate: {
      type: Date,
      default: Date.now
    },
    resolvedDate: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    updates: [{
      date: { type: Date, default: Date.now },
      status: String,
      note: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  }],
  
  issues: [String], // Keeping for backward compatibility
  notes: String,
  additionalData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  lastInteractionDate: Date,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MOVED', 'DECEASED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

voterSchema.index({ organizationId: 1, areaId: 1 });
voterSchema.index({ phone: 1 });
voterSchema.index({ consentStatus: 1 });
voterSchema.index({ engagementLevel: 1 });
voterSchema.index({ caste: 1 });
voterSchema.index({ religion: 1 });
voterSchema.index({ isMigrant: 1 });
voterSchema.index({ isGovernmentEmployee: 1 });
voterSchema.index({ isInfluencer: 1 });
voterSchema.index({ rationCardType: 1 });
voterSchema.index({ employmentType: 1 });
voterSchema.index({ education: 1 });
voterSchema.index({ supportLevel: 1, areaId: 1 });

module.exports = mongoose.model('Voter', voterSchema);
