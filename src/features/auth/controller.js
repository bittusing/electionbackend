const authService = require('./service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    errorResponse(res, error.message, 401);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    successResponse(res, user, 'Profile fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.getWorkScope = async (req, res) => {
  try {
    const payload = await authService.getWorkScopeForUser(req.user, req.scopedAreaIds);
    successResponse(res, payload, 'Work area scope');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    successResponse(res, result, 'Password changed successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers(req.scopedAreaIds);
    successResponse(res, users, 'Users fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
