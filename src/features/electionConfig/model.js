const mongoose = require('mongoose');

const electionConfigSchema = new mongoose.Schema({
  constituencyName: {
    type: String,
    required: [true, 'Constituency name is required'],
    trim: true
  },
  constituencyNumber: {
    type: String,
    trim: true
  },
  constituencyType: {
    type: String,
    enum: ['VIDHANSABHA', 'LOKSABHA', 'MUNICIPAL', 'PANCHAYAT', 'OTHER'],
    default: 'VIDHANSABHA'
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  candidateName: {
    type: String,
    trim: true
  },
  partyName: {
    type: String,
    trim: true
  },
  partySymbol: {
    type: String,
    trim: true
  },
  /** Optional Hindi / second line title on dashboard hero (e.g. मल्लावां-बिलग्राम). Falls back to constituencyName. */
  constituencyNameHi: {
    type: String,
    trim: true,
    default: '',
  },
  /** Full dashboard hero background — if set, covers gradient (still shows text overlay). Public https URL recommended. */
  dashboardBannerImageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  /** Candidate cutout / portrait (https URL). */
  candidatePhotoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  /** Party election symbol image (https URL). */
  partySymbolImageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  /** Hero gradient start (hex). Empty = use app primary orange. */
  bannerGradientFrom: {
    type: String,
    trim: true,
    default: '',
  },
  /** Hero gradient end (hex). */
  bannerGradientTo: {
    type: String,
    trim: true,
    default: '',
  },
  dashboardSloganLine1: {
    type: String,
    trim: true,
    default: '',
  },
  dashboardSloganLine2: {
    type: String,
    trim: true,
    default: '',
  },
  electionDate: {
    type: Date
  },
  totalRegisteredVoters: {
    type: Number,
    default: 0
  },
  totalBooths: {
    type: Number,
    default: 0
  },
  totalWards: {
    type: Number,
    default: 0
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'UPCOMING'],
    default: 'ACTIVE'
  },
  /** Editable rows for dashboard “past election / benchmark” bar chart (e.g. last Vidhan Sabha vote %). */
  pastElectionComparison: [{
    label: { type: String, trim: true, required: true },
    year: { type: String, trim: true, default: '' },
    value: { type: Number, required: true, min: 0, max: 100 },
    barColor: { type: String, trim: true, default: '' },
  }],
}, {
  timestamps: true
});

electionConfigSchema.index({ organizationId: 1 });

module.exports = mongoose.model('ElectionConfig', electionConfigSchema);
