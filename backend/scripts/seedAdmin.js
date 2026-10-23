require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    console.log('[Admin Setup] Connecting to database...');
    await connectDB();

    const adminName = process.env.ADMIN_NAME || 'Trendora Admin';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@trendora.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Trendora2026!';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`[Admin Setup] Updating existing administrator (${adminEmail})...`);
      admin.name = adminName;
      admin.role = 'admin';
      admin.password = adminPassword; // pre-save hook will hash it
      await admin.save();
      console.log(`[Admin Setup] Administrator "${adminName}" updated with admin role.`);
    } else {
      console.log(`[Admin Setup] Creating initial root administrator (${adminEmail})...`);
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+91 9876543210'
      });
      console.log(`[Admin Setup] Successfully created root administrator "${adminName}"!`);
    }

    console.log('==================================================');
    console.log('🔐 Initial Administrator Setup Complete');
    console.log(`👤 Name:     ${admin.name}`);
    console.log(`📧 Email:    ${admin.email}`);
    console.log(`🛡️  Role:     ${admin.role}`);
    console.log('==================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Admin Setup] Failed to seed administrator:', error.message);
    process.exit(1);
  }
};

seedAdmin();
