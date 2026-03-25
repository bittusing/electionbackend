const Voter = require('./model');

class VoterService {
  async createVoter(voterData, organizationId, userId) {
    if (organizationId) {
      voterData.organizationId = organizationId;
    }
    voterData.addedBy = userId;

    if (voterData.consentStatus === 'GIVEN') {
      voterData.consentDate = new Date();
    }

    const voter = await Voter.create(voterData);
    return voter;
  }

  async getVoters(filters, page, limit) {
    const query = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.gender) query.gender = filters.gender;
    if (filters.consentStatus) query.consentStatus = filters.consentStatus;
    if (filters.engagementLevel) query.engagementLevel = filters.engagementLevel;
    if (filters.supportLevel) query.supportLevel = filters.supportLevel;
    if (filters.caste) query.caste = filters.caste;
    if (filters.religion) query.religion = filters.religion;
    if (filters.isMigrant !== undefined) query.isMigrant = filters.isMigrant === 'true';
    if (filters.isGovernmentEmployee !== undefined) query.isGovernmentEmployee = filters.isGovernmentEmployee === 'true';
    if (filters.employmentType) query.employmentType = filters.employmentType;
    if (filters.education) query.education = filters.education;
    if (filters.rationCardType) query.rationCardType = filters.rationCardType;
    if (filters.isInfluencer !== undefined) query.isInfluencer = filters.isInfluencer === 'true';

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

    const [voters, total] = await Promise.all([
      Voter.find(query)
        .populate('areaId', 'name type')
        .populate('addedBy', 'name')
        .select('-interactions')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Voter.countDocuments(query)
    ]);

    return { voters, total };
  }

  async getVoterById(voterId, organizationId) {
    const query = { _id: voterId };
    if (organizationId) query.organizationId = organizationId;

    const voter = await Voter.findOne(query)
      .populate('areaId', 'name type')
      .populate('addedBy', 'name phone')
      .populate('interactions.contactedBy', 'name');

    if (!voter) {
      throw new Error('Voter not found');
    }

    return voter;
  }

  async updateVoter(voterId, updateData, organizationId) {
    const query = { _id: voterId };
    if (organizationId) query.organizationId = organizationId;

    if (updateData.consentStatus === 'GIVEN') {
      updateData.consentDate = new Date();
    }

    const voter = await Voter.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!voter) {
      throw new Error('Voter not found');
    }

    return voter;
  }

  async deleteVoter(voterId, organizationId) {
    const query = { _id: voterId };
    if (organizationId) query.organizationId = organizationId;

    const voter = await Voter.findOneAndDelete(query);
    if (!voter) {
      throw new Error('Voter not found');
    }

    return voter;
  }

  async addInteraction(voterId, interactionData, userId, organizationId) {
    const query = { _id: voterId };
    if (organizationId) query.organizationId = organizationId;

    const voter = await Voter.findOne(query);
    if (!voter) {
      throw new Error('Voter not found');
    }

    voter.interactions.push({
      ...interactionData,
      contactedBy: userId,
      date: new Date()
    });

    voter.lastInteractionDate = new Date();

    if (voter.interactions.length >= 5) {
      voter.engagementLevel = 'HIGH';
    } else if (voter.interactions.length >= 2) {
      voter.engagementLevel = 'MEDIUM';
    } else {
      voter.engagementLevel = 'LOW';
    }

    await voter.save();
    return voter;
  }

  async bulkImport(votersData, organizationId, userId) {
    const voters = votersData.map(voter => ({
      ...voter,
      organizationId,
      addedBy: userId
    }));

    const result = await Voter.insertMany(voters, { ordered: false });
    return {
      imported: result.length,
      total: votersData.length
    };
  }
}

module.exports = new VoterService();
