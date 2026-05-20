-- Soft-close jobs for HR (hidden from public listings & evaluator queue).
ALTER TABLE "Job" ADD COLUMN "closedAt" TIMESTAMP(3);
