-- Drop legacy skill weights; add job assessment template + bank prep flags.
ALTER TABLE "Job" DROP COLUMN IF EXISTS "skillWeights";
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "assessmentSectionTitles" JSONB;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "assessmentBankReady" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "assessmentBankPreparedAt" TIMESTAMP(3);
