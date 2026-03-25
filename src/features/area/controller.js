const areaService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createArea = async (req, res) => {
  try {
    const area = await areaService.createArea(req.body, req.organizationId);
    successResponse(res, area, 'Area created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAreas = async (req, res) => {
  try {
    const { page = 1, limit = 100, type, parentId, status } = req.query;
    const result = await areaService.getAreas(
      { type, parentId, status, organizationId: req.organizationId, scopedAreaIds: req.scopedAreaIds },
      page,
      limit
    );
    paginatedResponse(res, result.areas, page, limit, result.total, 'Areas fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAreaById = async (req, res) => {
  try {
    const area = await areaService.getAreaById(req.params.id, req.organizationId);
    successResponse(res, area, 'Area fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateArea = async (req, res) => {
  try {
    const area = await areaService.updateArea(req.params.id, req.body, req.organizationId);
    successResponse(res, area, 'Area updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteArea = async (req, res) => {
  try {
    await areaService.deleteArea(req.params.id, req.organizationId);
    successResponse(res, null, 'Area deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAreaHierarchy = async (req, res) => {
  try {
    const hierarchy = await areaService.getAreaHierarchy(req.params.id, req.organizationId);
    successResponse(res, hierarchy, 'Area hierarchy fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getAreaStats = async (req, res) => {
  try {
    const stats = await areaService.getAreaStats(req.params.id, req.organizationId);
    successResponse(res, stats, 'Area stats fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
