-- Distinguish auto-reject on job close from HR manual reject.
CREATE TYPE "ApplicationRejectionReason" AS ENUM ('JOB_CLOSED', 'HR_MANUAL');

ALTER TABLE "Application" ADD COLUMN "rejectionReason" "ApplicationRejectionReason";
