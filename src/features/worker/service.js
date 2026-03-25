const Worker = require('./model');

class WorkerService {
  async createWorker(workerData, organizationId) {
    if (organizationId) {
      workerData.organizationId = organizationId;
    }
    
    const worker = await Worker.create(workerData);
    return worker;
  }

  async getWorkers(filters, page, limit) {
    const query = {};
    
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;
    
    const [workers, total] = await Promise.all([
      Worker.find(query)
        .populate('userId', 'name email phone')
        .populate('areaId', 'name type')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Worker.countDocuments(query)
    ]);

    return { workers, total };
  }

  async getWorkerById(workerId, organizationId) {
    const query = { _id: workerId };
    if (organizationId) query.organizationId = organizationId;

    const worker = await Worker.findOne(query)
      .populate('userId', 'name email phone')
      .populate('areaId', 'name type');

    if (!worker) {
      throw new Error('Worker not found');
    }

    return worker;
  }

  async updateWorker(workerId, updateData, organizationId) {
    const query = { _id: workerId };
    if (organizationId) query.organizationId = organizationId;

    const worker = await Worker.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!worker) {
      throw new Error('Worker not found');
    }

    return worker;
  }

  async deleteWorker(workerId, organizationId) {
    const query = { _id: workerId };
    if (organizationId) query.organizationId = organizationId;

    const worker = await Worker.findOneAndDelete(query);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return worker;
  }

  async markAttendance(workerId, attendanceData, organizationId) {
    const query = { _id: workerId };
    if (organizationId) query.organizationId = organizationId;

    const worker = await Worker.findOne(query);
    if (!worker) {
      throw new Error('Worker not found');
    }

    worker.attendance.push({
      date: new Date(),
      ...attendanceData
    });

    await worker.save();
    return worker;
  }

  async addDailyReport(workerId, reportData, organizationId) {
    const query = { _id: workerId };
    if (organizationId) query.organizationId = organizationId;

    const worker = await Worker.findOne(query);
    if (!worker) {
      throw new Error('Worker not found');
    }

    worker.dailyReports.push({
      date: new Date(),
      ...reportData
    });

    // Update performance metrics
    if (reportData.votersContacted) {
      worker.performance.votersContacted += reportData.votersContacted;
    }

    await worker.save();
    return worker;
  }
}

module.exports = new WorkerService();
