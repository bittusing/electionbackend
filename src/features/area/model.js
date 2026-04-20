const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide area name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['STATE', 'DISTRICT', 'TEHSIL', 'BLOCK', 'VILLAGE', 'WARD', 'BOOTH'],
    required: [true, 'Please provide area type']
  },
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    default: null
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return process.env.ENABLE_MULTI_TENANT === 'true';
    }
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hierarchy: {
    level: {
      type: Number,
      default: 0
    },
    path: {
      type: String,
      default: ''
    }
  },
  stats: {
    totalMembers: { type: Number, default: 0 },
    activeWorkers: { type: Number, default: 0 },
    totalVoters: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 }
  },
  performanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  metadata: {
    population: Number,
    totalVoters: Number,
    maleVoters: Number,
    femaleVoters: Number,
    otherVoters: Number
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  /** Village / ward / booth field ops: posters, signage, visibility (updated by booth workers & volunteers). */
  fieldCampaign: {
    signageStatus: {
      type: String,
      enum: ['NONE', 'PARTIAL', 'COMPLETE'],
      default: 'NONE',
    },
    signageNotes: { type: String, trim: true, default: '' },
    updatedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

// Index for faster queries
areaSchema.index({ organizationId: 1, type: 1 });
areaSchema.index({ parentId: 1 });
areaSchema.index({ 'hierarchy.path': 1 });

// Update hierarchy before saving
areaSchema.pre('save', async function(next) {
  if (this.isModified('parentId') || this.isNew) {
    if (this.parentId) {
      const parent = await this.constructor.findById(this.parentId);
      if (parent) {
        this.hierarchy.level = parent.hierarchy.level + 1;
        this.hierarchy.path = parent.hierarchy.path ? `${parent.hierarchy.path}/${parent._id}` : `${parent._id}`;
      }
    } else {
      this.hierarchy.level = 0;
      this.hierarchy.path = '';
    }
  }
  next();
});

module.exports = mongoose.model('Area', areaSchema);
