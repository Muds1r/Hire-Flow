-- Remove HR override columns; add evaluator profile notes.

ALTER TABLE "Application" DROP COLUMN IF EXISTS "manualDecision";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "manualScoreOverride";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "hrNotes";

DROP TYPE IF EXISTS "ManualDecision";

CREATE TABLE "EvaluatorPost" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluatorPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvaluatorPost_applicationId_idx" ON "EvaluatorPost"("applicationId");
CREATE INDEX "EvaluatorPost_evaluatorId_idx" ON "EvaluatorPost"("evaluatorId");

ALTER TABLE "EvaluatorPost" ADD CONSTRAINT "EvaluatorPost_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluatorPost" ADD CONSTRAINT "EvaluatorPost_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
