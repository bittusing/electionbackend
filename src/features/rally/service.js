const Rally = require('./model');

class RallyService {
  async createRally(rallyData, organizationId, userId) {
    if (organizationId) {
      rallyData.organizationId = organizationId;
    }
    rallyData.createdBy = userId;

    const rally = await Rally.create(rallyData);
    return rally;
  }

  async getRallies(filters, page, limit) {
    const query = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.status) query.status = filters.status;

    if (filters.startDate && filters.endDate) {
      query['schedule.date'] = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

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

    const [rallies, total] = await Promise.all([
      Rally.find(query)
        .populate('areaId', 'name type')
        .populate('createdBy', 'name phone')
        .populate('assignedWorkers.userId', 'name phone')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ 'schedule.date': 1 }),
      Rally.countDocuments(query)
    ]);

    return { rallies, total };
  }

  async getRallyById(rallyId, organizationId) {
    const query = { _id: rallyId };
    if (organizationId) query.organizationId = organizationId;

    const rally = await Rally.findOne(query)
      .populate('areaId', 'name type')
      .populate('createdBy', 'name phone email')
      .populate('assignedWorkers.userId', 'name phone email');

    if (!rally) {
      throw new Error('Rally not found');
    }

    return rally;
  }

  async updateRally(rallyId, updateData, organizationId) {
    const query = { _id: rallyId };
    if (organizationId) query.organizationId = organizationId;

    const rally = await Rally.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rally) {
      throw new Error('Rally not found');
    }

    return rally;
  }

  async deleteRally(rallyId, organizationId) {
    const query = { _id: rallyId };
    if (organizationId) query.organizationId = organizationId;

    const rally = await Rally.findOneAndDelete(query);
    if (!rally) {
      throw new Error('Rally not found');
    }

    return rally;
  }

  async getUpcomingRallies(days, organizationId, scopedAreaIds) {
    const query = {
      'schedule.date': {
        $gte: new Date(),
        $lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
    };

    if (organizationId) query.organizationId = organizationId;
    if (scopedAreaIds) query.areaId = { $in: scopedAreaIds };

    const rallies = await Rally.find(query)
      .populate('areaId', 'name type')
      .populate('assignedWorkers.userId', 'name phone')
      .sort({ 'schedule.date': 1 });

    return rallies;
  }

  async updateRallyStatus(rallyId, status, actualAttendees, feedback, organizationId) {
    const query = { _id: rallyId };
    if (organizationId) query.organizationId = organizationId;

    const updateData = { status };
    if (actualAttendees) updateData.actualAttendees = actualAttendees;
    if (feedback) updateData.feedback = feedback;

    const rally = await Rally.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );

    if (!rally) {
      throw new Error('Rally not found');
    }

    return rally;
  }
}

module.exports = new RallyService();
