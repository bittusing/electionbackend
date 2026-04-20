const Permission = require('./model');

// Default permissions for each role
const defaultPermissions = {
  SUPER_ADMIN: {
    dashboard: { view: true },
    areas: { view: true, create: true, edit: true, delete: true },
    voters: { view: true, create: true, edit: true, delete: true, bulkImport: true, export: true },
    workers: { view: true, create: true, edit: true, delete: true, viewPerformance: true },
    tasks: { view: true, create: true, edit: true, delete: true, assign: true, viewAll: true },
    campaigns: { view: true, create: true, edit: true, delete: true, launch: true },
    rallies: { view: true, create: true, edit: true, delete: true, schedule: true },
    reports: { view: true, viewAll: true, export: true, viewDemographics: true },
    users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
    settings: { view: true, edit: true }
  },
  
  STATE_ADMIN: {
    dashboard: { view: true },
    areas: { view: true, create: true, edit: true, delete: false },
    voters: { view: true, create: true, edit: true, delete: false, bulkImport: true, export: true },
    workers: { view: true, create: true, edit: true, delete: false, viewPerformance: true },
    tasks: { view: true, create: true, edit: true, delete: true, assign: true, viewAll: true },
    campaigns: { view: true, create: true, edit: true, delete: false, launch: true },
    rallies: { view: true, create: true, edit: true, delete: false, schedule: true },
    reports: { view: true, viewAll: true, export: true, viewDemographics: true },
    users: { view: true, create: true, edit: true, delete: false, manageRoles: false },
    settings: { view: true, edit: false }
  },
  
  DISTRICT_ADMIN: {
    dashboard: { view: true },
    areas: { view: true, create: true, edit: true, delete: false },
    voters: { view: true, create: true, edit: true, delete: false, bulkImport: true, export: true },
    workers: { view: true, create: true, edit: true, delete: false, viewPerformance: true },
    tasks: { view: true, create: true, edit: true, delete: true, assign: true, viewAll: true },
    campaigns: { view: true, create: true, edit: true, delete: false, launch: false },
    rallies: { view: true, create: true, edit: true, delete: false, schedule: true },
    reports: { view: true, viewAll: true, export: true, viewDemographics: true },
    users: { view: true, create: true, edit: true, delete: false, manageRoles: false },
    settings: { view: false, edit: false }
  },
  
  BLOCK_MANAGER: {
    dashboard: { view: true },
    areas: { view: true, create: false, edit: true, delete: false },
    voters: { view: true, create: true, edit: true, delete: false, bulkImport: true, export: false },
    workers: { view: true, create: true, edit: true, delete: false, viewPerformance: true },
    tasks: { view: true, create: true, edit: true, delete: false, assign: true, viewAll: true },
    campaigns: { view: true, create: false, edit: false, delete: false, launch: false },
    rallies: { view: true, create: true, edit: true, delete: false, schedule: false },
    reports: { view: true, viewAll: false, export: false, viewDemographics: false },
    users: { view: true, create: true, edit: false, delete: false, manageRoles: false },
    settings: { view: false, edit: false }
  },
  
  WARD_MANAGER: {
    dashboard: { view: true },
    areas: { view: true, create: false, edit: false, delete: false },
    voters: { view: true, create: true, edit: true, delete: false, bulkImport: false, export: false },
    workers: { view: true, create: false, edit: false, delete: false, viewPerformance: true },
    tasks: { view: true, create: true, edit: true, delete: false, assign: true, viewAll: false },
    campaigns: { view: true, create: false, edit: false, delete: false, launch: false },
    rallies: { view: true, create: false, edit: false, delete: false, schedule: false },
    reports: { view: true, viewAll: false, export: false, viewDemographics: false },
    users: { view: true, create: false, edit: false, delete: false, manageRoles: false },
    settings: { view: false, edit: false }
  },
  
  BOOTH_WORKER: {
    dashboard: { view: true },
    areas: { view: true, create: false, edit: false, delete: false },
    voters: { view: true, create: true, edit: true, delete: false, bulkImport: false, export: false },
    workers: { view: false, create: false, edit: false, delete: false, viewPerformance: false },
    tasks: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
    campaigns: { view: true, create: false, edit: false, delete: false, launch: false },
    rallies: { view: true, create: false, edit: false, delete: false, schedule: false },
    reports: { view: true, viewAll: false, export: false, viewDemographics: false },
    users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
    settings: { view: false, edit: false }
  },
  
  VOLUNTEER: {
    dashboard: { view: true },
    areas: { view: true, create: false, edit: false, delete: false },
    /** Field volunteers: update phone / support / notes in assigned areas only (controller restricts fields). */
    voters: { view: true, create: true, edit: true, delete: false, bulkImport: false, export: false },
    workers: { view: false, create: false, edit: false, delete: false, viewPerformance: false },
    tasks: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
    /** Read messaging stats / lists in assigned areas; sending stays edit-only for managers. */
    campaigns: { view: true, create: false, edit: false, delete: false, launch: false },
    rallies: { view: true, create: false, edit: false, delete: false, schedule: false },
    reports: { view: true, viewAll: false, export: false, viewDemographics: true },
    users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
    settings: { view: false, edit: false }
  }
};

/**
 * If any write-style permission is on, the matching `view` must be true so users can
 * list and predict data (fixes legacy DB rows with create/edit but view: false).
 */
function coercePermissionCoherence(permissions) {
  if (!permissions || typeof permissions !== 'object') return permissions;
  const p = JSON.parse(JSON.stringify(permissions));
  const pairs = [
    ['voters', ['create', 'edit', 'delete', 'bulkImport', 'export']],
    ['rallies', ['create', 'edit', 'delete', 'schedule']],
    ['tasks', ['create', 'edit', 'delete', 'assign']],
    ['campaigns', ['create', 'edit', 'delete', 'launch']],
    ['areas', ['create', 'edit', 'delete']],
    ['workers', ['create', 'edit', 'delete', 'viewPerformance']],
    ['users', ['create', 'edit', 'delete', 'manageRoles']],
  ];
  for (const [mod, keys] of pairs) {
    if (!p[mod] || typeof p[mod] !== 'object') continue;
    const anyWrite = keys.some((k) => p[mod][k] === true);
    if (anyWrite) p[mod].view = true;
  }
  return p;
}

class PermissionService {
  async initializePermissions() {
    for (const [role, permissions] of Object.entries(defaultPermissions)) {
      await Permission.findOneAndUpdate(
        { role },
        { role, permissions },
        { upsert: true, new: true }
      );
    }
  }

  async getPermissionsByRole(role) {
    let permission = await Permission.findOne({ role });
    
    if (!permission) {
      // Create default permission if not exists
      permission = await Permission.create({
        role,
        permissions: defaultPermissions[role] || defaultPermissions.VOLUNTEER
      });
    }

    return coercePermissionCoherence(permission.permissions);
  }

  async updatePermissions(role, permissions) {
    const permission = await Permission.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    );
    
    return permission;
  }

  checkPermission(userPermissions, module, action) {
    return userPermissions[module] && userPermissions[module][action] === true;
  }
}

module.exports = new PermissionService();
