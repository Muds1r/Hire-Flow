-- CreateEnum
CREATE TYPE "TestIntensityLevel" AS ENUM ('INTERN_ASSOCIATE', 'SOFTWARE_ENGINEER', 'SENIOR_DEVELOPER');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "assessmentSectionConfig" JSONB;

-- CreateTable
CREATE TABLE "JobEvaluator" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvaluator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobEvaluator_evaluatorId_idx" ON "JobEvaluator"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "JobEvaluator_jobId_evaluatorId_key" ON "JobEvaluator"("jobId", "evaluatorId");

-- AddForeignKey
ALTER TABLE "JobEvaluator" ADD CONSTRAINT "JobEvaluator_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvaluator" ADD CONSTRAINT "JobEvaluator_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvaluator" ADD CONSTRAINT "JobEvaluator_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: jobs that already had assessment sections were HR-published under the old flow
UPDATE "Job"
SET "publishedAt" = "createdAt"
WHERE "assessmentSectionTitles" IS NOT NULL
  AND jsonb_array_length("assessmentSectionTitles"::jsonb) > 0;
