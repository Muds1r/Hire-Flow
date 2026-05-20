-- Rename misleading column after mail removal (portal-only release to evaluators).
ALTER TABLE "Application" RENAME COLUMN "evaluatorsNotifiedAt" TO "sentToEvaluatorsAt";
