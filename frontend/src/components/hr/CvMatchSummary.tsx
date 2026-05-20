import type { MatchResult } from '../../types';

function isMatchResult(value: unknown): value is MatchResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  return typeof o.matchScore === 'number';
}

type Props = {
  matchResult: unknown;
};

function scoreTone(score: number): string {
  if (score >= 75) {
    return 'border-mint bg-mint-light text-navy ring-mint/40';
  }
  if (score >= 50) {
    return 'border-amber-300 bg-amber-50 text-amber-950 ring-amber-200/80';
  }
  return 'border-red-300 bg-red-50 text-red-950 ring-red-200/80';
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/90"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CvMatchSummary({ matchResult }: Props) {
  if (!isMatchResult(matchResult)) {
    return (
      <p className="text-sm text-slate-600">Match data is unavailable or in an unexpected format.</p>
    );
  }

  const tone = scoreTone(matchResult.matchScore);

  return (
    <div className="mt-4 space-y-5">
      <div className={`inline-flex flex-col rounded-xl border px-4 py-3 ring-1 ${tone}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Match score</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{matchResult.matchScore}%</p>
      </div>

      <ChipList label="Matched skills" items={matchResult.matchedSkills ?? []} />
      <ChipList label="Missing skills" items={matchResult.missingSkills ?? []} />
      <ChipList label="Weak areas" items={matchResult.weakAreas ?? []} />
    </div>
  );
}
