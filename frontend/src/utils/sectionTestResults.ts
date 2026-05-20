import type { TestResultPayload } from '../types';

export type QuestionTierLabel = 'easy' | 'medium' | 'hard' | 'expert';

export type SectionTierCounts = Record<
  QuestionTierLabel,
  { correct: number; total: number }
>;

export type SectionResultView = {
  title: string;
  correct: number;
  total: number;
  tiers: SectionTierCounts;
};

const TIER_ORDER: QuestionTierLabel[] = ['easy', 'medium', 'hard', 'expert'];

function emptyTiers(): SectionTierCounts {
  return {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
    expert: { correct: 0, total: 0 },
  };
}

/** Score band color: 0–4 red, 5–7 amber, 8–10 green (per-section correct count). */
export function sectionScoreTone(correct: number, total = 10): string {
  const score = total > 0 ? Math.round((correct / total) * 10) : 0;
  if (score <= 4) {
    return 'border-red-300 bg-red-50 text-red-950 ring-red-200/80';
  }
  if (score <= 7) {
    return 'border-amber-300 bg-amber-50 text-amber-950 ring-amber-200/80';
  }
  return 'border-mint bg-mint-light text-navy ring-mint/40';
}

export function formatTierBreakdown(tiers: SectionTierCounts): string {
  const parts: string[] = [];
  for (const key of TIER_ORDER) {
    const t = tiers[key];
    if (t.total > 0) {
      parts.push(`${t.correct}/${t.total} ${key}`);
    }
  }
  return parts.length ? `(${parts.join(', ')})` : '';
}

function parseAnalyticsSection(
  title: string,
  raw: unknown,
): SectionResultView | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as {
    correct?: number;
    total?: number;
    tiers?: SectionTierCounts;
  };
  const correct = typeof row.correct === 'number' ? row.correct : 0;
  const total = typeof row.total === 'number' ? row.total : 0;
  const tiers = row.tiers ?? emptyTiers();
  return { title, correct, total, tiers };
}

/** Build section rows from graded test payload (analytics preferred, fallback to sectionScores). */
export function buildSectionResultViews(
  data: Pick<TestResultPayload, 'sections' | 'result'>,
): SectionResultView[] {
  const sectionOrder =
    data.sections?.map((s) => s.title) ??
    [];

  const analytics = data.result?.analytics as
    | { sectionPerformance?: Record<string, unknown> }
    | undefined;
  const perf = analytics?.sectionPerformance;

  if (perf && typeof perf === 'object') {
    const ordered: SectionResultView[] = [];
    for (const title of sectionOrder) {
      const row = parseAnalyticsSection(title, perf[title]);
      if (row) {
        ordered.push(row);
      }
    }
    for (const [title, raw] of Object.entries(perf)) {
      if (!ordered.some((r) => r.title === title)) {
        const row = parseAnalyticsSection(title, raw);
        if (row) {
          ordered.push(row);
        }
      }
    }
    if (ordered.length) {
      return ordered;
    }
  }

  const scores = data.result?.sectionScores as
    | Record<string, { correct: number; total: number }>
    | undefined;
  if (!scores) {
    return [];
  }

  const fromScores: SectionResultView[] = [];
  for (const title of sectionOrder.length ? sectionOrder : Object.keys(scores)) {
    const v = scores[title];
    if (!v) continue;
    fromScores.push({
      title,
      correct: v.correct,
      total: v.total,
      tiers: emptyTiers(),
    });
  }
  return fromScores;
}
