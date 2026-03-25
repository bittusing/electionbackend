const DailyReport = require('./model');

class DailyReportService {
  async createReport(reportData, userId, organizationId) {
    reportData.userId = userId;
    if (organizationId) {
      reportData.organizationId = organizationId;
    }
    
    const report = await DailyReport.create(reportData);
    return report;
  }

  async getReports(filters, page, limit) {
    const query = {};
    
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.status) query.status = filters.status;
    
    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    } else if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      DailyReport.find(query)
        .populate('userId', 'name phone role')
        .populate('areaId', 'name type')
        .populate('approvedBy', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ date: -1 }),
      DailyReport.countDocuments(query)
    ]);

    return { reports, total };
  }

  async getReportById(reportId, organizationId) {
    const query = { _id: reportId };
    if (organizationId) query.organizationId = organizationId;

    const report = await DailyReport.findOne(query)
      .populate('userId', 'name phone email role')
      .populate('areaId', 'name type')
      .populate('approvedBy', 'name');

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  async updateReport(reportId, updateData, userId, organizationId) {
    const query = { _id: reportId, userId };
    if (organizationId) query.organizationId = organizationId;

    const report = await DailyReport.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!report) {
      throw new Error('Report not found or unauthorized');
    }

    return report;
  }

  async submitReport(reportId, userId, organizationId) {
    const query = { _id: reportId, userId };
    if (organizationId) query.organizationId = organizationId;

    const report = await DailyReport.findOneAndUpdate(
      query,
      { status: 'SUBMITTED' },
      { new: true }
    );

    if (!report) {
      throw new Error('Report not found or unauthorized');
    }

    return report;
  }

  async approveReport(reportId, approverId, organizationId) {
    const query = { _id: reportId };
    if (organizationId) query.organizationId = organizationId;

    const report = await DailyReport.findOneAndUpdate(
      query,
      {
        status: 'APPROVED',
        approvedBy: approverId,
        approvalDate: new Date()
      },
      { new: true }
    );

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  async rejectReport(reportId, reason, approverId, organizationId) {
    const query = { _id: reportId };
    if (organizationId) query.organizationId = organizationId;

    const report = await DailyReport.findOneAndUpdate(
      query,
      {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: approverId,
        approvalDate: new Date()
      },
      { new: true }
    );

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  async getMyReports(userId, startDate, endDate, page, limit) {
    const query = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      DailyReport.find(query)
        .populate('areaId', 'name type')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ date: -1 }),
      DailyReport.countDocuments(query)
    ]);

    return { reports, total };
  }

  async getReportSummary(filters, organizationId) {
    const query = {};
    
    if (organizationId) query.organizationId = organizationId;
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.userId) query.userId = filters.userId;
    
    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const summary = await DailyReport.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          totalTasksCompleted: { $sum: '$workSummary.tasksCompleted' },
          totalVotersContacted: { $sum: '$workSummary.votersContacted' },
          totalNewVoters: { $sum: '$workSummary.newVotersAdded' },
          totalHoursWorked: { $sum: '$workSummary.hoursWorked' },
          approvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] }
          }
        }
      }
    ]);

    return summary[0] || {
      totalReports: 0,
      totalTasksCompleted: 0,
      totalVotersContacted: 0,
      totalNewVoters: 0,
      totalHoursWorked: 0,
      approvedReports: 0,
      pendingReports: 0
    };
  }
}

module.exports = new DailyReportService();
