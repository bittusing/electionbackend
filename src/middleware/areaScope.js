const Area = require('../features/area/model');

const ADMIN_ROLES = ['SUPER_ADMIN', 'STATE_ADMIN'];

/**
 * Resolves the full set of area IDs a user can access (including child areas).
 * Sets req.scopedAreaIds (array|null) and req.areaFilter (mongo query fragment).
 *
 * SUPER_ADMIN / STATE_ADMIN → null (no filter, see everything)
 * Others                     → assigned areas + all descendant areas
 */
exports.resolveAreaScope = async (req, res, next) => {
  try {
    if (!req.user) return next();

    if (ADMIN_ROLES.includes(req.user.role)) {
      req.scopedAreaIds = null;
      req.areaFilter = {};
      return next();
    }

    const assignedAreas = req.user.assignedAreas || [];

    if (assignedAreas.length === 0) {
      req.scopedAreaIds = [];
      req.areaFilter = { areaId: { $in: [] } };
      return next();
    }

    const assignedIds = assignedAreas.map(a =>
      typeof a === 'object' ? a._id.toString() : a.toString()
    );

    const childAreas = await Area.find({
      $or: assignedIds.map(id => ({
        'hierarchy.path': { $regex: id }
      }))
    }).select('_id').lean();

    const childIds = childAreas.map(a => a._id.toString());
    const allIds = [...new Set([...assignedIds, ...childIds])];

    req.scopedAreaIds = allIds;
    req.areaFilter = { areaId: { $in: allIds } };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error resolving area scope'
    });
  }
};
