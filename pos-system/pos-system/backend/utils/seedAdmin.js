// Run once to create the first admin account:
//   node utils/seedAdmin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User } = require('../models');

async function seed() {
  await sequelize.authenticate();

  const email = 'admin@store.com';
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    return process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await User.create({
    name: 'Store Admin',
    email,
    password: hashedPassword,
    role: 'admin',
  });

  console.log('Admin created:', admin.email, '(password: Admin@123 — change this after first login)');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
