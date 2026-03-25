const Campaign = require('./model');

class CampaignService {
  async createCampaign(campaignData, organizationId, userId) {
    if (organizationId) {
      campaignData.organizationId = organizationId;
    }
    campaignData.createdBy = userId;
    
    const campaign = await Campaign.create(campaignData);
    return campaign;
  }

  async getCampaigns(filters, page, limit) {
    const query = {};
    
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    const skip = (page - 1) * limit;
    
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('targetAreas', 'name type')
        .populate('createdBy', 'name')
        .populate('team.userId', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Campaign.countDocuments(query)
    ]);

    return { campaigns, total };
  }

  async getCampaignById(campaignId, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await Campaign.findOne(query)
      .populate('targetAreas', 'name type')
      .populate('createdBy', 'name email')
      .populate('team.userId', 'name email phone');

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(campaignId, updateData, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await Campaign.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  async deleteCampaign(campaignId, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await Campaign.findOneAndDelete(query);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  async addMilestone(campaignId, milestoneData, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await Campaign.findOne(query);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.milestones.push(milestoneData);
    await campaign.save();
    
    return campaign;
  }

  async updateMilestoneStatus(campaignId, milestoneId, status, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await Campaign.findOne(query);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    milestone.status = status;
    if (status === 'COMPLETED') {
      milestone.completedDate = new Date();
    }

    await campaign.save();
    return campaign;
  }

  async getActiveCampaigns(organizationId) {
    const query = { status: 'ACTIVE' };
    if (organizationId) query.organizationId = organizationId;

    const campaigns = await Campaign.find(query)
      .populate('targetAreas', 'name type')
      .sort({ startDate: -1 });

    return campaigns;
  }
}

module.exports = new CampaignService();
