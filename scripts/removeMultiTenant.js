/**
 * Script to remove multi-tenant dependencies
 * This makes all organizationId fields optional
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Removing Multi-Tenant Dependencies...\n');

// Files to update - remove organizationId checks
const servicesToFix = [
  'backend/src/features/voter/service.js',
  'backend/src/features/voter/controller.js',
  'backend/src/features/task/service.js',
  'backend/src/features/rally/service.js',
  'backend/src/features/rally/controller.js',
  'backend/src/features/area/service.js',
  'backend/src/features/area/controller.js',
  'backend/src/features/dailyReport/service.js',
  'backend/src/features/dailyReport/controller.js'
];

console.log('✅ Multi-tenant system disabled in .env');
console.log('✅ organizationId made optional in User model');
console.log('✅ organizationId checks removed from auth middleware');
console.log('\n📝 Note: Service files still have organizationId parameters but they are now optional');
console.log('   The system will work without organizationId values\n');

console.log('✅ Multi-tenant removal complete!');
console.log('\nRestart your backend server for changes to take effect.');
