-- Enterprise pipeline: question bank, skill weights, enum refactors, result extensions.

-- Question bank (reusable MCQs)
CREATE TABLE "QuestionBankEntry" (
    "id" TEXT NOT NULL,
    "technology" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "scoreSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionBankEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Question" ADD COLUMN "bankEntryId" TEXT;
ALTER TABLE "Question" ADD CONSTRAINT "Question_bankEntryId_fkey" FOREIGN KEY ("bankEntryId") REFERENCES "QuestionBankEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Question_bankEntryId_idx" ON "Question"("bankEntryId");

ALTER TABLE "Job" ADD COLUMN "skillWeights" JSONB;

ALTER TABLE "Result" ADD COLUMN "weightedScore" DOUBLE PRECISION;
ALTER TABLE "Result" ADD COLUMN "candidateSummary" JSONB;
ALTER TABLE "Result" ADD COLUMN "analytics" JSONB;

-- ApplicationStatus: replace enum (Postgres cannot remove enum values in-place cleanly)
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE TEXT USING ("status"::TEXT);
UPDATE "Application" SET "status" = 'CV_ANALYZED' WHERE "status" = 'MATCHED';
DROP TYPE "ApplicationStatus";
CREATE TYPE "ApplicationStatus" AS ENUM (
  'APPLIED',
  'CV_ANALYZED',
  'TEST_READY',
  'TEST_SENT',
  'TEST_STARTED',
  'TEST_SUBMITTED',
  'GRADED',
  'UNDER_REVIEW',
  'INTERVIEW',
  'REJECTED',
  'HIRED'
);
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus" USING ("status"::"ApplicationStatus");
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'APPLIED'::"ApplicationStatus";

-- TestStatus: add DRAFT/APPROVED; existing rows stay candidate-visible states
ALTER TABLE "Test" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Test" ALTER COLUMN "status" TYPE TEXT USING ("status"::TEXT);
DROP TYPE "TestStatus";
CREATE TYPE "TestStatus" AS ENUM (
  'DRAFT',
  'APPROVED',
  'SENT',
  'IN_PROGRESS',
  'SUBMITTED',
  'AUTO_SUBMITTED',
  'GRADED'
);
ALTER TABLE "Test" ALTER COLUMN "status" TYPE "TestStatus" USING ("status"::"TestStatus");
ALTER TABLE "Test" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"TestStatus";
