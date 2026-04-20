const analyticsService = require('./service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.organizationId, req.scopedAreaIds);
    successResponse(res, stats, 'Dashboard stats fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAreaMapStats = async (req, res) => {
  try {
    const stats = await analyticsService.getAreaMapStats(req.organizationId, req.scopedAreaIds);
    successResponse(res, stats, 'Area map stats fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAreaPerformance = async (req, res) => {
  try {
    const performance = await analyticsService.getAreaPerformance(req.params.areaId, req.organizationId);
    successResponse(res, performance, 'Area performance fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getWorkerPerformance = async (req, res) => {
  try {
    const { areaId, startDate, endDate } = req.query;
    const performance = await analyticsService.getWorkerPerformance(
      areaId, startDate, endDate, req.organizationId
    );
    successResponse(res, performance, 'Worker performance fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getVoterEngagementStats = async (req, res) => {
  try {
    const { areaId } = req.query;
    const stats = await analyticsService.getVoterEngagementStats(areaId, req.organizationId);
    successResponse(res, stats, 'Voter engagement stats fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getTaskCompletionStats = async (req, res) => {
  try {
    const { areaId, startDate, endDate } = req.query;
    const stats = await analyticsService.getTaskCompletionStats(
      areaId, startDate, endDate, req.organizationId
    );
    successResponse(res, stats, 'Task completion stats fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getVoterDemographics = async (req, res) => {
  try {
    const { areaId } = req.query;
    const demographics = await analyticsService.getVoterDemographics(
      areaId,
      req.organizationId,
      req.scopedAreaIds
    );
    successResponse(res, demographics, 'Voter demographics fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
