const ElectionConfig = require('./model');
const { successResponse, errorResponse } = require('../../utils/responseHandler');

exports.getConfig = async (req, res) => {
  try {
    const config = await ElectionConfig.findOne().sort({ createdAt: -1 });
    successResponse(res, config, 'Election config fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.createOrUpdateConfig = async (req, res) => {
  try {
    let config = await ElectionConfig.findOne().sort({ createdAt: -1 });

    if (config) {
      Object.assign(config, req.body);
      await config.save();
    } else {
      config = await ElectionConfig.create(req.body);
    }

    successResponse(res, config, 'Election config saved successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
