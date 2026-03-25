const User = require('../auth/model');
const Area = require('../area/model');
const Voter = require('../voter/model');
const Task = require('../task/model');
const Worker = require('../worker/model');

class AnalyticsService {
  _buildAreaQuery(baseQuery, scopedAreaIds, areaField = 'areaId') {
    const query = { ...baseQuery };
    if (scopedAreaIds) {
      query[areaField] = { $in: scopedAreaIds };
    }
    return query;
  }

  async getDashboardStats(organizationId, scopedAreaIds) {
    const orgQuery = organizationId ? { organizationId } : {};

    const voterQuery = scopedAreaIds ? { ...orgQuery, areaId: { $in: scopedAreaIds } } : orgQuery;
    const taskQuery = scopedAreaIds ? { ...orgQuery, areaId: { $in: scopedAreaIds } } : orgQuery;
    const areaQuery = scopedAreaIds ? { ...orgQuery, _id: { $in: scopedAreaIds } } : orgQuery;
    const workerQuery = scopedAreaIds ? { ...orgQuery, areaId: { $in: scopedAreaIds } } : orgQuery;

    const [
      totalUsers,
      totalAreas,
      totalVoters,
      totalTasks,
      completedTasks,
      pendingTasks,
      activeWorkers
    ] = await Promise.all([
      User.countDocuments(orgQuery),
      Area.countDocuments(areaQuery),
      Voter.countDocuments(voterQuery),
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'COMPLETED' }),
      Task.countDocuments({ ...taskQuery, status: 'PENDING' }),
      Worker.countDocuments({ ...workerQuery, status: 'ACTIVE' })
    ]);

    const votersByConsent = await Voter.aggregate([
      { $match: voterQuery },
      { $group: { _id: '$consentStatus', count: { $sum: 1 } } }
    ]);

    const votersByEngagement = await Voter.aggregate([
      { $match: voterQuery },
      { $group: { _id: '$engagementLevel', count: { $sum: 1 } } }
    ]);

    return {
      totalUsers,
      totalAreas,
      totalVoters,
      totalTasks,
      completedTasks,
      pendingTasks,
      activeWorkers,
      taskCompletionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
      votersByConsent,
      votersByEngagement
    };
  }

  async getAreaMapStats(organizationId, scopedAreaIds) {
    const baseQuery = organizationId ? { organizationId, status: 'ACTIVE' } : { status: 'ACTIVE' };

    if (scopedAreaIds) {
      baseQuery._id = { $in: scopedAreaIds };
    }

    const areas = await Area.find(baseQuery)
      .select('name type code parentId stats metadata coordinates hierarchy')
      .populate('parentId', 'name type')
      .populate('assignedManager', 'name phone')
      .lean();

    const areasWithVoterCounts = await Promise.all(
      areas.map(async (area) => {
        const voterCount = await Voter.countDocuments({
          ...(organizationId ? { organizationId } : {}),
          areaId: area._id
        });
        const workerCount = await User.countDocuments({
          assignedAreas: area._id,
          status: 'ACTIVE'
        });
        return {
          ...area,
          voterCount,
          workerCount,
          registeredVoters: area.metadata?.totalVoters || 0,
          maleVoters: area.metadata?.maleVoters || 0,
          femaleVoters: area.metadata?.femaleVoters || 0
        };
      })
    );

    return areasWithVoterCounts;
  }

  async getAreaPerformance(areaId, organizationId) {
    const query = { areaId };
    if (organizationId) query.organizationId = organizationId;

    const [
      totalWorkers,
      totalVoters,
      totalTasks,
      completedTasks,
      voterEngagement
    ] = await Promise.all([
      Worker.countDocuments(query),
      Voter.countDocuments(query),
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'COMPLETED' }),
      Voter.aggregate([
        { $match: query },
        { $group: { _id: '$engagementLevel', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalWorkers,
      totalVoters,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
      voterEngagement
    };
  }

  async getWorkerPerformance(areaId, startDate, endDate, organizationId) {
    const query = {};
    if (organizationId) query.organizationId = organizationId;
    if (areaId) query.areaId = areaId;

    const workers = await Worker.find(query)
      .populate('userId', 'name phone')
      .select('userId performance areaId');

    return workers.map(worker => ({
      workerId: worker._id,
      name: worker.userId?.name,
      phone: worker.userId?.phone,
      tasksCompleted: worker.performance.tasksCompleted,
      tasksAssigned: worker.performance.tasksAssigned,
      votersContacted: worker.performance.votersContacted,
      performanceScore: worker.performance.score
    }));
  }

  async getVoterEngagementStats(areaId, organizationId) {
    const query = {};
    if (organizationId) query.organizationId = organizationId;
    if (areaId) query.areaId = areaId;

    const [byEngagement, bySupport, byGender, withConsent] = await Promise.all([
      Voter.aggregate([{ $match: query }, { $group: { _id: '$engagementLevel', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$supportLevel', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$gender', count: { $sum: 1 } } }]),
      Voter.countDocuments({ ...query, consentStatus: 'GIVEN' })
    ]);

    return { byEngagement, bySupport, byGender, withConsent };
  }

  async getTaskCompletionStats(areaId, startDate, endDate, organizationId) {
    const query = {};
    if (organizationId) query.organizationId = organizationId;
    if (areaId) query.areaId = areaId;

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [byStatus, byPriority, overdueTasks] = await Promise.all([
      Task.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: query }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Task.countDocuments({
        ...query,
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { $lt: new Date() }
      })
    ]);

    return { byStatus, byPriority, overdueTasks };
  }

  async getVoterDemographics(areaId, organizationId) {
    const query = {};
    if (organizationId) query.organizationId = organizationId;
    if (areaId) query.areaId = areaId;

    const [
      byCaste, byReligion, byEducation, byEmployment, byIncome, byRationCard,
      migrantStats, governmentEmployees, influencers, propertyOwners, vehicleOwners
    ] = await Promise.all([
      Voter.aggregate([{ $match: query }, { $group: { _id: '$caste', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$religion', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$education', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$employmentType', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$monthlyIncome', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: query }, { $group: { _id: '$rationCardType', count: { $sum: 1 } } }]),
      Voter.aggregate([{ $match: { ...query, isMigrant: true } }, { $group: { _id: '$migrantType', count: { $sum: 1 } } }]),
      Voter.countDocuments({ ...query, isGovernmentEmployee: true }),
      Voter.countDocuments({ ...query, isInfluencer: true }),
      Voter.countDocuments({ ...query, hasOwnHouse: true }),
      Voter.aggregate([{ $match: { ...query, hasVehicle: true } }, { $group: { _id: '$vehicleType', count: { $sum: 1 } } }])
    ]);

    const totalVoters = await Voter.countDocuments(query);

    return {
      totalVoters, byCaste, byReligion, byEducation, byEmployment, byIncome, byRationCard,
      migrantStats: { total: migrantStats.reduce((s, i) => s + i.count, 0), byType: migrantStats },
      governmentEmployees, influencers, propertyOwners,
      vehicleOwners: { total: vehicleOwners.reduce((s, i) => s + i.count, 0), byType: vehicleOwners }
    };
  }
}

module.exports = new AnalyticsService();
