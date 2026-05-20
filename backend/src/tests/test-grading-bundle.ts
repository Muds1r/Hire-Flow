import { Prisma } from '@prisma/client';
import { computeTestScore, type PerQuestionGrade } from './grading';
import { TEST_SECTIONS_INCLUDE } from './test-sections.include';
import { buildResultAnalytics, collectBankGradeRows } from './result-analytics';

export type TestForGrading = Prisma.TestGetPayload<{
  include: {
    application: true;
    answers: true;
    testSections: typeof TEST_SECTIONS_INCLUDE;
  };
}>;

export type GradingBundle = {
  correct: number;
  max: number;
  sectionScores: Record<string, { correct: number; total: number }>;
  perQuestion: PerQuestionGrade[];
  submittedAt: Date;
  durationMs: number;
  analytics: ReturnType<typeof buildResultAnalytics>;
  bankRows: { bankEntryId: string; correct: boolean }[];
};

export async function buildGradingBundle(test: TestForGrading): Promise<GradingBundle> {
  const { correct, max, sectionScores, perQuestion } = computeTestScore(
    test.testSections,
    test.answers.map((a) => ({
      questionId: a.questionId,
      selectedOption: a.selectedOption,
    })),
  );

  const submittedAt = test.submittedAt ?? new Date();
  const durationMs =
    test.startedAt != null
      ? submittedAt.getTime() - test.startedAt.getTime()
      : 0;

  const meta = new Map<string, { difficulty: number }>();
  for (const sec of test.testSections) {
    for (const q of sec.questions) {
      meta.set(q.id, { difficulty: q.difficulty });
    }
  }

  const sectionTitlesByIndex = [...test.testSections]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => s.title);

  const analytics = buildResultAnalytics({
    score: { correct, max, sectionScores, perQuestion },
    perQuestionMeta: meta,
    sectionTitlesByIndex,
    durationMs,
  });

  const bankRows = collectBankGradeRows(
    perQuestion,
    new Map(
      test.testSections.flatMap((s) =>
        s.questions
          .filter((q) => q.bankEntryId)
          .map((q) => [q.id, q.bankEntryId!]),
      ),
    ),
  );

  return {
    correct,
    max,
    sectionScores,
    perQuestion,
    submittedAt,
    durationMs,
    analytics,
    bankRows,
  };
}

export function buildResultCreateInput(
  testId: string,
  test: TestForGrading,
  bundle: GradingBundle,
): Prisma.ResultUncheckedCreateInput {
  return {
    testId,
    totalScore: bundle.correct,
    maxScore: bundle.max,
    sectionScores: bundle.sectionScores,
    perQuestion: { items: bundle.perQuestion },
    analytics: bundle.analytics as unknown as Prisma.InputJsonValue,
    timingStats: {
      durationMs: bundle.durationMs,
      submittedAt: bundle.submittedAt,
      startedAt: test.startedAt,
    },
    violationsRecorded: test.violationCount,
  };
}
