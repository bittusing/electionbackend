const rallyService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createRally = async (req, res) => {
  try {
    const rally = await rallyService.createRally(req.body, null, req.user.id);
    successResponse(res, rally, 'Rally created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getRallies = async (req, res) => {
  try {
    const { page = 1, limit = 20, areaId, status, startDate, endDate } = req.query;
    const result = await rallyService.getRallies(
      { areaId, status, startDate, endDate, organizationId: req.organizationId, scopedAreaIds: req.scopedAreaIds },
      page,
      limit
    );
    paginatedResponse(res, result.rallies, page, limit, result.total, 'Rallies fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getRallyById = async (req, res) => {
  try {
    const rally = await rallyService.getRallyById(req.params.id, req.organizationId);
    successResponse(res, rally, 'Rally fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateRally = async (req, res) => {
  try {
    const rally = await rallyService.updateRally(req.params.id, req.body, req.organizationId);
    successResponse(res, rally, 'Rally updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteRally = async (req, res) => {
  try {
    await rallyService.deleteRally(req.params.id, req.organizationId);
    successResponse(res, null, 'Rally deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getUpcomingRallies = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const rallies = await rallyService.getUpcomingRallies(days, req.organizationId, req.scopedAreaIds);
    successResponse(res, rallies, 'Upcoming rallies fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.updateRallyStatus = async (req, res) => {
  try {
    const { status, actualAttendees, feedback } = req.body;
    const rally = await rallyService.updateRallyStatus(
      req.params.id, status, actualAttendees, feedback, req.organizationId
    );
    successResponse(res, rally, 'Rally status updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
