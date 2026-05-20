import { MAX_ASSESSMENT_SECTIONS } from '../../constants/assessmentTaxonomy';

type Props = {
  selectedCount: number;
  max?: number;
};

export function AssessmentPlanProgress({
  selectedCount,
  max = MAX_ASSESSMENT_SECTIONS,
}: Props) {
  const pct = Math.min(100, (selectedCount / max) * 100);
  const atLimit = selectedCount >= max;

  return (
    <div className="space-y-1.5">
      <span
        className={[
          'block text-xs',
          atLimit ? 'font-semibold text-amber-900' : 'font-medium text-slate-700',
        ].join(' ')}
      >
        {selectedCount} / {max} sections selected
        {atLimit ? ' · maximum reached' : ''}
      </span>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200/90"
        role="progressbar"
        aria-valuenow={selectedCount}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={[
            'h-full rounded-full transition-all duration-300',
            atLimit ? 'bg-amber-500' : 'bg-mint',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
