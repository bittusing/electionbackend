/**
 * Best-effort extraction from **text-based** PDFs (embedded text layer).
 * Scanned/image-only PDFs return no usable text — user must OCR or use Excel/CSV.
 */
const pdfParse = require('pdf-parse');

/** Tight EPIC: 3 letters + 7 alphanumerics as one token. */
const EPIC_RE_STRICT = /\b([A-Z]{3}[A-Z0-9]{7})\b/g;
/**
 * Loose EPIC: PDF text often splits tokens — e.g. "UPQ 1234567", "UPQ\n1234567",
 * or inserts thin spaces between characters.
 */
const EPIC_GAP = String.raw`[\s\u00AD\u200B-\u200D\uFEFF._-]{0,10}`;
const EPIC_RE_LOOSE = new RegExp(
  `(?<![A-Z0-9])([A-Z]{3})${EPIC_GAP}([A-Z0-9]{7})(?![A-Z0-9])`,
  'g'
);

/**
 * Uppercase **ASCII Latin + fullwidth Latin only** — same length as input.
 * Avoids `String#toUpperCase()` on the whole PDF, which can change some Devanagari sequences
 * and break नाम / आयु / लिंग regexes.
 */
function normalizeLatinForEpicSearch(raw) {
  let s = (raw || '').replace(/\r\n/g, '\n');
  s = s.replace(/[\uFF21-\uFF3A]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff21 + 65));
  s = s.replace(/[\uFF41-\uFF5A]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff41 + 65));
  s = s.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 48));
  s = s.replace(/[a-z]/g, (ch) => ch.toUpperCase());
  return s;
}

const DEV_DIGITS = '०१२३४५६७८९';

function devanagariDigitsToAscii(s) {
  return String(s || '').replace(/[०-९]/g, (d) => String(DEV_DIGITS.indexOf(d)));
}

function cleanHindiField(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/^[:\s：]+/, '')
    .replace(/\s*[:\s：]+$/, '')
    .trim();
}

/** After नाम / पिता value: next field or end (PDF order varies). */
const NAME_END =
  '(?=\\s*(?:पिता|पति|माता|मकान|आयु|लिंग|Photo|PHOTO|निर्वाचक|क्रम|संख्या|नामावली|Page|PAN\\b)|$)';
const REL_END =
  '(?=\\s*(?:मकान|आयु|लिंग|Photo|PHOTO|नाम|निर्वाचक|क्रम|संख्या|नामावली|Page|PAN\\b)|$)';
/** Label + optional punctuation (incl. danda / visarga). */
const NAME_LABEL = '(?:नाम|निर्वाचक\\s*का\\s*नाम|निर्वाचक_का_नाम)\\s*[.:：\u0903]?\\s*';

/**
 * Pull नाम / पिता-पति / मकान / आयु / लिंग from one voter block (order of text in PDF can be EPIC-first).
 * @param {string} chunk — mixed Devanagari + Latin (EPIC already uppercased)
 */
function mergeFieldParse(primary, secondary) {
  return {
    name: primary.name || secondary.name,
    relativeName: primary.relativeName || secondary.relativeName,
    houseNumber: primary.houseNumber || secondary.houseNumber,
    age: primary.age !== undefined ? primary.age : secondary.age,
    gender: primary.gender || secondary.gender,
  };
}

