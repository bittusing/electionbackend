require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/features/auth/model');
const Organization = require('../src/features/organization/model');
const Area = require('../src/features/area/model');
const logger = require('../src/config/logger');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Organization.deleteMany({});
    // await Area.deleteMany({});

    // Create Organization
    const org = await Organization.create({
      name: 'Demo Political Party',
      type: 'POLITICAL_PARTY',
      contactEmail: 'admin@demoparty.com',
      contactPhone: '9876543210',
      subscription: {
        plan: 'PREMIUM',
        isActive: true
      },
      status: 'ACTIVE'
    });
    logger.info(`Organization created: ${org.name}`);

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@demoparty.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'SUPER_ADMIN',
      organizationId: org._id,
      status: 'ACTIVE'
    });
    logger.info(`Super Admin created: ${superAdmin.email}`);

    // Create State
    const state = await Area.create({
      name: 'Uttar Pradesh',
      type: 'STATE',
      code: 'UP',
      organizationId: org._id,
      assignedManager: superAdmin._id,
      metadata: {
        population: 20000000,
        totalVoters: 15000000
      }
    });
    logger.info(`State created: ${state.name}`);

    // Create District
    const district = await Area.create({
      name: 'Lucknow',
      type: 'DISTRICT',
      code: 'LKO',
      parentId: state._id,
      organizationId: org._id,
      metadata: {
        population: 5000000,
        totalVoters: 3500000
      }
    });
    logger.info(`District created: ${district.name}`);

    // Create Block
    const block = await Area.create({
      name: 'Gomti Nagar',
      type: 'BLOCK',
      code: 'GN',
      parentId: district._id,
      organizationId: org._id,
      metadata: {
        population: 100000,
        totalVoters: 70000
      }
    });
    logger.info(`Block created: ${block.name}`);

    // Create Ward
    const ward = await Area.create({
      name: 'Ward 15',
      type: 'WARD',
      code: 'W15',
      parentId: block._id,
      organizationId: org._id,
      metadata: {
        population: 5000,
        totalVoters: 3500
      }
    });
    logger.info(`Ward created: ${ward.name}`);

    // Create Booth
    const booth = await Area.create({
      name: 'Booth 1',
      type: 'BOOTH',
      code: 'B1',
      parentId: ward._id,
      organizationId: org._id,
      metadata: {
        population: 1000,
        totalVoters: 700
      }
    });
    logger.info(`Booth created: ${booth.name}`);

    // Create District Admin
    const districtAdmin = await User.create({
      name: 'District Admin',
      email: 'district@demoparty.com',
      phone: '9876543211',
      password: 'admin123',
      role: 'DISTRICT_ADMIN',
      organizationId: org._id,
      assignedAreas: [district._id],
      status: 'ACTIVE'
    });
    logger.info(`District Admin created: ${districtAdmin.email}`);

    // Create Block Manager
    const blockManager = await User.create({
      name: 'Block Manager',
      email: 'block@demoparty.com',
      phone: '9876543212',
      password: 'admin123',
      role: 'BLOCK_MANAGER',
      organizationId: org._id,
      assignedAreas: [block._id],
      status: 'ACTIVE'
    });
    logger.info(`Block Manager created: ${blockManager.email}`);

    // Create Booth Worker
    const boothWorker = await User.create({
      name: 'Booth Worker',
      email: 'booth@demoparty.com',
      phone: '9876543213',
      password: 'admin123',
      role: 'BOOTH_WORKER',
      organizationId: org._id,
      assignedAreas: [booth._id],
      status: 'ACTIVE'
    });
    logger.info(`Booth Worker created: ${boothWorker.email}`);

    logger.info('\n✅ Seed data created successfully!');
    logger.info('\n📝 Login Credentials:');
    logger.info('Super Admin: admin@demoparty.com / admin123');
    logger.info('District Admin: district@demoparty.com / admin123');
    logger.info('Block Manager: block@demoparty.com / admin123');
    logger.info('Booth Worker: booth@demoparty.com / admin123');

    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
