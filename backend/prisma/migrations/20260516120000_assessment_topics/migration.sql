-- HR-managed assessment section catalog (stable names for shared question bank).
CREATE TABLE "AssessmentTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentTopic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentTopic_name_key" ON "AssessmentTopic"("name");
CREATE INDEX "AssessmentTopic_name_idx" ON "AssessmentTopic"("name");

ALTER TABLE "AssessmentTopic" ADD CONSTRAINT "AssessmentTopic_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AssessmentTopic" ("id", "name", "createdAt") VALUES
  ('a1000000-0000-4000-8000-000000000001', 'JavaScript', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000002', 'TypeScript', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000003', 'HTML', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000004', 'CSS', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000005', 'React', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000006', 'Node.js', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000007', 'Databases', CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000008', 'Web fundamentals', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
