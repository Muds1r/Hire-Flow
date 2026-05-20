import type { HrEvaluator } from '../../types/evaluator';

type Props = {
  evaluator: HrEvaluator;
  variant: 'active' | 'deactivated';
  onEdit: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
  deactivatePending?: boolean;
  reactivatePending?: boolean;
};

export function EvaluatorListRow({
  evaluator: ev,
  variant,
  onEdit,
  onDeactivate,
  onReactivate,
  deactivatePending,
  reactivatePending,
}: Props) {
  const isDeactivated = variant === 'deactivated';

  return (
    <li
      className={[
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        isDeactivated
          ? 'border-slate-200/60 bg-slate-100/60'
          : 'border-slate-200/80 bg-white',
      ].join(' ')}
    >
      <div className="min-w-0">
        <p
          className={[
            'font-semibold',
            isDeactivated ? 'text-slate-600' : 'text-slate-900',
          ].join(' ')}
        >
          {ev.name?.trim() || ev.email}
        </p>
        {ev.name && (
          <p className="mt-0.5 text-sm text-slate-500">{ev.email}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          Added {new Date(ev.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={onEdit}>
          Edit
        </button>
        {isDeactivated ? (
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={reactivatePending}
            onClick={onReactivate}
          >
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary btn-sm text-red-800 ring-red-200/80 hover:bg-red-50"
            disabled={deactivatePending}
            onClick={onDeactivate}
          >
            Deactivate
          </button>
        )}
      </div>
    </li>
  );
}
