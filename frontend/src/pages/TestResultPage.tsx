import { useParams, Link, useLocation } from 'react-router-dom';
import { getApiErrorMessage } from '../services/http';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import { SectionResultsPanel } from '../components/assessment/SectionResultsPanel';
import { useApplicationReview } from '../features/applications/useApplicationReview';
import { CvViewButton } from '../components/hr/CvViewButton';

/** HR or evaluator: graded test results and section notes (route RBAC on API). */
export function TestResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const { pathname } = useLocation();
  const base = pathname.startsWith('/eval') ? '/eval' : '/hr';
  const isHr = base === '/hr';
  const currentUserId = useAuthStore((s) => s.user?.id);

  const review = useApplicationReview({
    testId,
    fetchTestResult: true,
    allowNoteEdits: !isHr,
    allowEvaluatorReview: !isHr,
  });

  const q = review.testResultQuery;

  if (q.isLoading) {
    return <LoadingState message="Loading test…" />;
  }
  if (q.error || !q.data) {
    return (
      <div className="app-card text-red-800">
        <p className="font-medium">Could not load this test.</p>
        <Link className="link-muted mt-3 inline-block" to={base}>
          ← Back
        </Link>
      </div>
    );
  }

  const d = q.data;
  const hrBackTo =
    isHr && d.application.id ? `/hr/applications/${d.application.id}` : base;
  const canAddNotes =
    !isHr && d.application.status === 'UNDER_REVIEW' && !review.postsQuery.isError;
  const ev = review.evaluatorReview;

  return (
    <div className="text-left">
      <Link to={hrBackTo} className="link-muted inline-flex items-center gap-1">
        <span aria-hidden>←</span> {isHr ? 'Back to application' : 'Back'}
      </Link>

      <header className="mt-6">
        <h1 className="page-title !text-2xl sm:!text-3xl">Assessment review</h1>
        <p className="page-subtitle flex flex-wrap items-center gap-2 !mt-3">
          <StatusBadge status={d.status} />
          <span className="text-slate-400">·</span>
          <span>
            Tab violations:{' '}
            <strong className="text-slate-800">{d.violationCount}</strong> / {d.violationThreshold}
          </span>
        </p>
        {d.application && (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Application</span>
              <StatusBadge status={d.application.status} />
              <span className="text-slate-400">·</span>
              <span>{d.application.candidate.email}</span>
              <span className="text-slate-400">·</span>
              <span>{d.application.job.title}</span>
            </p>
            <CvViewButton applicationId={d.application.id} />
          </div>
        )}
      </header>

      {d.result && (
        <div className="app-card mt-8">
          <div className="flex items-baseline gap-3 border-b border-slate-200/80 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overall
            </p>
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {d.result.totalScore}
              <span className="text-lg font-semibold text-slate-400"> / {d.result.maxScore}</span>
            </p>
          </div>

          {review.postsQuery.isLoading && (
            <p className="mt-4 text-sm text-slate-500">Loading section notes…</p>
          )}
          {review.postsQuery.isError && (
            <p className="mt-4 text-sm text-amber-800">
              {isHr
                ? getApiErrorMessage(review.postsQuery.error, 'Could not load section notes.')
                : 'Could not load section notes. You must be assigned to this application.'}
            </p>
          )}

          {!review.postsQuery.isLoading && !review.postsQuery.isError && (
            <SectionResultsPanel
              className="mt-6"
              data={d}
              notes={{
                posts: review.posts,
                readOnly: isHr,
                canAddNotes,
                currentUserId,
                isCreating: review.notes.isCreating,
                isUpdating: review.notes.isUpdating,
                createError: review.notes.createError,
                onCreate: canAddNotes ? review.notes.onCreate : undefined,
                onUpdate: canAddNotes ? review.notes.onUpdate : undefined,
                onDelete: canAddNotes ? review.notes.onDelete : undefined,
              }}
            />
          )}
        </div>
      )}

      {!isHr && d.application.status === 'UNDER_REVIEW' && ev && (
        <div className="app-card mt-8 border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Your review (recommendation only)
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            HR receives your pass / not pass flag and summary; it does not change the application
            status.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                ev.passChoice === true
                  ? 'bg-mint text-white shadow-md'
                  : 'bg-mint-light text-navy ring-1 ring-mint/40 hover:bg-mint-light'
              }`}
              onClick={() => ev.setPassChoice(true)}
            >
              Pass for next phase
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                ev.passChoice === false
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-50 text-red-900 ring-1 ring-red-200 hover:bg-red-100'
              }`}
              onClick={() => ev.setPassChoice(false)}
            >
              Not passing
            </button>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Summary (optional)
            <textarea
              className="mt-1 min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={ev.summaryDraft}
              onChange={(e) => ev.setSummaryDraft(e.target.value)}
              maxLength={8000}
              placeholder="Optional overall notes for HR…"
            />
          </label>
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={ev.submitReviewMut.isPending || ev.passChoice === null}
            onClick={() =>
              ev.submitReviewMut.mutate({
                applicationId: d.application.id,
                passForNextPhase: ev.passChoice === true,
                summary: ev.summaryDraft.trim(),
              })
            }
          >
            {ev.submitReviewMut.isPending ? 'Submitting…' : 'Submit review'}
          </button>
          {ev.myReview?.reviewSubmittedAt && (
            <p className="mt-2 text-xs text-slate-500">
              Last submitted {new Date(ev.myReview.reviewSubmittedAt).toLocaleString()}. You may
              submit again to update your recommendation.
            </p>
          )}
          {ev.submitReviewMut.isError && (
            <p className="mt-2 text-sm font-medium text-red-800" role="alert">
              {getApiErrorMessage(ev.submitReviewMut.error, 'Could not submit review.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
