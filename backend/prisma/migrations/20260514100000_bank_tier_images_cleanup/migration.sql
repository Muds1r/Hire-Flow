-- Adaptive bank tiers, question images, job cleanup scheduling.

CREATE TYPE "BankDifficultyTier" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

ALTER TABLE "QuestionBankEntry" ADD COLUMN "tier" "BankDifficultyTier" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "QuestionBankEntry" ADD COLUMN "imageUrl" TEXT;

UPDATE "QuestionBankEntry" SET "tier" = 'EASY' WHERE "difficulty" <= 2;
UPDATE "QuestionBankEntry" SET "tier" = 'MEDIUM' WHERE "difficulty" > 2 AND "difficulty" <= 5;
UPDATE "QuestionBankEntry" SET "tier" = 'HARD' WHERE "difficulty" > 5 AND "difficulty" <= 8;
UPDATE "QuestionBankEntry" SET "tier" = 'EXPERT' WHERE "difficulty" > 8;

CREATE INDEX "QuestionBankEntry_technology_tier_idx" ON "QuestionBankEntry"("technology", "tier");

ALTER TABLE "Question" ADD COLUMN "imageUrl" TEXT;

ALTER TABLE "Job" ADD COLUMN "cleanupEligible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "cleanupScheduledAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "imagesCleanedAt" TIMESTAMP(3);

UPDATE "Job"
SET
  "cleanupEligible" = true,
  "cleanupScheduledAt" = "closedAt" + interval '7 days'
WHERE "closedAt" IS NOT NULL;
