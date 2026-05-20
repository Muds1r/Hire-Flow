import type { PerQuestionGrade, TestScoreResult } from './grading';

export type QuestionTierLabel = 'easy' | 'medium' | 'hard' | 'expert';

export type SectionTierCounts = Record<
  QuestionTierLabel,
  { correct: number; total: number }
>;

export type SectionResultDetail = {
  correct: number;
  total: number;
  accuracy: number;
  tiers: SectionTierCounts;
};

export type ResultAnalytics = {
  sectionPerformance: Record<string, SectionResultDetail>;
  difficultyPerformance: Record<
    string,
    { correct: number; total: number; accuracy: number }
  >;
  questionStats: { questionId: string; correct: boolean; difficulty: number }[];
  completionTimeMs: number;
};

function difficultyBucket(d: number): string {
  if (d <= 3) {
    return '1-3';
  }
  if (d <= 7) {
    return '4-7';
  }
  return '8-10';
}

export function questionTierLabel(d: number): QuestionTierLabel {
  if (d <= 3) {
    return 'easy';
  }
  if (d <= 6) {
    return 'medium';
  }
  if (d <= 8) {
    return 'hard';
  }
  return 'expert';
}

function emptyTierCounts(): SectionTierCounts {
  return {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
    expert: { correct: 0, total: 0 },
  };
}

export function buildResultAnalytics(params: {
  score: TestScoreResult;
  perQuestionMeta: Map<string, { difficulty: number }>;
  sectionTitlesByIndex: string[];
  durationMs: number;
}): ResultAnalytics {
  const sectionPerformance: ResultAnalytics['sectionPerformance'] = {};
  for (const [title, v] of Object.entries(params.score.sectionScores)) {
    const accuracy = v.total > 0 ? v.correct / v.total : 0;
    sectionPerformance[title] = {
      correct: v.correct,
      total: v.total,
      accuracy,
      tiers: emptyTierCounts(),
    };
  }

  for (const pq of params.score.perQuestion) {
    const sectionTitle =
      params.sectionTitlesByIndex[pq.sectionIndex] ?? `Section ${pq.sectionIndex + 1}`;
    if (!sectionPerformance[sectionTitle]) {
      sectionPerformance[sectionTitle] = {
        correct: 0,
        total: 0,
        accuracy: 0,
        tiers: emptyTierCounts(),
      };
    }
    const meta = params.perQuestionMeta.get(pq.questionId);
    const tier = questionTierLabel(meta?.difficulty ?? 5);
    const row = sectionPerformance[sectionTitle].tiers[tier];
    row.total += 1;
    if (pq.correct) {
      row.correct += 1;
    }
  }

  const diffAgg: Record<string, { correct: number; total: number }> = {};
  const questionStats: ResultAnalytics['questionStats'] = [];

  for (const row of params.score.perQuestion) {
    const meta = params.perQuestionMeta.get(row.questionId);
    const d = meta?.difficulty ?? 5;
    const bucket = difficultyBucket(d);
    if (!diffAgg[bucket]) {
      diffAgg[bucket] = { correct: 0, total: 0 };
    }
    diffAgg[bucket].total += 1;
    if (row.correct) {
      diffAgg[bucket].correct += 1;
    }
    questionStats.push({
      questionId: row.questionId,
      correct: row.correct,
      difficulty: d,
    });
  }

  const difficultyPerformance: ResultAnalytics['difficultyPerformance'] = {};
  for (const [b, v] of Object.entries(diffAgg)) {
    difficultyPerformance[b] = {
      correct: v.correct,
      total: v.total,
      accuracy: v.total > 0 ? v.correct / v.total : 0,
    };
  }

  return {
    sectionPerformance,
    difficultyPerformance,
    questionStats,
    completionTimeMs: params.durationMs,
  };
}

export function collectBankGradeRows(
  perQuestion: PerQuestionGrade[],
  bankByQuestionId: Map<string, string>,
): { bankEntryId: string; correct: boolean }[] {
  const out: { bankEntryId: string; correct: boolean }[] = [];
  for (const pq of perQuestion) {
    const bid = bankByQuestionId.get(pq.questionId);
    if (bid) {
      out.push({ bankEntryId: bid, correct: pq.correct });
    }
  }
  return out;
}
