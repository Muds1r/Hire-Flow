-- DropIndex
DROP INDEX "Question_bankEntryId_idx";

-- AlterTable
ALTER TABLE "ApplicationEvaluator" ADD COLUMN     "passForNextPhase" BOOLEAN,
ADD COLUMN     "reviewSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "reviewSummary" TEXT;

-- AlterTable
ALTER TABLE "QuestionBankEntry" ALTER COLUMN "updatedAt" DROP DEFAULT;
