const User = require('./model');

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
      .populate('assignedAreas', '_id name type');

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
      .populate('assignedAreas', 'name type')
      .populate('organizationId', 'name');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
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
