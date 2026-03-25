const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getUserPermissions } = require('../../middleware/checkPermission');
const permissionService = require('./service');

router.use(protect);

// Get current user's permissions
router.get('/my-permissions', getUserPermissions);

// Get permissions by role (Admin only)
router.get('/role/:role',
  authorize('SUPER_ADMIN'),
  async (req, res) => {
    try {
      const permissions = await permissionService.getPermissionsByRole(req.params.role);
      res.status(200).json({
        success: true,
        data: { role: req.params.role, permissions }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Update permissions for a role (Super Admin only)
router.put('/role/:role',
  authorize('SUPER_ADMIN'),
  async (req, res) => {
    try {
      const permission = await permissionService.updatePermissions(req.params.role, req.body.permissions);
      res.status(200).json({
        success: true,
        message: 'Permissions updated successfully',
        data: permission
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Initialize default permissions (Super Admin only)
router.post('/initialize',
  authorize('SUPER_ADMIN'),
  async (req, res) => {
    try {
      await permissionService.initializePermissions();
      res.status(200).json({
        success: true,
        message: 'Permissions initialized successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
