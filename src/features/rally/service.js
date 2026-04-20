const Rally = require('./model');
const Area = require('../area/model');
const Voter = require('../voter/model');

class RallyService {
  assertRallyAreaInScope(rallyDoc, scopedAreaIds) {
    if (!scopedAreaIds) return;
    const aid = rallyDoc.areaId?.toString();
    if (!aid) return;
    if (!scopedAreaIds.includes(aid)) {
      throw new Error('Rally not found');
    }
  }

  async assertRallyAccessibleById(rallyId, organizationId, scopedAreaIds) {
    const query = { _id: rallyId };
    if (organizationId) query.organizationId = organizationId;
    const rally = await Rally.findOne(query).select('areaId').lean();
    if (!rally) throw new Error('Rally not found');
    this.assertRallyAreaInScope(rally, scopedAreaIds);
  }

  async createRally(rallyData, organizationId, userId, scopedAreaIds) {
    if (scopedAreaIds && rallyData.areaId) {
      const aid = rallyData.areaId.toString();
      if (!scopedAreaIds.includes(aid)) {
        throw new Error('You can only schedule events in your assigned areas');
      }
    }
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

  async getRallyById(rallyId, organizationId, scopedAreaIds) {
    const query = { _id: rallyId };
    if (organizationId) query.organizationId = organizationId;

    const rally = await Rally.findOne(query)
      .populate('areaId', 'name type hierarchy')
      .populate('createdBy', 'name phone email')
      .populate('assignedWorkers.userId', 'name phone email');

    if (!rally) {
      throw new Error('Rally not found');
    }
    this.assertRallyAreaInScope(rally, scopedAreaIds);
    return rally;
  }

  /**
   * Voters linked to the rally’s area: exact area + all descendant areas (booths under a village, etc.).
   */
  async getRallyAudience(rallyId, organizationId, scopedAreaIds) {
    await this.assertRallyAccessibleById(rallyId, organizationId, scopedAreaIds);
    const rally = await Rally.findById(rallyId).select('title expectedAttendees areaId').lean();
    if (!rally.areaId) {
      return {
        rallyTitle: rally.title,
        expectedAttendees: rally.expectedAttendees,
        anchorAreaId: null,
        voterTotal: 0,
        votersWithPhone: 0,
        bySupportLevel: [],
        hint: 'Set “area” on this event (booth / village / ward) to list voters for meetings.',
      };
    }

    const anchor = rally.areaId.toString();
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const underAnchor = await Area.find({
      $or: [{ _id: rally.areaId }, { 'hierarchy.path': new RegExp(escaped) }],
    })
      .select('_id')
      .lean();

    let areaIds = underAnchor.map((a) => a._id);
    if (scopedAreaIds) {
      const allow = new Set(scopedAreaIds);
      areaIds = areaIds.filter((id) => allow.has(id.toString()));
    }

    const voterQuery = { areaId: { $in: areaIds } };
    if (organizationId) voterQuery.organizationId = organizationId;

    const [voterTotal, bySupportLevel, votersWithPhone] = await Promise.all([
      Voter.countDocuments(voterQuery),
      Voter.aggregate([{ $match: voterQuery }, { $group: { _id: '$supportLevel', count: { $sum: 1 } } }]),
      Voter.countDocuments({
        ...voterQuery,
        phone: { $exists: true, $nin: [null, ''] },
      }),
    ]);

    return {
      rallyTitle: rally.title,
      expectedAttendees: rally.expectedAttendees,
      anchorAreaId: anchor,
      areasMatched: areaIds.length,
      voterTotal,
      votersWithPhone,
      bySupportLevel,
    };
  }

  async updateRally(rallyId, updateData, organizationId, scopedAreaIds) {
    await this.assertRallyAccessibleById(rallyId, organizationId, scopedAreaIds);
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

  async deleteRally(rallyId, organizationId, scopedAreaIds) {
    await this.assertRallyAccessibleById(rallyId, organizationId, scopedAreaIds);
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

  async updateRallyStatus(rallyId, status, actualAttendees, feedback, organizationId, scopedAreaIds) {
    await this.assertRallyAccessibleById(rallyId, organizationId, scopedAreaIds);
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
