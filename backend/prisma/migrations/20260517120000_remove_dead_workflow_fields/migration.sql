-- Remove unused workflow artifacts: APPROVED test status, retestRequested, weightedScore.

UPDATE "Test" SET "status" = 'DRAFT' WHERE "status" = 'APPROVED';

ALTER TABLE "Test" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Test" ALTER COLUMN "status" TYPE TEXT USING ("status"::TEXT);
DROP TYPE "TestStatus";
CREATE TYPE "TestStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'IN_PROGRESS',
  'SUBMITTED',
  'AUTO_SUBMITTED',
  'GRADED'
);
ALTER TABLE "Test" ALTER COLUMN "status" TYPE "TestStatus" USING ("status"::"TestStatus");
ALTER TABLE "Test" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"TestStatus";

ALTER TABLE "Application" DROP COLUMN IF EXISTS "retestRequested";
ALTER TABLE "Result" DROP COLUMN IF EXISTS "weightedScore";
