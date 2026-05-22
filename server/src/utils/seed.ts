import { PrismaClient } from '@prisma/client';
import { hashPassword } from './hash';

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@game.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

export const seedAdmin = async (prisma: PrismaClient) => {
  const existing = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN_EMAIL } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
      console.log(`🔑 Upgraded ${DEFAULT_ADMIN_EMAIL} to ADMIN`);
    }
    return;
  }
  const hashed = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      name: 'Game Master',
      email: DEFAULT_ADMIN_EMAIL,
      password: hashed,
      role: 'ADMIN',
      coins: 10000,
    },
  });
  console.log(`🔑 Seeded admin: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
};

export const seedConfig = async (prisma: PrismaClient) => {
  const existing = await prisma.configuration.findFirst();
  if (!existing) {
    await prisma.configuration.create({ data: {} });
    console.log('⚙️  Seeded default configuration');
  }
};
