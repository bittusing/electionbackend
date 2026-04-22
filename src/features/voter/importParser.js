const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');

/**
 * Panchayat / SEC UP style voter list → CRM voter row.
 * Supports English + Hindi-style headers (as in नामावली PDFs / Excel exports).
 */

function trimStr(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

/** First matching column value for any of the candidate header names. */
function cell(row, ...headerCandidates) {
  const entries = Object.entries(row);
  for (const want of headerCandidates) {
    const w = trimStr(want);
    if (!w) continue;
    const wLower = w.toLowerCase();
    for (const [k, val] of entries) {
      const kt = trimStr(k);
      if (!kt) continue;
      if (kt === w || kt.toLowerCase() === wLower) return val;
    }
  }
  for (const want of headerCandidates) {
    const w = trimStr(want);
    if (w.length < 2) continue;
    for (const [k, val] of entries) {
      const kt = trimStr(k);
      if (kt.includes(want)) return val;
    }
  }
  return '';
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = trimStr(v);
    if (s !== '') return s;
  }
  return '';
}

function parseAge(v) {
  const s = trimStr(v);
  if (!s) return undefined;
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  if (Number.isNaN(n) || n < 0 || n > 130) return undefined;
  return n;
}

function parseSerial(v) {
  const s = trimStr(v);
  if (!s) return undefined;
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  if (Number.isNaN(n)) return undefined;
  return n;
}

function normalizeGender(raw) {
  const dev = trimStr(raw);
  if (!dev) return undefined;
  if (dev === 'म' || dev === 'महिला') return 'FEMALE';
  if (dev === 'पु' || dev === 'पुरुष') return 'MALE';
  const t = dev.toLowerCase();
  if (['m', 'male', 'purush'].includes(t)) return 'MALE';
  if (['f', 'female', 'mahila'].includes(t)) return 'FEMALE';
  if (['other', 'o', 'अन्य'].includes(t)) return 'OTHER';
  return undefined;
}

function stripEmpty(obj) {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === '' || out[k] === undefined) delete out[k];
    if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      stripEmpty(out[k]);
      if (Object.keys(out[k]).length === 0) delete out[k];
    }
  });
  return out;
}

/**
 * @param {Record<string, unknown>} row - one sheet/CSV row
 * @param {string} [defaultAreaId] - Mongo areaId when row has none
 */
function mapImportRowToVoter(row, defaultAreaId) {
  const name = firstNonEmpty(
    cell(row, 'name', 'Name', 'नाम', 'निर्वाचक का नाम', 'निर्वाचक_का_नाम', 'Voter Name', 'voter_name')
  );
  const houseNumber = firstNonEmpty(
    cell(row, 'houseNumber', 'house_no', 'House No', 'मकान नं', 'मकान नं०', 'मकान', 'House Number')
  );
  const relativeName = firstNonEmpty(
    cell(
      row,
      'relativeName',
      'father',
      'father_name',
      'Father Name',
      'पिता का नाम',
      'पिता/पति/माता का नाम',
      'पिता',
      'पति',
      'माता'
    )
  );
  const voterIdNumber = firstNonEmpty(
    cell(
      row,
      'voterIdNumber',
      'VoterIdNumber',
      'EPIC',
      'epic',
      'SVN',
      'svn',
      'एसवीएन',
      'एस०वी०एन०',
      'SBN',
      'sbn'
    )
  );
  const gender = normalizeGender(
    cell(row, 'gender', 'Gender', 'लिंग', 'ling', 'Sex')
  );
  const age = parseAge(cell(row, 'age', 'Age', 'आयु', 'aayu'));
  const rollSerialNumber = parseSerial(
    cell(
      row,
      'rollSerialNumber',
      'serial',
      's_no',
      'sl_no',
      'S.No',
      'S No',
      'क्रम संख्या',
      'क्र०सं०',
      'क्र.सं.'
    )
  );

  const state = firstNonEmpty(cell(row, 'state', 'State', 'राज्य'));
  const district = firstNonEmpty(
    cell(row, 'district', 'District', 'जिला', 'जिला / District')
  );
  const block = firstNonEmpty(
    cell(row, 'block', 'Block', 'विकास खंड', 'विकास खण्ड', 'Development Block')
  );
  const gramPanchayat = firstNonEmpty(
    cell(row, 'gramPanchayat', 'gram_panchayat', 'Gram Panchayat', 'ग्राम पंचायत', 'GP')
  );
  const ward = firstNonEmpty(cell(row, 'ward', 'Ward', 'वार्ड', 'वार्ड संख्या', 'Ward Number'));
  const pollingCenter = firstNonEmpty(
    cell(row, 'pollingCenter', 'polling_center', 'मतदान केन्द्र', 'मतदान केंद्र', 'Polling Center')
  );
  const pollingSite = firstNonEmpty(
    cell(row, 'pollingSite', 'polling_site', 'मतदान स्थल', 'Polling Site')
  );

  const street = firstNonEmpty(
    cell(row, 'street', 'Street', 'पता', 'Address'),
    houseNumber ? `House ${houseNumber}` : ''
  );

  const areaId = firstNonEmpty(
    cell(row, 'areaId', 'AreaId', 'area_id'),
    defaultAreaId || ''
  );

  const voter = {
    name: name || undefined,
    houseNumber: houseNumber || undefined,
    relativeName: relativeName || undefined,
    rollSerialNumber,
    voterIdNumber: voterIdNumber || undefined,
    gender,
    age,
    areaId: areaId || undefined,
    phone: trimStr(cell(row, 'phone', 'Phone', 'मोबाइल')) || undefined,
    email: trimStr(cell(row, 'email', 'Email')) || undefined,
    occupation: trimStr(cell(row, 'occupation', 'Occupation')) || undefined,
    caste: trimStr(cell(row, 'caste', 'Caste')) || undefined,
    religion: trimStr(cell(row, 'religion', 'Religion')) || undefined,
    education: trimStr(cell(row, 'education', 'Education')) || undefined,
    supportLevel: trimStr(cell(row, 'supportLevel', 'SupportLevel')) || 'UNKNOWN',
    consentStatus: trimStr(cell(row, 'consentStatus', 'ConsentStatus')) || 'NOT_GIVEN',
    address: {
      street: street || undefined,
      landmark: firstNonEmpty(pollingSite, pollingCenter) || undefined,
      pincode: trimStr(cell(row, 'pincode', 'Pincode', 'PIN')) || undefined,
      state: state || undefined,
      district: district || undefined,
      block: block || undefined,
      gramPanchayat: gramPanchayat || undefined,
      ward: ward || undefined,
    },
  };

  return stripEmpty(voter);
}

function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseXlsxFile(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

/**
 * @param {string} filePath
 * @param {string} originalname
 */
async function parseVoterImportFile(filePath, originalname) {
  const lower = (originalname || '').toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseXlsxFile(filePath);
  }
  return parseCsvFile(filePath);
}

module.exports = {
  mapImportRowToVoter,
  parseVoterImportFile,
  normalizeGender,
};
