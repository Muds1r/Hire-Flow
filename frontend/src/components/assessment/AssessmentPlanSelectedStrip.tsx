import { AssessmentPlanSummary } from '../ui/AssessmentPlanSummary';

type Props = {
  selected: string[];
  onRemove: (label: string) => void;
  onClearAll: () => void;
};

export function AssessmentPlanSelectedStrip({
  selected,
  onRemove,
  onClearAll,
}: Props) {
  if (selected.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-mint/40 bg-mint-light/50 px-3 py-3 ring-1 ring-mint/25">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-navy">Your plan</p>
        <button
          type="button"
          className="text-xs font-semibold text-slate-600 underline-offset-2 hover:text-navy hover:underline"
          onClick={onClearAll}
        >
          Clear all
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {selected.map((label, index) => (
          <li key={label}>
            <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-mint/50 bg-white py-1 pl-1.5 pr-1 text-xs font-medium text-navy ring-1 ring-mint/30">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-mint-light text-[10px] font-bold text-navy">
                {index + 1}
              </span>
              <span className="truncate">{label}</span>
              <button
                type="button"
                className="ml-0.5 shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-red-700"
                aria-label={`Remove ${label}`}
                onClick={() => onRemove(label)}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
      <AssessmentPlanSummary sectionCount={selected.length} className="mt-2 text-xs text-slate-600" />
    </div>
  );
}
