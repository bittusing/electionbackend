const campaignService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');

exports.createCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.createCampaign(req.body, null, req.user.id);
    successResponse(res, campaign, 'Campaign created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const result = await campaignService.getCampaigns(
      { status, type, organizationId: null },
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
    const campaign = await campaignService.getCampaignById(req.params.id, null);
    successResponse(res, campaign, 'Campaign fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.updateCampaign(req.params.id, req.body, null);
    successResponse(res, campaign, 'Campaign updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await campaignService.deleteCampaign(req.params.id, null);
    successResponse(res, null, 'Campaign deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.addMilestone = async (req, res) => {
  try {
    const campaign = await campaignService.addMilestone(req.params.id, req.body, null);
    successResponse(res, campaign, 'Milestone added successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.updateMilestoneStatus = async (req, res) => {
  try {
    const { milestoneId, status } = req.body;
    const campaign = await campaignService.updateMilestoneStatus(req.params.id, milestoneId, status, null);
    successResponse(res, campaign, 'Milestone status updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await campaignService.getActiveCampaigns(null);
    successResponse(res, campaigns, 'Active campaigns fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
