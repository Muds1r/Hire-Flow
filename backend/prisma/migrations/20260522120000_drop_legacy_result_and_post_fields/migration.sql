-- Drop unused legacy columns (AI summaries removed from grading; EvaluatorPost.title unused).
ALTER TABLE "Result" DROP COLUMN IF EXISTS "aiSummary";
ALTER TABLE "Result" DROP COLUMN IF EXISTS "candidateSummary";
ALTER TABLE "EvaluatorPost" DROP COLUMN IF EXISTS "title";
