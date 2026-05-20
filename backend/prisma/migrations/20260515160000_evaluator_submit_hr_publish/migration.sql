-- AlterTable
ALTER TABLE "Job" ADD COLUMN "evaluatorConfigSubmittedAt" TIMESTAMP(3);

-- Backfill: jobs that already had config or were published
UPDATE "Job"
SET "evaluatorConfigSubmittedAt" = COALESCE("publishedAt", "createdAt")
WHERE "assessmentSectionConfig" IS NOT NULL
   OR ("assessmentSectionTitles" IS NOT NULL AND "publishedAt" IS NOT NULL);
