const MessagingCampaign = require('./model');
const Voter = require('../voter/model');
const credentialService = require('../messagingSettings/credential.service');
const templateService = require('../messagingSettings/template.service');
const logger = require('../../config/logger');

class MessagingCampaignService {
  async createCampaign(campaignData, organizationId, userId) {
    if (organizationId) {
      campaignData.organizationId = organizationId;
    }
    campaignData.createdBy = userId;
    
    // Validate credentials are configured for message type
    await this.validateCredentials(campaignData.messageType);
    
    // Get voter count based on filters
    const voterCount = await this.getFilteredVoterCount(campaignData.filters, organizationId);
    campaignData.stats = {
      totalVoters: voterCount,
      messagesSent: 0,
      messagesDelivered: 0,
      messagesFailed: 0
    };
    
    const campaign = await MessagingCampaign.create(campaignData);
    return campaign;
  }

  async validateCredentials(messageType) {
    const types = messageType === 'BOTH' ? ['sms', 'whatsapp'] : [messageType.toLowerCase()];
    
    for (const type of types) {
      const credentials = await credentialService.getPrimaryCredentials(type);
      if (!credentials) {
        throw new Error(`No credentials configured for ${type.toUpperCase()}. Please configure in Settings.`);
      }
    }
  }

  async getCampaigns(filters, page, limit) {
    const query = {};
    
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.status) query.status = filters.status;
    if (filters.messageType) query.messageType = filters.messageType;

    const skip = (page - 1) * limit;
    
    const [campaigns, total] = await Promise.all([
      MessagingCampaign.find(query)
        .populate('createdBy', 'name email')
        .populate('filters.areaIds', 'name type')
        .select('-messageLogs') // Don't load logs in list view
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      MessagingCampaign.countDocuments(query)
    ]);

