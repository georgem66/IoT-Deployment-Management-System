import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@company.com' }
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 12);
    
    await prisma.user.create({
      data: {
        email: 'admin@company.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
      },
    });

    console.log('✓ Admin user created');
  } else {
    console.log('✓ Admin user already exists');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
