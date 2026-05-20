-- Backfill auto-rejects from job close (same moment as closedAt).
UPDATE "Application" AS a
SET "rejectionReason" = 'JOB_CLOSED'
FROM "Job" AS j
WHERE a."jobId" = j.id
  AND a.status = 'REJECTED'
  AND a."rejectionReason" IS NULL
  AND j."closedAt" IS NOT NULL
  AND a."updatedAt" >= j."closedAt" - INTERVAL '3 minutes'
  AND a."updatedAt" <= j."closedAt" + INTERVAL '3 minutes';
