const workerService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createWorker = async (req, res) => {
  try {
    const worker = await workerService.createWorker(req.body, null);
    successResponse(res, worker, 'Worker created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const { page = 1, limit = 20, areaId, status } = req.query;
    
    const result = await workerService.getWorkers(
      { areaId, status, organizationId: null },
      page,
      limit
    );
    paginatedResponse(res, result.workers, page, limit, result.total, 'Workers fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await workerService.getWorkerById(req.params.id, null);
    successResponse(res, worker, 'Worker fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const worker = await workerService.updateWorker(req.params.id, req.body, null);
    successResponse(res, worker, 'Worker updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    await workerService.deleteWorker(req.params.id, null);
    successResponse(res, null, 'Worker deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const worker = await workerService.markAttendance(req.params.id, req.body, null);
    successResponse(res, worker, 'Attendance marked successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.addDailyReport = async (req, res) => {
  try {
    const worker = await workerService.addDailyReport(req.params.id, req.body, null);
    successResponse(res, worker, 'Daily report added successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
