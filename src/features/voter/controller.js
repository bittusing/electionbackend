const voterService = require('./service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/responseHandler');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const { parseVoterImportFile, mapImportRowToVoter } = require('./importParser');
const { extractVoterRowsFromPdfBuffer } = require('./pdfImportParser');

const upload = multer({ dest: os.tmpdir() });
const pdfUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 35 * 1024 * 1024 },
});

exports.uploadMiddleware = upload.single('file');
exports.uploadPdfMiddleware = pdfUpload.single('file');

/**
 * @param {Record<string, unknown>[]} rawRows
 * @param {string} defaultAreaId
 * @param {number} rowLabelOffset 1-based display offset for error messages (CSV header → 2, PDF → 1)
 */
function prepareVotersForBulkImport(rawRows, defaultAreaId, rowLabelOffset) {
  const errors = [];
  const voters = [];

  rawRows.forEach((row, idx) => {
    try {
      const voter = mapImportRowToVoter(row, defaultAreaId);
      if (!voter.name && !voter.voterIdNumber) {
        errors.push({ row: idx + rowLabelOffset, message: 'Skip: need at least name or EPIC/SVN' });
        return;
      }
      if (!voter.areaId) {
        errors.push({
          row: idx + rowLabelOffset,
          message: 'Skip: set areaId column or choose default booth/village before upload',
        });
        return;
      }
      if (voter.phone && !/^[0-9]{10}$/.test(String(voter.phone))) {
        delete voter.phone;
      }
      if (voter.email === '') delete voter.email;
      voters.push(voter);
    } catch (e) {
      errors.push({ row: idx + rowLabelOffset, message: e.message });
    }
  });

  return { voters, errors };
}

async function commitBulkImport(voters, errors, req, res, extra = {}) {
  if (voters.length === 0) {
    return errorResponse(res, 'No importable rows (check areaId / default area and name or EPIC).', 400);
  }

  let toImport = voters;
  if (req.scopedAreaIds) {
    toImport = voters.filter((v) => v.areaId && req.scopedAreaIds.includes(String(v.areaId)));
    if (toImport.length === 0) {
      return errorResponse(
        res,
        'No rows match your assigned areas (areaId / default area must be within your scope)',
        400
      );
    }
  }

  const result = await voterService.bulkImport(toImport, null, req.user.id);
  successResponse(res, { ...result, errors, ...extra }, 'Voters imported successfully');
}

exports.createVoter = async (req, res) => {
  try {
    const voter = await voterService.createVoter(req.body, null, req.user.id, req.scopedAreaIds);
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
    const voter = await voterService.getVoterById(req.params.id, null, req.scopedAreaIds);
    successResponse(res, voter, 'Voter fetched successfully');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
};

exports.updateVoter = async (req, res) => {
  try {
    const body = voterService.filterUpdateForFieldTeam(req.user.role, req.body);
    const voter = await voterService.updateVoter(req.params.id, body, null, req.scopedAreaIds);
    successResponse(res, voter, 'Voter updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.deleteVoter = async (req, res) => {
  try {
    await voterService.deleteVoter(req.params.id, null, req.scopedAreaIds);
    successResponse(res, null, 'Voter deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.addInteraction = async (req, res) => {
  try {
    const voter = await voterService.addInteraction(
      req.params.id,
      req.body,
      req.user.id,
      null,
      req.scopedAreaIds
    );
    successResponse(res, voter, 'Interaction added successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

exports.bulkImport = async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const ext = (req.file.originalname || '').toLowerCase();
    if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      fs.unlinkSync(req.file.path);
      return errorResponse(res, 'Only .csv, .xls, or .xlsx files are supported', 400);
    }

    const defaultAreaId = (req.body?.defaultAreaId || req.body?.defaultareaid || '').toString().trim();

    const rawRows = await parseVoterImportFile(req.file.path, req.file.originalname);
    const { voters, errors } = prepareVotersForBulkImport(rawRows, defaultAreaId, 2);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return commitBulkImport(voters, errors, req, res);
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {
        /* ignore */
      }
    }
    errorResponse(res, error.message, 400);
  }
};

exports.bulkImportPdf = async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    const ext = (req.file.originalname || '').toLowerCase();
    if (!ext.endsWith('.pdf')) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return errorResponse(res, 'Only .pdf files for this endpoint', 400);
    }

    const defaultAreaId = (req.body?.defaultAreaId || req.body?.defaultareaid || '').toString().trim();
    const buffer = fs.readFileSync(req.file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const { rows: pdfRows, meta } = await extractVoterRowsFromPdfBuffer(buffer);
    if (meta.error) {
      return errorResponse(res, meta.hint || String(meta.error), 400);
    }

    const { voters, errors } = prepareVotersForBulkImport(pdfRows, defaultAreaId, 1);
    return commitBulkImport(voters, errors, req, res, {
      pdfMeta: meta,
      source: 'pdf',
    });
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {
        /* ignore */
      }
    }
    errorResponse(res, error.message || 'PDF import failed', 400);
  }
};
