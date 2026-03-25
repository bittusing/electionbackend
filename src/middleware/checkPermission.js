const permissionService = require('../features/permission/service');

// Middleware to check specific permission
exports.checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;
      const permissions = await permissionService.getPermissionsByRole(userRole);
      
      const hasPermission = permissionService.checkPermission(permissions, module, action);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${action} ${module}`
        });
      }
      
      // Attach permissions to request for later use
      req.userPermissions = permissions;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Get user's all permissions
exports.getUserPermissions = async (req, res) => {
  try {
    const permissions = await permissionService.getPermissionsByRole(req.user.role);
    
    res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions'
    });
  }
};
