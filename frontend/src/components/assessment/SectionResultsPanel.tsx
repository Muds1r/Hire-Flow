import { useMemo } from 'react';
import {
  buildSectionResultViews,
  formatTierBreakdown,
  sectionScoreTone,
  type SectionResultView,
} from '../../utils/sectionTestResults';
import type { EvaluatorPost, TestResultPayload } from '../../types';
import { SectionInlineNotes, type SectionNotesConfig } from './SectionInlineNotes';

export type SectionPanelNotesConfig = Omit<SectionNotesConfig, 'sectionTitle'> & {
  posts: EvaluatorPost[];
};

type Props = {
  className?: string;
  data?: Pick<TestResultPayload, 'sections' | 'result'>;
  sectionOrder?: string[];
  notes: SectionPanelNotesConfig;
};

function buildSectionRows(
  data: Props['data'],
  posts: EvaluatorPost[],
  sectionOrder?: string[],
): Array<{ title: string; score?: SectionResultView }> {
  const scored = data ? buildSectionResultViews(data) : [];
  const scoredByTitle = new Map(scored.map((s) => [s.title, s]));

  const orderedTitles: string[] = [];
  const push = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !orderedTitles.includes(trimmed)) {
      orderedTitles.push(trimmed);
    }
  };

  for (const t of sectionOrder ?? []) {
    push(t);
  }
  for (const s of scored) {
    push(s.title);
  }
  if (data?.sections) {
    for (const s of data.sections) {
      push(s.title);
    }
  }
  for (const p of posts) {
    push(p.sectionTitle || 'General');
  }

  return orderedTitles.map((title) => ({
    title,
    score: scoredByTitle.get(title),
  }));
}

export function SectionResultsPanel({
  className = '',
  data,
  sectionOrder,
  notes,
}: Props) {
  const rows = useMemo(
    () => buildSectionRows(data, notes.posts, sectionOrder),
    [data, notes.posts, sectionOrder],
  );

  if (!rows.length) {
    return (
      <div className={`empty-state ${className}`}>
        <p className="font-medium text-slate-600">No section results yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Scores and evaluator notes appear here after the test is generated and graded.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="hidden gap-6 border-b border-slate-200/80 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:grid sm:grid-cols-[11rem_1fr]">
        <span>Section</span>
        <span>Follow-ups</span>
      </div>

      <ul className="mt-3 space-y-3">
        {rows.map(({ title, score }) => (
          <li
            key={title}
            className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80"
          >
            <div className="flex flex-col sm:grid sm:grid-cols-[11rem_1fr] sm:items-stretch">
              <div className="border-b border-slate-100 bg-slate-50/40 p-4 sm:border-b-0 sm:border-r sm:py-5">
                <SectionScoreBlock title={title} score={score} />
              </div>
              <div className="min-w-0 p-4 sm:py-5 sm:pr-5 sm:pl-5">
                <SectionInlineNotes {...notes} sectionTitle={title} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionScoreBlock({
  title,
  score,
}: {
  title: string;
  score?: SectionResultView;
}) {
  const hasScore = !!score && score.total > 0;

  if (!hasScore) {
    return (
      <div className="flex h-full min-h-[5.5rem] flex-col justify-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Section
        </p>
        <p className="mt-1 text-base font-bold leading-snug text-slate-900">{title}</p>
        <p className="mt-2 text-xs text-slate-400">Score pending</p>
      </div>
    );
  }

  const tone = sectionScoreTone(score.correct, score.total);
  const tierLine = formatTierBreakdown(score.tiers);

  return (
    <div
      className={`flex h-full min-h-[5.5rem] flex-col justify-between rounded-xl border px-3.5 py-3 ring-1 ${tone}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">
        Section
      </p>
      <div className="mt-1">
        <p className="text-sm font-bold leading-snug">{title}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums leading-none tracking-tight">
          {score.correct}
          <span className="text-lg font-semibold opacity-60">/{score.total}</span>
        </p>
      </div>
      {tierLine ? (
        <p className="mt-2 text-[10px] font-medium leading-snug opacity-90">{tierLine}</p>
      ) : (
        <span className="mt-2 block h-3" aria-hidden />
      )}
    </div>
  );
}
