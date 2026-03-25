const messagingCampaignService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createCampaign = async (req, res) => {
  try {
    const campaign = await messagingCampaignService.createCampaign(req.body, null, req.user.id);
    successResponse(res, campaign, 'Messaging campaign created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, messageType } = req.query;
    const result = await messagingCampaignService.getCampaigns(
      { status, messageType, organizationId: null },
      page,
      limit
    );
    paginatedResponse(res, result.campaigns, page, limit, result.total, 'Campaigns fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await messagingCampaignService.getCampaignById(req.params.id, null);
    successResponse(res, campaign, 'Campaign fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await messagingCampaignService.updateCampaign(req.params.id, req.body, null);
    successResponse(res, campaign, 'Campaign updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await messagingCampaignService.deleteCampaign(req.params.id, null);
    successResponse(res, null, 'Campaign deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getFilteredVoterCount = async (req, res) => {
  try {
    const count = await messagingCampaignService.getFilteredVoterCount(req.body.filters, null);
    successResponse(res, { count }, 'Voter count fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getFilteredVoters = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const voters = await messagingCampaignService.getFilteredVoters(req.body.filters, null, page, limit);
    successResponse(res, voters, 'Filtered voters fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await messagingCampaignService.sendCampaign(req.params.id, null);
    successResponse(res, campaign, 'Campaign sent successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getCampaignStats = async (req, res) => {
  try {
    const stats = await messagingCampaignService.getCampaignStats(req.params.id, null);
    successResponse(res, stats, 'Campaign stats fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
