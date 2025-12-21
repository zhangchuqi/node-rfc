import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];

  if (!email || !password) {
    console.error('Usage: npm run create-user <email> <password> [name]');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: email.split('@')[0], // 使用 email 前缀作为 username
        email,
        password: hashedPassword,
        name: name || null,
        role: 'ADMIN',
      },
    });

    console.log('✅ User created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name || 'N/A'}`);
    console.log(`Role: ${user.role}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Error: User with this email already exists');
    } else {
      console.error('❌ Error creating user:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
