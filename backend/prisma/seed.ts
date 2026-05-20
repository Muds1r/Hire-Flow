import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  const hr = await prisma.user.upsert({
    where: { email: 'hr@example.com' },
    update: {},
    create: {
      email: 'hr@example.com',
      passwordHash: password,
      role: UserRole.HR,
      name: 'HR Admin',
    },
  });

  const evaluator = await prisma.user.upsert({
    where: { email: 'evaluator@example.com' },
    update: {},
    create: {
      email: 'evaluator@example.com',
      passwordHash: password,
      role: UserRole.EVALUATOR,
      name: 'Evaluator',
    },
  });

  const mernEvaluator = await prisma.user.upsert({
    where: { email: 'mern@example.com' },
    update: { role: UserRole.EVALUATOR },
    create: {
      email: 'mern@example.com',
      passwordHash: password,
      role: UserRole.EVALUATOR,
      name: 'MERN Evaluator',
    },
  });

  const aiEvaluator = await prisma.user.upsert({
    where: { email: 'ai@example.com' },
    update: { role: UserRole.EVALUATOR },
    create: {
      email: 'ai@example.com',
      passwordHash: password,
      role: UserRole.EVALUATOR,
      name: 'AI Evaluator',
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed users:', {
    hr: hr.email,
    evaluator: evaluator.email,
    mernEvaluator: mernEvaluator.email,
    aiEvaluator: aiEvaluator.email,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