function parseFieldsFromRollChunk(chunk) {
  let name = '';
  const nameM = chunk.match(
    new RegExp(
      `${NAME_LABEL}([\\u0900-\\u097F][\\u0900-\\u097F\\s.\\-]{1,120}?)${NAME_END}`,
      'i'
    )
  );
  if (nameM) name = cleanHindiField(nameM[1]);

  let relativeName = '';
  const relM = chunk.match(
    new RegExp(
      `(?:पिता|पति|माता)(?:\\s*\\/\\s*पति)?(?:\\s*का\\s*नाम)?\\s*[:：]?\\s*([\\u0900-\\u097F][\\u0900-\\u097F\\s.\\-]{1,120}?)${REL_END}`,
      'i'
    )
  );
  if (relM) relativeName = cleanHindiField(relM[1]);

  let houseNumber = '';
  const houseM = chunk.match(
    /मकान(?:\s*संख्या|\s*नं\.?|\s*नंबर|\s*न०)?\s*[:：]?\s*([0-9\u0966-\u096F]{1,6}[A-Za-z\u0900-\u097F.\-]*)/
  );
  if (houseM) houseNumber = cleanHindiField(devanagariDigitsToAscii(houseM[1]));

  let age;
  const ageM = chunk.match(/आयु\s*[:：]?\s*([०-९0-9]{1,3})/);
  if (ageM) {
    const n = parseInt(devanagariDigitsToAscii(ageM[1]).replace(/[^\d]/g, ''), 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 120) age = n;
  }

  let gender;
  const lingM = chunk.match(/लिंग\s*[:：]?\s*(महिला|पुरुष|महिला\.?|पुरुष\.?)/);
  if (lingM) {
    gender = /महिला/.test(lingM[1]) ? 'FEMALE' : 'MALE';
  } else if (/लिंग\s*[:：]?\s*म\b/.test(chunk) || /(?<![\u0900-\u097F])महिला/.test(chunk)) {
    gender = 'FEMALE';
  } else if (/लिंग\s*[:：]?\s*पु|पुरुष/.test(chunk)) {
    gender = 'MALE';
  } else if (/(?<![A-Za-z0-9\u0900-\u097F])म(?![A-Za-z0-9\u0900-\u097F])/.test(chunk)) {
    gender = 'FEMALE';
  } else if (/(?<![A-Za-z0-9\u0900-\u097F])पु(?![A-Za-z0-9\u0900-\u097F])|पुरुष/.test(chunk)) {
    gender = 'MALE';
  }

  return { name, relativeName, houseNumber, age, gender };
}

/**
 * @param {string} textU uppercased, partially cleaned text
 * @returns {{ epic: string, index: number }[]}
 */
function collectEpicOccurrences(textU) {
  /** @type {Map<string, number>} epic -> smallest char index */
  const firstIndex = new Map();

  const consider = (epic, index) => {
    if (!/^[A-Z]{3}[A-Z0-9]{7}$/.test(epic)) return;
    const prev = firstIndex.get(epic);
    if (prev === undefined || index < prev) firstIndex.set(epic, index);
  };

  let m;
  EPIC_RE_STRICT.lastIndex = 0;
  while ((m = EPIC_RE_STRICT.exec(textU)) !== null) {
    consider(m[1], m.index);
  }

  EPIC_RE_LOOSE.lastIndex = 0;
  while ((m = EPIC_RE_LOOSE.exec(textU)) !== null) {
    consider(m[1] + m[2], m.index);
  }

  return [...firstIndex.entries()]
    .map(([epic, index]) => ({ epic, index }))
    .sort((a, b) => a.index - b.index);
}

/**
 * Drop whitespace only between two Latin alphanumerics (PDFs sometimes emit "U P Q 1 2 …").
 * Keeps a parallel map so match indices refer back to the original string for context slicing.
 * @returns {{ squashed: string, origCharIndex: number[] }}
 */
function squashInterAlnumWhitespace(textU) {
  const chunks = [];
  /** squashed[j] came from textU[origCharIndex[j]] */
  const origCharIndex = [];
  let i = 0;
  while (i < textU.length) {
    const ch = textU[i];
    if (/[A-Z0-9]/.test(ch)) {
      chunks.push(ch);
      origCharIndex.push(i);
      i += 1;
    } else if (/\s/.test(ch) && chunks.length > 0 && /[A-Z0-9]/.test(chunks[chunks.length - 1])) {
      let j = i;
      while (j < textU.length && /\s/.test(textU[j])) j += 1;
      if (j < textU.length && /[A-Z0-9]/.test(textU[j])) {
        i = j;
        continue;
      }
      chunks.push(ch);
      origCharIndex.push(i);
      i += 1;
    } else {
      chunks.push(ch);
      origCharIndex.push(i);
      i += 1;
    }
  }
  return { squashed: chunks.join(''), origCharIndex };
}

