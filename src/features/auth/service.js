const User = require('./model');
const Area = require('../area/model');

async function buildAreaBreadcrumb(areaDoc) {
  if (!areaDoc || !areaDoc._id) return '';
  const selfId = areaDoc._id.toString();
  const pathStr = areaDoc.hierarchy?.path || '';
  const ancestorIds = pathStr.split('/').filter(Boolean);
  const chainIds = [...ancestorIds, selfId];
  const areas = await Area.find({ _id: { $in: chainIds } }).select('name').lean();
  const nameById = Object.fromEntries(areas.map((a) => [a._id.toString(), a.name]));
  return chainIds.map((id) => nameById[id]).filter(Boolean).join(' → ');
}

class AuthService {
  async register(userData) {
    const user = await User.create(userData);
    const token = user.getSignedJwtToken();

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedAreas: user.assignedAreas
      }
    };
  }

  async login(credentials) {
    const { email, phone, password } = credentials;

    const query = email ? { email } : { phone };
    const user = await User.findOne(query)
      .select('+password')
      .populate('assignedAreas', '_id name type code hierarchy');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.getSignedJwtToken();

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        assignedAreas: user.assignedAreas
      }
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId)
      .populate('assignedAreas', '_id name type code hierarchy')
      .populate('organizationId', 'name');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Booth / ward / volunteer: which areas they are tied to + how API data is scoped.
   */
  async getWorkScopeForUser(user, scopedAreaIds) {
    const assigned = user.assignedAreas || [];
    const summaries = [];

    for (const a of assigned) {
      let doc = a;
      if (!doc || typeof doc !== 'object' || !doc.name) {
        const id = typeof a === 'object' ? a._id : a;
        doc = await Area.findById(id).select('_id name type code hierarchy').lean();
      }
      if (!doc) continue;
      const breadcrumb = await buildAreaBreadcrumb(doc);
      summaries.push({
        areaId: doc._id,
        name: doc.name,
        type: doc.type,
        code: doc.code || '',
        breadcrumb: breadcrumb || doc.name,
      });
    }

    const fullAccess = scopedAreaIds === null;
    const count = Array.isArray(scopedAreaIds) ? scopedAreaIds.length : 0;

    let message;
    if (fullAccess) {
      message = 'You have access to all areas and related voter / rally / task data.';
    } else if (count === 0) {
      message =
        'No areas are assigned to your login. Ask your district or block admin to assign a booth or village — until then lists will be empty.';
    } else {
      message = `All lists (voters, rallies, tasks, map, reports) show only data for ${count} area(s) under your assignment — including child booths/villages.`;
    }

    return {
      fullAccess,
      scopedAreaCount: fullAccess ? null : count,
      assignedRoots: summaries,
      message,
    };
  }

  async updateProfile(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async getAllUsers(scopedAreaIds) {
    const query = {};

    if (scopedAreaIds) {
      query.assignedAreas = { $elemMatch: { $in: scopedAreaIds } };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('assignedAreas', 'name type')
      .sort({ createdAt: -1 });

    return users;
  }
}

module.exports = new AuthService();
