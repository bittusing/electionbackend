const Voter = require('./model');

/** Roles that may only patch a safe subset of voter fields (field / booth volunteers). */
const FIELD_TEAM_ROLES = new Set(['VOLUNTEER']);

class VoterService {
  /**
   * @param {string[]|null} scopedAreaIds from resolveAreaScope; null = full access
   */
  async assertVoterInScope(voterId, scopedAreaIds, organizationId) {
    const q = { _id: voterId };
    if (organizationId) q.organizationId = organizationId;
    const voter = await Voter.findOne(q).select('areaId').lean();
    if (!voter) throw new Error('Voter not found');
    if (!scopedAreaIds) return;
    const aid = voter.areaId?.toString();
    if (!aid || !scopedAreaIds.includes(aid)) {
      throw new Error('Voter not found');
    }
  }

  assertAreaIdInScopeForCreate(areaId, scopedAreaIds) {
    if (!scopedAreaIds) return;
    const id = areaId?.toString();
    if (!id) throw new Error('areaId is required for your account when adding voters');
    if (!scopedAreaIds.includes(id)) {
      throw new Error('You can only add voters within your assigned areas');
    }
  }

  filterUpdateForFieldTeam(role, updateData) {
    if (!FIELD_TEAM_ROLES.has(role)) return updateData;
    const allowed = [
      'phone',
      'email',
      'supportLevel',
      'engagementLevel',
      'consentStatus',
      'notes',
      'address',
      'houseNumber',
      'relativeName',
      'rollSerialNumber',
      'voterIdNumber',
      'gender',
      'age',
      'name',
    ];
    const out = {};
    allowed.forEach((k) => {
      if (updateData[k] !== undefined) out[k] = updateData[k];
    });
    return out;
  }

  async createVoter(voterData, organizationId, userId, scopedAreaIds) {
    this.assertAreaIdInScopeForCreate(voterData.areaId, scopedAreaIds);
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

  async getVoterById(voterId, organizationId, scopedAreaIds) {
    await this.assertVoterInScope(voterId, scopedAreaIds, organizationId);
    const query = { _id: voterId };
    if (organizationId) query.organizationId = organizationId;

    const voter = await Voter.findOne(query)
      .populate('areaId', 'name type hierarchy')
      .populate('addedBy', 'name phone')
      .populate('interactions.contactedBy', 'name');

    if (!voter) {
      throw new Error('Voter not found');
    }

    return voter;
  }

  async updateVoter(voterId, updateData, organizationId, scopedAreaIds) {
    await this.assertVoterInScope(voterId, scopedAreaIds, organizationId);
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

  async deleteVoter(voterId, organizationId, scopedAreaIds) {
    await this.assertVoterInScope(voterId, scopedAreaIds, organizationId);
    const query = { _id: voterId };
    if (organizationId) query.organizationId = organizationId;

    const voter = await Voter.findOneAndDelete(query);
    if (!voter) {
      throw new Error('Voter not found');
    }

    return voter;
  }

  async addInteraction(voterId, interactionData, userId, organizationId, scopedAreaIds) {
    await this.assertVoterInScope(voterId, scopedAreaIds, organizationId);
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
