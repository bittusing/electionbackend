const Task = require('./model');

class TaskService {
  async createTask(taskData, organizationId, userId) {
    if (organizationId) {
      taskData.organizationId = organizationId;
    }
    taskData.createdBy = userId;

    const task = await Task.create(taskData);
    return task;
  }

  async getTasks(filters, page, limit) {
    const query = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    if (filters.scopedAreaIds) {
      if (filters.areaId) {
        query.areaId = filters.scopedAreaIds.includes(filters.areaId) ? filters.areaId : null;
      } else {
        query.areaId = { $in: filters.scopedAreaIds };
      }
    } else if (filters.areaId) {
      query.areaId = filters.areaId;
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name phone')
        .populate('areaId', 'name type')
        .populate('createdBy', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ dueDate: 1, priority: -1 }),
      Task.countDocuments(query)
    ]);

    return { tasks, total };
  }

  async getTaskById(taskId, organizationId) {
    const query = { _id: taskId };
    if (organizationId) query.organizationId = organizationId;

    const task = await Task.findOne(query)
      .populate('assignedTo', 'name phone email')
      .populate('areaId', 'name type')
      .populate('createdBy', 'name');

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async updateTask(taskId, updateData, organizationId) {
    const query = { _id: taskId };
    if (organizationId) query.organizationId = organizationId;

    const task = await Task.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async completeTask(taskId, completionData, organizationId) {
    const query = { _id: taskId };
    if (organizationId) query.organizationId = organizationId;

    const task = await Task.findOne(query);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = 'COMPLETED';
    task.completionDate = new Date();
    task.completionProof = completionData;

    await task.save();
    return task;
  }

  async deleteTask(taskId, organizationId) {
    const query = { _id: taskId };
    if (organizationId) query.organizationId = organizationId;

    const task = await Task.findOneAndDelete(query);
    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async getMyTasks(userId, status, page, limit) {
    const query = { assignedTo: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('areaId', 'name type')
        .populate('createdBy', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ dueDate: 1, priority: -1 }),
      Task.countDocuments(query)
    ]);

    return { tasks, total };
  }
}

module.exports = new TaskService();
