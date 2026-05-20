/**
 * Deletes all jobs (and cascaded applications/tests/results/etc.) and all CANDIDATE users.
 * Preserves users with role HR and EVALUATOR.
 *
 * Run from backend directory: npm run db:reset-candidates
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

  const candidates = await prisma.user.findMany({
    where: { role: UserRole.CANDIDATE },
    select: { id: true },
  });

  await prisma.job.deleteMany({});

  for (const u of candidates) {
    const dir = path.join(uploadRoot, u.id);
    await fs.rm(dir, { recursive: true, force: true });
  }

  const deleted = await prisma.user.deleteMany({
    where: { role: UserRole.CANDIDATE },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Reset complete: removed all jobs/applications/tests; deleted ${deleted.count} candidate account(s). HR and evaluator users unchanged.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
