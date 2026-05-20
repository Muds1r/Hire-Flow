-- Remap legacy image-rendering phase before enum shrink.
UPDATE "Job"
SET "assessmentBankPrepPhase" = 'READY'
WHERE "assessmentBankPrepPhase" = 'RENDERING_IMAGES'
  AND "assessmentBankReady" = true;

UPDATE "Job"
SET "assessmentBankPrepPhase" = 'FILLING_QUESTIONS'
WHERE "assessmentBankPrepPhase" = 'RENDERING_IMAGES';

ALTER TABLE "Question" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "QuestionBankEntry" DROP COLUMN IF EXISTS "imageUrl";

ALTER TYPE "AssessmentBankPrepPhase" RENAME TO "AssessmentBankPrepPhase_old";

CREATE TYPE "AssessmentBankPrepPhase" AS ENUM (
  'NOT_STARTED',
  'FILLING_QUESTIONS',
  'READY',
  'FAILED'
);

ALTER TABLE "Job" ALTER COLUMN "assessmentBankPrepPhase" DROP DEFAULT;

ALTER TABLE "Job"
ALTER COLUMN "assessmentBankPrepPhase" TYPE "AssessmentBankPrepPhase"
USING ("assessmentBankPrepPhase"::text::"AssessmentBankPrepPhase");

ALTER TABLE "Job"
ALTER COLUMN "assessmentBankPrepPhase" SET DEFAULT 'NOT_STARTED';

DROP TYPE "AssessmentBankPrepPhase_old";
