const Area = require('./model');

class AreaService {
  async createArea(areaData, organizationId) {
    if (organizationId) {
      areaData.organizationId = organizationId;
    }

    const area = await Area.create(areaData);
    return area;
  }

  async getAreas(filters, page, limit) {
    const query = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.type) query.type = filters.type;
    if (filters.parentId) query.parentId = filters.parentId;
    if (filters.status) query.status = filters.status;

    if (filters.scopedAreaIds) {
      query._id = { $in: filters.scopedAreaIds };
    }

    const skip = (page - 1) * limit;

    const [areas, total] = await Promise.all([
      Area.find(query)
        .populate('parentId', 'name type')
        .populate('assignedManager', 'name phone')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ 'hierarchy.level': 1, name: 1 }),
      Area.countDocuments(query)
    ]);

    return { areas, total };
  }

  async assertAreaInScope(areaId, scopedAreaIds, organizationId) {
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;
    const exists = await Area.findOne(query).select('_id').lean();
    if (!exists) throw new Error('Area not found');
    if (!scopedAreaIds) return;
    if (!scopedAreaIds.includes(areaId.toString())) {
      throw new Error('Area not found');
    }
  }

  async getAreaById(areaId, organizationId, scopedAreaIds) {
    await this.assertAreaInScope(areaId, scopedAreaIds, organizationId);
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;

    const area = await Area.findOne(query)
      .populate('parentId', 'name type')
      .populate('assignedManager', 'name phone email');

    if (!area) {
      throw new Error('Area not found');
    }

    return area;
  }

  async patchFieldCampaign(areaId, body, organizationId, scopedAreaIds, userId) {
    await this.assertAreaInScope(areaId, scopedAreaIds, organizationId);
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;

    const area = await Area.findOneAndUpdate(
      query,
      {
        $set: {
          fieldCampaign: {
            signageStatus: body.signageStatus,
            signageNotes: body.signageNotes || '',
            updatedAt: new Date(),
            updatedBy: userId,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!area) throw new Error('Area not found');
    return area;
  }

  async updateArea(areaId, updateData, organizationId, scopedAreaIds) {
    await this.assertAreaInScope(areaId, scopedAreaIds, organizationId);
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;

    const area = await Area.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!area) {
      throw new Error('Area not found');
    }

    return area;
  }

  async deleteArea(areaId, organizationId) {
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;

    const hasChildren = await Area.findOne({ parentId: areaId });
    if (hasChildren) {
      throw new Error('Cannot delete area with child areas');
    }

    const area = await Area.findOneAndDelete(query);
    if (!area) {
      throw new Error('Area not found');
    }

    return area;
  }

  async getAreaHierarchy(areaId, organizationId, scopedAreaIds) {
    await this.assertAreaInScope(areaId, scopedAreaIds, organizationId);
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;

    const area = await Area.findOne(query);
    if (!area) {
      throw new Error('Area not found');
    }

    const children = await Area.find({
      'hierarchy.path': new RegExp(`${areaId}`)
    }).sort({ 'hierarchy.level': 1, name: 1 });

    return {
      area,
      children
    };
  }

  async getAreaStats(areaId, organizationId, scopedAreaIds) {
    await this.assertAreaInScope(areaId, scopedAreaIds, organizationId);
    const query = { _id: areaId };
    if (organizationId) query.organizationId = organizationId;

    const area = await Area.findOne(query);
    if (!area) {
      throw new Error('Area not found');
    }

    return area.stats;
  }
}

module.exports = new AreaService();