/**
 * @param {string} textU
 * @returns {{ epic: string, index: number }[]}
 */
function mergeEpicOccurrences(textU) {
  const best = new Map();

  const add = (occurrences) => {
    for (const { epic, index } of occurrences) {
      const prev = best.get(epic);
      if (prev === undefined || index < prev) best.set(epic, index);
    }
  };

  add(collectEpicOccurrences(textU));

  const { squashed, origCharIndex } = squashInterAlnumWhitespace(textU);
  const fromSquashed = collectEpicOccurrences(squashed).map(({ epic, index: k }) => ({
    epic,
    index: origCharIndex[k] ?? 0,
  }));
  add(fromSquashed);

  return [...best.entries()]
    .map(([epic, index]) => ({ epic, index }))
    .sort((a, b) => a.index - b.index);
}

function extractDevanagariPhrases(beforeEpic) {
  const re = /[\u0900-\u097F][\u0900-\u097F\s.\-]{1,120}/g;
  const out = [];
  let m;
  while ((m = re.exec(beforeEpic)) !== null) {
    const t = m[0].replace(/\s+/g, ' ').trim();
    if (t.length >= 2) out.push(t);
  }
  return out.filter(
    (t) =>
      t.length >= 2 &&
      !/निर्वाचक|मतदान|क्रम|लिंग|आयु|पंचायत|जिला|विकास|ग्राम|संख्या|पृष्ठ|नामावली/i.test(t) &&
      !/^पिता\s*का|^पति|^माता|^मकान/i.test(t.trim())
  );
}

function parseAgeGender(chunk) {
  let age;
  const ageM = chunk.match(/आयु\s*[:：]?\s*([०-९0-9]{1,3})/);
  if (ageM) {
    const n = parseInt(devanagariDigitsToAscii(ageM[1]).replace(/[^\d]/g, ''), 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 120) age = n;
  }
  let gender;
  if (/महिला|(?<![A-Za-z0-9])म(?![A-Za-z0-9])|लिंग[:\s]*म\b/.test(chunk)) {
    gender = 'FEMALE';
  } else if (/पुरुष|पु\.|(?<![A-Za-z0-9])पु(?![A-Za-z0-9])|लिंग[:\s]*पु/.test(chunk)) {
    gender = 'MALE';
  }
  return { age, gender };
}

function houseFromChunk(chunk) {
  const m = chunk.match(/मकान[^0-9A-Za-z]*([0-9]{1,6}[A-Za-z\u0900-\u097F]*)/);
  return m ? m[1].trim() : '';
}

/**
 * @param {Buffer} buffer
 * @returns {Promise<{ rows: Record<string, unknown>[], meta: Record<string, unknown> }>}
 */
