const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_MANAGER', 'WARD_MANAGER', 'BOOTH_WORKER', 'VOLUNTEER'],
    required: true,
    unique: true
  },
  permissions: {
    // Dashboard Access
    dashboard: {
      view: { type: Boolean, default: true }
    },
    
    // Area Management
    areas: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    
    // Voter Management
    voters: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      bulkImport: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    
    // Worker Management
    workers: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      viewPerformance: { type: Boolean, default: false }
    },
    
    // Task Management
    tasks: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign: { type: Boolean, default: false },
      viewAll: { type: Boolean, default: false }
    },
    
    // Campaign Management
    campaigns: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      launch: { type: Boolean, default: false }
    },
    
    // Rally/Event Management
    rallies: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      schedule: { type: Boolean, default: false }
    },
    
    // Reports & Analytics
    reports: {
      view: { type: Boolean, default: false },
      viewAll: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      viewDemographics: { type: Boolean, default: false }
    },
    
    // User Management
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manageRoles: { type: Boolean, default: false }
    },
    
    // Organization Settings
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', permissionSchema);
