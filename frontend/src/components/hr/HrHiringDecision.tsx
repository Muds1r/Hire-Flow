type Props = {
  hasEvaluatorAssignments: boolean;
  rejectPending: boolean;
  interviewPending: boolean;
  onReject: () => void;
  onMoveToInterview: () => void;
  /** When false, omit top divider (standalone hiring card). */
  showTopDivider?: boolean;
};

export function HrHiringDecision({
  hasEvaluatorAssignments,
  rejectPending,
  interviewPending,
  onReject,
  onMoveToInterview,
  showTopDivider = true,
}: Props) {
  return (
    <div
      className={
        showTopDivider ? 'mt-6 border-t border-slate-200 pt-6' : ''
      }
    >
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
        HR hiring decision
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        {hasEvaluatorAssignments
          ? 'Evaluator pass / not pass is advisory only. Reject to close the pipeline, or move to interview when you want to proceed.'
          : 'This application is under review. Reject to close the pipeline, or move to interview when you are ready.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-danger" disabled={rejectPending} onClick={onReject}>
          {rejectPending ? 'Rejecting…' : 'Reject candidate'}
        </button>
        <button
          type="button"
          className="btn-success"
          disabled={interviewPending}
          onClick={onMoveToInterview}
        >
          {interviewPending ? 'Updating…' : 'Move to interview'}
        </button>
      </div>
    </div>
  );
}
