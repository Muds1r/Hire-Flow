-- Section-scoped evaluator follow-up notes (title deprecated).
ALTER TABLE "EvaluatorPost" ADD COLUMN "sectionTitle" TEXT;

UPDATE "EvaluatorPost" SET "sectionTitle" = COALESCE(NULLIF(TRIM("title"), ''), 'General')
WHERE "sectionTitle" IS NULL;

ALTER TABLE "EvaluatorPost" ALTER COLUMN "sectionTitle" SET NOT NULL;

ALTER TABLE "EvaluatorPost" ALTER COLUMN "title" SET DEFAULT '';
