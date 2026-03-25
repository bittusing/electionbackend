const voterService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

exports.uploadMiddleware = upload.single('file');

exports.createVoter = async (req, res) => {
  try {
    const voter = await voterService.createVoter(req.body, null, req.user.id);
    successResponse(res, voter, 'Voter created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getVoters = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, areaId, gender, consentStatus,
      engagementLevel, supportLevel, caste, religion, isMigrant,
      isGovernmentEmployee, employmentType, education, rationCardType, isInfluencer
    } = req.query;

    const filters = {
      areaId, gender, consentStatus, engagementLevel, supportLevel,
      caste, religion, isMigrant, isGovernmentEmployee, employmentType,
      education, rationCardType, isInfluencer, organizationId: null
    };

    if (req.scopedAreaIds) {
      filters.scopedAreaIds = req.scopedAreaIds;
    }

    const result = await voterService.getVoters(filters, page, limit);
    paginatedResponse(res, result.voters, page, limit, result.total, 'Voters fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.getVoterById = async (req, res) => {
  try {
    const voter = await voterService.getVoterById(req.params.id, null);
    successResponse(res, voter, 'Voter fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateVoter = async (req, res) => {
  try {
    const voter = await voterService.updateVoter(req.params.id, req.body, null);
    successResponse(res, voter, 'Voter updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteVoter = async (req, res) => {
  try {
    await voterService.deleteVoter(req.params.id, null);
    successResponse(res, null, 'Voter deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.addInteraction = async (req, res) => {
  try {
    const voter = await voterService.addInteraction(req.params.id, req.body, req.user.id, null);
    successResponse(res, voter, 'Interaction added successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const voters = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const voter = {
            name: row.name || row.Name,
            phone: row.phone || row.Phone,
            email: row.email || row.Email,
            areaId: row.areaId || row.AreaId,
            gender: row.gender || row.Gender,
            age: row.age ? parseInt(row.age) : undefined,
            address: {
              street: row.street || row.Street,
              landmark: row.landmark || row.Landmark,
              pincode: row.pincode || row.Pincode
            },
            occupation: row.occupation || row.Occupation,
            voterIdNumber: row.voterIdNumber || row.VoterIdNumber,
            caste: row.caste || row.Caste,
            religion: row.religion || row.Religion,
            education: row.education || row.Education,
            supportLevel: row.supportLevel || row.SupportLevel || 'UNKNOWN',
            consentStatus: row.consentStatus || row.ConsentStatus || 'NOT_GIVEN'
          };

          Object.keys(voter).forEach(key => {
            if (voter[key] === undefined || voter[key] === '') {
              delete voter[key];
            }
          });

          voters.push(voter);
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          fs.unlinkSync(req.file.path);

          if (voters.length === 0) {
            return errorResponse(res, 'No valid voters found in CSV', 400);
          }

          const result = await voterService.bulkImport(voters, null, req.user.id);
          successResponse(res, { ...result, errors }, 'Voters imported successfully');
        } catch (error) {
          errorResponse(res, error.message, 400);
        }
      })
      .on('error', (error) => {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        errorResponse(res, error.message, 400);
      });
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
