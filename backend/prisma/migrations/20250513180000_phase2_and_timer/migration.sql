-- Per-question timer default (new tests)
ALTER TABLE "Test" ALTER COLUMN "questionSeconds" SET DEFAULT 25;

-- HR pipeline: post-assessment phase
ALTER TYPE "ApplicationStatus" ADD VALUE 'PHASE_2';
