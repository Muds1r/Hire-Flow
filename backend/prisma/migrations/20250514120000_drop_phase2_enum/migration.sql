-- Move any legacy rows off PHASE_2 before recreating the enum
UPDATE "Application" SET "status" = 'UNDER_REVIEW' WHERE "status"::text = 'PHASE_2';

ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";

CREATE TYPE "ApplicationStatus" AS ENUM (
  'APPLIED',
  'CV_PROCESSED',
  'MATCHED',
  'TEST_SENT',
  'TEST_IN_PROGRESS',
  'TEST_SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'RETEST_REQUESTED',
  'INTERVIEW'
);

ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application"
  ALTER COLUMN "status" TYPE "ApplicationStatus"
  USING "status"::text::"ApplicationStatus";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'APPLIED';

DROP TYPE "ApplicationStatus_old";
