const taskService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.organizationId, req.user.id);
    successResponse(res, task, 'Task created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, assignedTo, areaId } = req.query;
    const result = await taskService.getTasks(
      { status, priority, assignedTo, areaId, organizationId: req.organizationId, scopedAreaIds: req.scopedAreaIds },
      page,
      limit
    );
    paginatedResponse(res, result.tasks, page, limit, result.total, 'Tasks fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.organizationId);
    successResponse(res, task, 'Task fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.organizationId);
    successResponse(res, task, 'Task updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await taskService.completeTask(req.params.id, req.body, req.organizationId);
    successResponse(res, task, 'Task completed successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.organizationId);
    successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await taskService.getMyTasks(req.user.id, status, page, limit);
    paginatedResponse(res, result.tasks, page, limit, result.total, 'My tasks fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
