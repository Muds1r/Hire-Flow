-- CreateEnum
CREATE TYPE "AssessmentBankPrepPhase" AS ENUM (
  'NOT_STARTED',
  'FILLING_QUESTIONS',
  'RENDERING_IMAGES',
  'READY',
  'FAILED'
);

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "assessmentBankPrepPhase" "AssessmentBankPrepPhase" NOT NULL DEFAULT 'NOT_STARTED';

UPDATE "Job"
SET "assessmentBankPrepPhase" = 'READY'
WHERE "assessmentBankReady" = true;

UPDATE "Job"
SET "assessmentBankPrepPhase" = 'FAILED'
WHERE "assessmentBankReady" = false
  AND "assessmentSectionTitles" IS NOT NULL
  AND "assessmentBankPreparedAt" IS NULL
  AND "createdAt" < NOW() - INTERVAL '1 hour';
