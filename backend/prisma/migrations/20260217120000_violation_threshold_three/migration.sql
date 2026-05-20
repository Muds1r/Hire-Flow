-- Tab-switch auto-submit threshold: 3 strikes (was 5 default on older rows).
ALTER TABLE "Test" ALTER COLUMN "violationThreshold" SET DEFAULT 3;
UPDATE "Test" SET "violationThreshold" = 3 WHERE "violationThreshold" > 3;
