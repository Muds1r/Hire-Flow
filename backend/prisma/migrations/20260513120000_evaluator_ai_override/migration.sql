-- Evaluator assignments, async AI status, HR manual overrides.

CREATE TYPE "AiProcessingStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "ApplicationEvaluatorStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED');
CREATE TYPE "ManualDecision" AS ENUM ('HIRED', 'REJECTED');

ALTER TABLE "Application" ADD COLUMN "aiStatus" "AiProcessingStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "Application" SET "aiStatus" = 'COMPLETED';

ALTER TABLE "Application" ADD COLUMN "manualDecision" "ManualDecision";
ALTER TABLE "Application" ADD COLUMN "manualScoreOverride" DOUBLE PRECISION;
ALTER TABLE "Application" ADD COLUMN "hrNotes" TEXT;

CREATE TABLE "ApplicationEvaluator" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "status" "ApplicationEvaluatorStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvaluator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationEvaluator_applicationId_evaluatorId_key" ON "ApplicationEvaluator"("applicationId", "evaluatorId");
CREATE INDEX "ApplicationEvaluator_evaluatorId_idx" ON "ApplicationEvaluator"("evaluatorId");
CREATE INDEX "ApplicationEvaluator_applicationId_idx" ON "ApplicationEvaluator"("applicationId");

ALTER TABLE "ApplicationEvaluator" ADD CONSTRAINT "ApplicationEvaluator_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationEvaluator" ADD CONSTRAINT "ApplicationEvaluator_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationEvaluator" ADD CONSTRAINT "ApplicationEvaluator_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "ApplicationEvaluator" ("id", "applicationId", "evaluatorId", "assignedById", "status", "assignedAt")
SELECT
  gen_random_uuid()::text,
  a."id",
  u."id",
  j."createdById",
  'PENDING'::"ApplicationEvaluatorStatus",
  CURRENT_TIMESTAMP
FROM "Application" a
INNER JOIN "Job" j ON j."id" = a."jobId"
CROSS JOIN "User" u
WHERE u."role" = 'EVALUATOR'
  AND j."closedAt" IS NULL
  AND a."status" IN ('GRADED', 'UNDER_REVIEW', 'INTERVIEW', 'HIRED', 'REJECTED');