async function extractVoterRowsFromPdfBuffer(buffer) {
  const data = await pdfParse(buffer);
  const textRaw = (data.text || '').replace(/\r\n/g, '\n');
  const numPages = data.numpages || 0;

  if (!textRaw || textRaw.trim().length < 80) {
    return {
      rows: [],
      meta: {
        pages: numPages,
        charCount: textRaw.length,
        error: 'NO_TEXT_LAYER',
        hint:
          'This PDF has almost no selectable text. It is likely a scanned image — use an OCR tool or SEC Excel export, then upload CSV/XLSX.',
      },
    };
  }

  const textU = normalizeLatinForEpicSearch(textRaw);
  const occurrences = mergeEpicOccurrences(textU);

  if (occurrences.length === 0) {
    const hasHindi = /[\u0900-\u097F]{20,}/.test(textRaw);
    const hasLatinChunks = /[A-Z]{3}[^A-Z0-9]{0,12}[A-Z0-9]{5,}/i.test(textRaw);
    return {
      rows: [],
      meta: {
        pages: numPages,
        charCount: textU.length,
        error: 'NO_EPIC_FOUND',
        hint: hasHindi
          ? hasLatinChunks
            ? 'Hindi + Latin text found but no EPIC-shaped code (3 letters + 7 alphanumerics). The roll may use another ID format, or EPIC is embedded as image — try CSV/XLSX or OCR.'
            : 'Hindi text was found but no EPIC pattern (3 letters + 7 codes). Column layout may differ — try CSV/XLSX.'
          : 'No EPIC-like codes found — PDF may be scan-only.',
      },
    };
  }

  const rows = [];
  const seenEpic = new Set();

  for (let i = 0; i < occurrences.length; i += 1) {
    const { epic, index: idx } = occurrences[i];
    if (seenEpic.has(epic)) continue;
    seenEpic.add(epic);

    const prevEnd = i > 0 ? occurrences[i - 1].index + occurrences[i - 1].epic.length : 0;
    const nextStart = i + 1 < occurrences.length ? occurrences[i + 1].index : textRaw.length;
    let regionStart = prevEnd;
    let regionEnd = nextStart;
    let voterRegion = textRaw.slice(regionStart, regionEnd);
    const maxRegion = 9000;
    if (voterRegion.length > maxRegion) {
      regionStart = Math.max(0, idx - Math.floor(maxRegion / 2));
      regionEnd = Math.min(textRaw.length, idx + epic.length + Math.floor(maxRegion / 2));
      voterRegion = textRaw.slice(regionStart, regionEnd);
    }

    const epicInRegion = idx - regionStart;
    const beforeEpic = voterRegion.slice(0, epicInRegion);
    const afterEpic = voterRegion.slice(epicInRegion + epic.length);

    let parsed = parseFieldsFromRollChunk(voterRegion);
    const centred = textRaw.slice(
      Math.max(0, idx - 3200),
      Math.min(textRaw.length, idx + epic.length + 3200)
    );
    parsed = mergeFieldParse(parsed, parseFieldsFromRollChunk(centred));

    let name = parsed.name;
    let relativeName = parsed.relativeName;
    let houseNumber = parsed.houseNumber || houseFromChunk(voterRegion) || houseFromChunk(centred);
    let age = parsed.age;
    let gender = parsed.gender;
    const legacy = parseAgeGender(voterRegion);
    if (age === undefined) age = parseAgeGender(centred).age ?? legacy.age;
    if (gender === undefined) gender = legacy.gender;

    if (!name || !relativeName) {
      const merged = `${beforeEpic} ${afterEpic}`.replace(/\s+/g, ' ');
      const meaningful = extractDevanagariPhrases(merged);
      if (!name) {
        if (meaningful.length >= 2) name = meaningful[meaningful.length - 2];
        else if (meaningful.length === 1) name = meaningful[0];
      }
      if (!relativeName && meaningful.length >= 2) {
        relativeName = meaningful[meaningful.length - 1];
      }
    }

    const serialMatch = beforeEpic.match(/(\d{1,4})\s*$/);
    const n = serialMatch ? parseInt(serialMatch[1], 10) : NaN;
    const rollSerialNumber = Number.isFinite(n) && n >= 0 && n < 100000 ? n : undefined;

    rows.push({
      name: name || undefined,
      relativeName: relativeName || undefined,
      houseNumber: houseNumber || undefined,
      voterIdNumber: epic,
      gender,
      age,
      rollSerialNumber,
    });
  }

  return {
    rows,
    meta: {
      pages: numPages,
      charCount: textU.length,
      extractedEpics: occurrences.length,
      uniqueRows: rows.length,
    },
  };
}

module.exports = { extractVoterRowsFromPdfBuffer };
