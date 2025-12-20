#!/bin/sh
# Railway 启动脚本 - 运行迁移并创建初始用户

set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Checking if admin user exists..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdminIfNotExists() {
  const prisma = new PrismaClient();
  
  try {
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('Admin user created: username=admin, password=admin123');
      console.log('IMPORTANT: Change this password after first login!');
    } else {
      console.log('Admin user already exists');
    }
  } finally {
    await prisma.\$disconnect();
  }
}

createAdminIfNotExists().catch(console.error);
"

echo "Starting application on port ${PORT:-3000}..."
npm start -- -p ${PORT:-3000}
