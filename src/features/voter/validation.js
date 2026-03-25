const Joi = require('joi');

exports.createVoterValidation = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  email: Joi.string().email(),
  areaId: Joi.string().hex().length(24),
  address: Joi.object({
    street: Joi.string(),
    landmark: Joi.string(),
    pincode: Joi.string()
  }),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
  age: Joi.number().min(18).max(120),
  dateOfBirth: Joi.date(),
  occupation: Joi.string(),
  voterIdNumber: Joi.string(),
  
  // Caste & Religion
  caste: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER'),
  subCaste: Joi.string(),
  religion: Joi.string().valid('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER'),
  
  // Employment
  employmentType: Joi.string().valid('GOVERNMENT', 'PRIVATE', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'HOMEMAKER', 'DAILY_WAGE', 'FARMER'),
  isGovernmentEmployee: Joi.boolean(),
  governmentDepartment: Joi.string(),
  monthlyIncome: Joi.string().valid('BELOW_10K', '10K_25K', '25K_50K', '50K_1L', 'ABOVE_1L', 'NOT_DISCLOSED'),
  
  // Migration
  isMigrant: Joi.boolean(),
  migrantType: Joi.string().valid('SEASONAL', 'PERMANENT', 'TEMPORARY', 'NOT_APPLICABLE'),
  originalState: Joi.string(),
  originalDistrict: Joi.string(),
  migrationReason: Joi.string().valid('EMPLOYMENT', 'EDUCATION', 'MARRIAGE', 'BUSINESS', 'OTHER'),
  
  // Family
  familyMembers: Joi.object({
    total: Joi.number().min(1),
    voters: Joi.number().min(1),
    children: Joi.number().min(0)
  }),
  headOfFamily: Joi.boolean(),
  
  // Property
  hasOwnHouse: Joi.boolean(),
  hasVehicle: Joi.boolean(),
  vehicleType: Joi.string().valid('TWO_WHEELER', 'FOUR_WHEELER', 'BOTH', 'NONE'),
  
  // Benefits
  governmentSchemes: Joi.array().items(Joi.object({
    schemeName: Joi.string(),
    beneficiaryId: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'PENDING', 'REJECTED')
  })),
  hasRationCard: Joi.boolean(),
  rationCardType: Joi.string().valid('APL', 'BPL', 'AAY', 'NONE'),
  
  // Education
  education: Joi.string().valid('ILLITERATE', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'GRADUATE', 'POST_GRADUATE', 'PROFESSIONAL'),
  
  // Social & Political
  isInfluencer: Joi.boolean(),
  influenceLevel: Joi.string().valid('NONE', 'LOCAL', 'AREA', 'DISTRICT'),
  socialGroups: Joi.array().items(Joi.string()),
  politicalAffiliation: Joi.string(),
  consentStatus: Joi.string().valid('GIVEN', 'NOT_GIVEN', 'WITHDRAWN'),
  interestTags: Joi.array().items(Joi.string()),
  supportLevel: Joi.string().valid('STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'),
  notes: Joi.string()
});

exports.updateVoterValidation = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  email: Joi.string().email(),
  address: Joi.object({
    street: Joi.string(),
    landmark: Joi.string(),
    pincode: Joi.string()
  }),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
  age: Joi.number().min(18).max(120),
  dateOfBirth: Joi.date(),
  occupation: Joi.string(),
  
  // Caste & Religion
  caste: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER'),
  subCaste: Joi.string(),
  religion: Joi.string().valid('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER'),
  
  // Employment
  employmentType: Joi.string().valid('GOVERNMENT', 'PRIVATE', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'HOMEMAKER', 'DAILY_WAGE', 'FARMER'),
  isGovernmentEmployee: Joi.boolean(),
  governmentDepartment: Joi.string(),
  monthlyIncome: Joi.string().valid('BELOW_10K', '10K_25K', '25K_50K', '50K_1L', 'ABOVE_1L', 'NOT_DISCLOSED'),
  
  // Migration
  isMigrant: Joi.boolean(),
  migrantType: Joi.string().valid('SEASONAL', 'PERMANENT', 'TEMPORARY', 'NOT_APPLICABLE'),
  originalState: Joi.string(),
  originalDistrict: Joi.string(),
  migrationReason: Joi.string().valid('EMPLOYMENT', 'EDUCATION', 'MARRIAGE', 'BUSINESS', 'OTHER'),
  
  // Family
  familyMembers: Joi.object({
    total: Joi.number().min(1),
    voters: Joi.number().min(1),
    children: Joi.number().min(0)
  }),
  headOfFamily: Joi.boolean(),
  
  // Property
  hasOwnHouse: Joi.boolean(),
  hasVehicle: Joi.boolean(),
  vehicleType: Joi.string().valid('TWO_WHEELER', 'FOUR_WHEELER', 'BOTH', 'NONE'),
  
  // Benefits
  governmentSchemes: Joi.array().items(Joi.object({
    schemeName: Joi.string(),
    beneficiaryId: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'PENDING', 'REJECTED')
  })),
  hasRationCard: Joi.boolean(),
  rationCardType: Joi.string().valid('APL', 'BPL', 'AAY', 'NONE'),
  
  // Education
  education: Joi.string().valid('ILLITERATE', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'GRADUATE', 'POST_GRADUATE', 'PROFESSIONAL'),
  
  // Social & Political
  isInfluencer: Joi.boolean(),
  influenceLevel: Joi.string().valid('NONE', 'LOCAL', 'AREA', 'DISTRICT'),
  socialGroups: Joi.array().items(Joi.string()),
  politicalAffiliation: Joi.string(),
  consentStatus: Joi.string().valid('GIVEN', 'NOT_GIVEN', 'WITHDRAWN'),
  interestTags: Joi.array().items(Joi.string()),
  supportLevel: Joi.string().valid('STRONG_SUPPORTER', 'SUPPORTER', 'NEUTRAL', 'OPPONENT', 'UNKNOWN'),
  engagementLevel: Joi.string().valid('HIGH', 'MEDIUM', 'LOW', 'NONE'),
  notes: Joi.string(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MOVED', 'DECEASED')
});

exports.addInteractionValidation = Joi.object({
  type: Joi.string().valid('CALL', 'VISIT', 'EVENT', 'CAMPAIGN', 'SURVEY').required(),
  notes: Joi.string().required()
});
