const jwt = require('jsonwebtoken');
const User = require('../features/auth/model');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .select('-password')
      .populate('assignedAreas', '_id name type hierarchy');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

exports.checkAreaAccess = async (req, res, next) => {
  try {
    const requestedAreaId = req.params.areaId || req.body.areaId;

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'STATE_ADMIN') {
      return next();
    }

    if (req.user.assignedAreas && req.user.assignedAreas.some(
      a => (typeof a === 'object' ? a._id.toString() : a.toString()) === requestedAreaId
    )) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have access to this area'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking area access'
    });
  }
};
