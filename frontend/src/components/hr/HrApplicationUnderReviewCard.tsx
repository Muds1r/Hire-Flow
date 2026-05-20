import type { Application } from '../../types';
import { HrHiringDecision } from './HrHiringDecision';

type Props = {
  app: Application;
  rejectPending: boolean;
  interviewPending: boolean;
  onReject: () => void;
  onMoveToInterview: () => void;
};

export function HrApplicationUnderReviewCard({
  app,
  rejectPending,
  interviewPending,
  onReject,
  onMoveToInterview,
}: Props) {
  const evaluatorCount = app.evaluatorAssignments?.length ?? 0;

  return (
    <div className="app-card mt-8">
      {evaluatorCount > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Evaluator recommendations
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Pass / not pass flags are non-binding input for your hiring decision below.
          </p>
          <ul className="mt-4 space-y-5">
            {(app.evaluatorAssignments ?? []).map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-slate-200/90 bg-surface/50 px-4 py-3 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {row.evaluator.name || row.evaluator.email}
                  </p>
                  {row.reviewSubmittedAt ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        row.passForNextPhase === true
                          ? 'bg-mint-light text-navy'
                          : row.passForNextPhase === false
                            ? 'bg-red-100 text-red-900'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.passForNextPhase === true
                        ? 'Pass'
                        : row.passForNextPhase === false
                          ? 'Not passing'
                          : '—'}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-800">No review submitted</span>
                  )}
                </div>
                {row.reviewSummary && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {row.reviewSummary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <HrHiringDecision
        hasEvaluatorAssignments={evaluatorCount > 0}
        showTopDivider={evaluatorCount > 0}
        rejectPending={rejectPending}
        interviewPending={interviewPending}
        onReject={onReject}
        onMoveToInterview={onMoveToInterview}
      />
    </div>
  );
}
