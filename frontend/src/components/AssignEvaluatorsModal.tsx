import { useEffect, useState } from 'react';
import { ModalShell } from './ui/ModalShell';
import { useEvaluatorUsers, type EvaluatorUser } from '../features/jobs/hooks';
import { getApiErrorMessage } from '../services/http';

type Props = {
  open: boolean;
  jobTitle: string;
  onClose: () => void;
  onConfirm: (evaluatorIds: string[]) => void;
  isSubmitting?: boolean;
};

export function AssignEvaluatorsModal({
  open,
  jobTitle,
  onClose,
  onConfirm,
  isSubmitting = false,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const evaluatorsQuery = useEvaluatorUsers(open);

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
    }
  }, [open]);

  const evaluators = evaluatorsQuery.data ?? [];

  const footer = (
    <>
      {selected.size === 0 ? (
        <p className="text-xs text-amber-800">Select at least one evaluator.</p>
      ) : (
        <p className="text-xs text-slate-600">
          {selected.size} evaluator{selected.size === 1 ? '' : 's'} will receive this JD.
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" disabled={isSubmitting} onClick={onClose}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={isSubmitting || selected.size === 0}
          onClick={() => onConfirm([...selected])}
        >
          {isSubmitting ? 'Sending…' : 'Send to evaluators'}
        </button>
      </div>
    </>
  );

  return (
    <ModalShell
      open={open}
      titleId="assign-evaluators-title"
      title="Assign evaluators"
      description={
        <>
          Send <strong className="text-slate-800">{jobTitle}</strong> to technical evaluators.
          They configure assessment topics and intensity; the first evaluator to submit sets the
          plan for this job. You publish when ready.
        </>
      }
      onClose={onClose}
      closeDisabled={isSubmitting}
      footer={footer}
    >
      {evaluatorsQuery.isLoading && (
        <p className="text-sm text-slate-500">Loading evaluators…</p>
      )}
      {evaluatorsQuery.isError && (
        <p className="text-sm font-medium text-red-700" role="alert">
          {getApiErrorMessage(evaluatorsQuery.error, 'Could not load evaluators.')}
        </p>
      )}
      {!evaluatorsQuery.isLoading && evaluators.length === 0 && (
        <p className="text-sm text-slate-600">No evaluator accounts found.</p>
      )}
      <ul className="space-y-2">
        {evaluators.map((ev: EvaluatorUser) => (
          <li key={ev.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition hover:border-mint hover:bg-mint-light/30 has-[:checked]:border-mint has-[:checked]:bg-mint-light/60">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-mint-dark focus:ring-mint"
                checked={selected.has(ev.id)}
                onChange={(e) => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) {
                      next.add(ev.id);
                    } else {
                      next.delete(ev.id);
                    }
                    return next;
                  });
                }}
              />
              <span className="text-sm font-medium text-slate-900">
                {ev.name ?? ev.email}
                {ev.name ? (
                  <span className="ml-2 font-normal text-slate-500">{ev.email}</span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </ModalShell>
  );
}