    return { campaigns, total };
  }

  async getCampaignById(campaignId, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await MessagingCampaign.findOne(query)
      .populate('createdBy', 'name email')
      .populate('filters.areaIds', 'name type');

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(campaignId, updateData, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    // Don't allow updating if campaign is in progress or completed
    const campaign = await MessagingCampaign.findOne(query);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (['IN_PROGRESS', 'COMPLETED'].includes(campaign.status)) {
      throw new Error('Cannot update campaign that is in progress or completed');
    }

    // Recalculate voter count if filters changed
    if (updateData.filters) {
      const voterCount = await this.getFilteredVoterCount(updateData.filters, organizationId);
      updateData['stats.totalVoters'] = voterCount;
    }

    const updatedCampaign = await MessagingCampaign.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedCampaign;
  }

  async deleteCampaign(campaignId, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await MessagingCampaign.findOneAndDelete(query);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  // Get filtered voter count
  async getFilteredVoterCount(filters, organizationId) {
    const query = this.buildVoterQuery(filters, organizationId);
    const count = await Voter.countDocuments(query);
    return count;
  }

  // Get filtered voters
  async getFilteredVoters(filters, organizationId, page = 1, limit = 100) {
    const query = this.buildVoterQuery(filters, organizationId);
    const skip = (page - 1) * limit;
    
    const voters = await Voter.find(query)
      .select('name phone email address gender age caste religion')
      .skip(skip)
      .limit(limit);
    
    return voters;
  }

  // Build voter query from filters
  buildVoterQuery(filters, organizationId) {
    const query = {};
    
    if (organizationId) query.organizationId = organizationId;
    
    // Location filters (from address or custom fields)
    if (filters.state) query['address.state'] = filters.state;
    if (filters.district) query['address.district'] = filters.district;
    if (filters.block) query['address.block'] = filters.block;
    if (filters.gramPanchayat) query['address.gramPanchayat'] = filters.gramPanchayat;
    if (filters.ward) query['address.ward'] = filters.ward;
    
    // Area based filter
    if (filters.areaIds && filters.areaIds.length > 0) {
      query.areaId = { $in: filters.areaIds };
    }
    
    // Demographic filters
    if (filters.gender) query.gender = filters.gender;
    if (filters.caste) query.caste = filters.caste;
    if (filters.religion) query.religion = filters.religion;
    if (filters.education) query.education = filters.education;
    if (filters.supportLevel) query.supportLevel = filters.supportLevel;
    
    // Age filter
    if (filters.ageMin || filters.ageMax) {
      query.age = {};
      if (filters.ageMin) query.age.$gte = filters.ageMin;
      if (filters.ageMax) query.age.$lte = filters.ageMax;
    }
    
    // Only active voters with phone numbers
    query.status = 'ACTIVE';
    query.phone = { $exists: true, $ne: '' };
    
    return query;
  }

  // Send campaign messages
  async sendCampaign(campaignId, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await MessagingCampaign.findOne(query).populate('templateId');
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'SCHEDULED' && campaign.status !== 'DRAFT') {
      throw new Error('Campaign must be in DRAFT or SCHEDULED status to send');
    }

    // Validate credentials
    await this.validateCredentials(campaign.messageType);

    // Update status
    campaign.status = 'IN_PROGRESS';
    campaign.startedAt = new Date();
    await campaign.save();

    // Get filtered voters
    const voters = await this.getFilteredVoters(campaign.filters, organizationId, 1, 10000);

    // Get message content
    let messageContent = campaign.messageTemplate;
    if (campaign.templateId) {
      // Use template
      const template = campaign.templateId;
      messageContent = template.content;
    }

    // Send messages (this will be implemented with actual SMS/WhatsApp APIs)
    const messageLogs = [];
    
    for (const voter of voters) {
      if (!voter.phone) continue;

      // Render message with voter data
      const renderedMessage = this.renderMessage(messageContent, voter);

      const log = {
        voterId: voter._id,
        voterName: voter.name,
        voterPhone: voter.phone,
        messageType: campaign.messageType === 'BOTH' ? 'SMS' : campaign.messageType,
        status: 'PENDING',
        sentAt: new Date()
      };

      // TODO: Integrate with actual messaging APIs using credentials
      // For now, just log
      logger.info(`Would send ${log.messageType} to ${voter.phone}: ${renderedMessage}`);

      messageLogs.push(log);
    }

    // Update campaign with logs
    campaign.messageLogs = messageLogs;
    campaign.stats.messagesSent = messageLogs.length;
    
    // In real implementation, this would be done after actual API calls
    campaign.status = 'COMPLETED';
    campaign.completedAt = new Date();
    
    await campaign.save();

    return campaign;
  }

  // Render message with voter data
  renderMessage(template, voter) {
    let message = template;
    
    // Replace variable placeholders
    const replacements = {
      voterName: voter.name || '',
      name: voter.name || '',
      firstName: voter.name?.split(' ')[0] || '',
      area: voter.address?.area || '',
      district: voter.address?.district || '',
      state: voter.address?.state || '',
      phoneNumber: voter.phone || '',
      voterId: voter.voterId || '',
      epicNumber: voter.voterId || '',
      age: voter.age || '',
      gender: voter.gender || ''
    };
    
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(regex, replacements[key]);
    });
    
    return message;
  }

  // Get campaign statistics
  async getCampaignStats(campaignId, organizationId) {
    const query = { _id: campaignId };
    if (organizationId) query.organizationId = organizationId;

    const campaign = await MessagingCampaign.findOne(query);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      totalVoters: campaign.stats.totalVoters,
      messagesSent: campaign.stats.messagesSent,
      messagesDelivered: campaign.stats.messagesDelivered,
      messagesFailed: campaign.stats.messagesFailed,
      deliveryRate: campaign.stats.messagesSent > 0 
        ? ((campaign.stats.messagesDelivered / campaign.stats.messagesSent) * 100).toFixed(2)
        : 0
    };
  }
}

module.exports = new MessagingCampaignService();
