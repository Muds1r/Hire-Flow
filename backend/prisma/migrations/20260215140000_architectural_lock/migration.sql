-- Architectural lock: enums, relational questions, Answer.questionId, application flags.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Application flags
ALTER TABLE "Application" ADD COLUMN "retestRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "evaluatorsNotifiedAt" TIMESTAMP(3);

UPDATE "Application" SET "retestRequested" = true WHERE "status"::text = 'RETEST_REQUESTED';

-- 2) ApplicationStatus → new enum
CREATE TYPE "ApplicationStatus_new" AS ENUM (
  'APPLIED',
  'MATCHED',
  'TEST_SENT',
  'TEST_STARTED',
  'TEST_SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW',
  'HIRED',
  'REJECTED'
);

ALTER TABLE "Application" ADD COLUMN "status_new" "ApplicationStatus_new";

UPDATE "Application" SET "status_new" = CASE "status"::text
  WHEN 'APPLIED' THEN 'APPLIED'::"ApplicationStatus_new"
  WHEN 'CV_PROCESSED' THEN 'MATCHED'::"ApplicationStatus_new"
  WHEN 'MATCHED' THEN 'MATCHED'::"ApplicationStatus_new"
  WHEN 'TEST_SENT' THEN 'TEST_SENT'::"ApplicationStatus_new"
  WHEN 'TEST_IN_PROGRESS' THEN 'TEST_STARTED'::"ApplicationStatus_new"
  WHEN 'TEST_SUBMITTED' THEN 'TEST_SUBMITTED'::"ApplicationStatus_new"
  WHEN 'UNDER_REVIEW' THEN 'UNDER_REVIEW'::"ApplicationStatus_new"
  WHEN 'APPROVED' THEN 'HIRED'::"ApplicationStatus_new"
  WHEN 'REJECTED' THEN 'REJECTED'::"ApplicationStatus_new"
  WHEN 'RETEST_REQUESTED' THEN 'MATCHED'::"ApplicationStatus_new"
  WHEN 'INTERVIEW' THEN 'INTERVIEW'::"ApplicationStatus_new"
  WHEN 'PHASE_2' THEN 'UNDER_REVIEW'::"ApplicationStatus_new"
  ELSE 'APPLIED'::"ApplicationStatus_new"
END;

ALTER TABLE "Application" DROP COLUMN "status";
ALTER TABLE "Application" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'APPLIED'::"ApplicationStatus_new";
ALTER TABLE "Application" ALTER COLUMN "status" SET NOT NULL;

DROP TYPE "ApplicationStatus";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";

-- 3) TestStatus → new enum (includes GRADED)
CREATE TYPE "TestStatus_new" AS ENUM (
  'SENT',
  'IN_PROGRESS',
  'SUBMITTED',
  'AUTO_SUBMITTED',
  'GRADED'
);

ALTER TABLE "Test" ADD COLUMN "status_new" "TestStatus_new";

UPDATE "Test" t SET "status_new" = CASE
  WHEN EXISTS (SELECT 1 FROM "Result" r WHERE r."testId" = t.id) THEN 'GRADED'::"TestStatus_new"
  WHEN t."status"::text = 'DRAFT' THEN 'SENT'::"TestStatus_new"
  WHEN t."status"::text = 'SENT' THEN 'SENT'::"TestStatus_new"
  WHEN t."status"::text = 'IN_PROGRESS' THEN 'IN_PROGRESS'::"TestStatus_new"
  WHEN t."status"::text = 'SUBMITTED' THEN 'SUBMITTED'::"TestStatus_new"
  WHEN t."status"::text = 'AUTO_SUBMITTED' THEN 'AUTO_SUBMITTED'::"TestStatus_new"
  ELSE 'SENT'::"TestStatus_new"
END;

ALTER TABLE "Test" DROP COLUMN "status";
ALTER TABLE "Test" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Test" ALTER COLUMN "status" SET DEFAULT 'SENT'::"TestStatus_new";
ALTER TABLE "Test" ALTER COLUMN "status" SET NOT NULL;

DROP TYPE "TestStatus";
ALTER TYPE "TestStatus_new" RENAME TO "TestStatus";

-- 4) TestSection + Question (from JSON sections)
CREATE TABLE "TestSection" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TestSection_testId_orderIndex_key" ON "TestSection"("testId", "orderIndex");
ALTER TABLE "TestSection" ADD CONSTRAINT "TestSection_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "testSectionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Question_testSectionId_orderIndex_key" ON "Question"("testSectionId", "orderIndex");
ALTER TABLE "Question" ADD CONSTRAINT "Question_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "TestSection" ("id", "testId", "title", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.id, COALESCE(sec.elem->>'title', 'Section'), (sec.ord - 1)::int, CURRENT_TIMESTAMP
FROM "Test" t
CROSS JOIN LATERAL jsonb_array_elements(t."sections"::jsonb) WITH ORDINALITY AS sec(elem, ord);

INSERT INTO "Question" ("id", "testSectionId", "question", "options", "correctIndex", "explanation", "difficulty", "category", "orderIndex", "createdAt")
SELECT
  gen_random_uuid()::text,
  ts.id,
  COALESCE(q.elem->>'question', ''),
  COALESCE(q.elem->'options', '[]'::jsonb),
  COALESCE((q.elem->>'correctIndex')::int, 0),
  COALESCE(q.elem->>'explanation', ''),
  COALESCE((q.elem->>'difficulty')::int, 1),
  COALESCE(q.elem->>'category', ts.title),
  (q.q_ord - 1)::int,
  CURRENT_TIMESTAMP
FROM "Test" t
JOIN "TestSection" ts ON ts."testId" = t.id
CROSS JOIN LATERAL jsonb_array_elements(t."sections"::jsonb) WITH ORDINALITY AS sec(elem, sec_ord)
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(sec.elem->'questions', '[]'::jsonb)) WITH ORDINALITY AS q(elem, q_ord)
WHERE (sec.sec_ord - 1) = ts."orderIndex";

-- 5) Answer: add questionId, backfill, drop old shape
ALTER TABLE "Answer" ADD COLUMN "questionId" TEXT;

UPDATE "Answer" a
SET "questionId" = q.id
FROM "Question" q
JOIN "TestSection" ts ON q."testSectionId" = ts.id
WHERE a."testId" = ts."testId"
  AND a."sectionIndex" = ts."orderIndex"
  AND a."questionIndex" = q."orderIndex";

DELETE FROM "Answer" WHERE "questionId" IS NULL;

DROP INDEX IF EXISTS "Answer_testId_sectionIndex_questionIndex_key";

ALTER TABLE "Answer" DROP COLUMN "sectionIndex";
ALTER TABLE "Answer" DROP COLUMN "questionIndex";

ALTER TABLE "Answer" ALTER COLUMN "questionId" SET NOT NULL;

CREATE UNIQUE INDEX "Answer_testId_questionId_key" ON "Answer"("testId", "questionId");

ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) Drop legacy JSON snapshot
ALTER TABLE "Test" DROP COLUMN "sections";
