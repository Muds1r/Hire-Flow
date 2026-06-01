import type { Application } from '../../types';
import type { ApplicationActionsResult } from '../../utils/applicationActions';
import type { EvaluatorUser } from '../../features/jobs/hooks';
import { getApiErrorMessage } from '../../utils/apiError';

type Props = {
  app: Application;
  actions: ApplicationActionsResult;
  evalUsersLoading: boolean;
  assignableEvaluators: EvaluatorUser[];
  assignPick: string[];
  onAssignPickChange: (ids: string[]) => void;
  sendEvalPending: boolean;
  assignPending: boolean;
  sendEvalError: unknown;
  assignError: unknown;
  onSendToEvaluators: () => void;
  onAssign: () => void;
  evaluatorDirectoryEmpty: boolean;
};

export function HrApplicationEvaluatorsCard({
  app,
  actions,
  evalUsersLoading,
  assignableEvaluators,
  assignPick,
  onAssignPickChange,
  sendEvalPending,
  assignPending,
  sendEvalError,
  assignError,
  onSendToEvaluators,
  onAssign,
  evaluatorDirectoryEmpty,
}: Props) {
  return (
    <div className="app-card mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
        Evaluators
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Assign reviewers here. After the test is <strong>graded</strong>, use{' '}
        <strong>Send to evaluators</strong> to release the package in the evaluator portal (CV, score,
        and result). The application moves to <strong>Under review</strong>.
      </p>
      {app.sentToEvaluatorsAt && (
        <p className="mt-3 text-sm font-medium text-navy" role="status">
          Sent to evaluators on {new Date(app.sentToEvaluatorsAt).toLocaleString()}.
        </p>
      )}
      {actions.assignEvaluatorsHintVisible && (
        <p className="mt-3 text-sm font-medium text-amber-900">
          Assign at least one evaluator before you can send the evaluation package.
        </p>
      )}
      {actions.sendToEvaluatorsVisible && (
        <button
          type="button"
          className="btn-primary mt-4"
          disabled={sendEvalPending}
          onClick={onSendToEvaluators}
        >
          {sendEvalPending ? 'Sending…' : 'Send to evaluators'}
        </button>
      )}
      {sendEvalError != null && (
        <p className="mt-3 text-sm font-medium text-red-800" role="alert">
          {getApiErrorMessage(sendEvalError, 'Could not send to evaluators.')}
        </p>
      )}
      {(app.evaluatorAssignments?.length ?? 0) > 0 && (
        <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
          {(app.evaluatorAssignments ?? []).map((row) => (
            <li key={row.id}>
              {row.evaluator.email}
              {row.evaluator.name ? ` (${row.evaluator.name})` : ''}{' '}
              <span className="text-slate-400">· {row.status}</span>
            </li>
          ))}
        </ul>
      )}
      {actions.evaluatorAssignmentControlsVisible && evalUsersLoading && (
        <p className="mt-3 text-sm text-slate-500">Loading evaluator directory…</p>
      )}
      {actions.evaluatorAssignmentControlsVisible && assignableEvaluators.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Add assignment
          </p>
          {assignableEvaluators.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={assignPick.includes(u.id)}
                onChange={(e) => {
                  onAssignPickChange(
                    e.target.checked
                      ? [...assignPick, u.id]
                      : assignPick.filter((x) => x !== u.id),
                  );
                }}
              />
              <span>{u.email}</span>
            </label>
          ))}
          <button
            type="button"
            className="btn-secondary mt-2"
            disabled={assignPending || assignPick.length === 0}
            onClick={onAssign}
          >
            {assignPending ? 'Saving…' : 'Add selected evaluators'}
          </button>
        </div>
      )}
      {actions.evaluatorAssignmentControlsVisible && evaluatorDirectoryEmpty && (
          <p className="mt-3 text-sm text-amber-800">
            No evaluator-role users exist yet. Create accounts with the Evaluator role to assign
            reviewers.
          </p>
        )}
      {assignError != null && (
        <p className="mt-3 text-sm font-medium text-red-800" role="alert">
          {getApiErrorMessage(assignError, 'Could not save assignments.')}
        </p>
      )}
    </div>
  );
}
