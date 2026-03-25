const dailyReportService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createReport = async (req, res) => {
  try {
    const report = await dailyReportService.createReport(req.body, req.user.id, null);
    successResponse(res, report, 'Daily report created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, areaId, status, date, startDate, endDate } = req.query;
    const result = await dailyReportService.getReports(
      { userId, areaId, status, date, startDate, endDate, organizationId: null },
      page,
      limit
    );
    paginatedResponse(res, result.reports, page, limit, result.total, 'Reports fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await dailyReportService.getReportById(req.params.id, req.organizationId);
    successResponse(res, report, 'Report fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await dailyReportService.updateReport(req.params.id, req.body, req.user.id, req.organizationId);
    successResponse(res, report, 'Report updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.submitReport = async (req, res) => {
  try {
    const report = await dailyReportService.submitReport(req.params.id, req.user.id, req.organizationId);
    successResponse(res, report, 'Report submitted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.approveReport = async (req, res) => {
  try {
    const report = await dailyReportService.approveReport(req.params.id, req.user.id, req.organizationId);
    successResponse(res, report, 'Report approved successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.rejectReport = async (req, res) => {
  try {
    const { reason } = req.body;
    const report = await dailyReportService.rejectReport(req.params.id, reason, req.user.id, req.organizationId);
    successResponse(res, report, 'Report rejected');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const result = await dailyReportService.getMyReports(req.user.id, startDate, endDate, page, limit);
    paginatedResponse(res, result.reports, page, limit, result.total, 'My reports fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getReportSummary = async (req, res) => {
  try {
    const { areaId, userId, startDate, endDate } = req.query;
    const summary = await dailyReportService.getReportSummary(
      { areaId, userId, startDate, endDate },
      req.organizationId
    );
    successResponse(res, summary, 'Report summary fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
