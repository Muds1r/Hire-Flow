import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { QueryPanel } from '../components/ui/QueryPanel';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import { useEvaluatorPendingJobs } from '../features/jobs/hooks';
import { useApplicationsList } from '../features/applications/hooks';
import {
  evaluatorQueueCandidateLines,
  matchesEvaluatorQueueSearch,
} from '../utils/evaluatorQueueSearch';

export function EvalPortalPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [queueSearch, setQueueSearch] = useState('');

  const pendingJobsQuery = useEvaluatorPendingJobs();
  const appsQuery = useApplicationsList();

  const pendingJobs = pendingJobsQuery.data ?? [];

  const reviewApps = useMemo(
    () => (appsQuery.data ?? []).filter((a) => a.status === 'UNDER_REVIEW'),
    [appsQuery.data],
  );

  const queueSearchTrimmed = queueSearch.trim();

  const filteredReviewApps = useMemo(
    () =>
      reviewApps.filter((app) =>
        matchesEvaluatorQueueSearch(app.candidate, queueSearchTrimmed),
      ),
    [reviewApps, queueSearchTrimmed],
  );

  return (
    <div className="space-y-10 text-left">
      <PageHeader
        title="Evaluator home"
        subtitle="Send assessment plans to HR for new JDs; review candidates after HR sends them to you."
      />

      <section>
        <h2 className="text-lg font-bold text-slate-900">JD drafts to configure</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose assessment topics and intensity, then send the plan to HR. If multiple evaluators
          are assigned, whoever submits first sets the plan — the JD disappears from everyone&apos;s
          list once submitted.
        </p>
        <QueryPanel
          isLoading={pendingJobsQuery.isLoading}
          isError={!!pendingJobsQuery.error}
          loadingMessage="Loading drafts…"
          errorMessage="Could not load pending job drafts."
        >
          {pendingJobs.length === 0 ? (
            <div className="app-card mt-4 py-8 text-center text-slate-600">
              <p className="font-medium text-slate-800">No pending JDs</p>
              <p className="mt-1 text-sm">HR will assign new job descriptions here.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingJobs.map((job) => (
                <li
                  key={job.id}
                  className="app-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {job.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{job.description}</p>
                    {job.createdBy && (
                      <p className="mt-2 text-xs text-slate-500">
                        From HR: {job.createdBy.name ?? job.createdBy.email}
                      </p>
                    )}
                  </div>
                  <Link
                    className="btn-primary btn-sm shrink-0"
                    to={`/eval/jobs/${job.id}/configure`}
                  >
                    Configure & send to HR
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </QueryPanel>
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Evaluation queue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Applications under review after HR sends the evaluation package.
            </p>
            {!appsQuery.isLoading && !appsQuery.error && reviewApps.length > 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">
                {queueSearchTrimmed ? (
                  <>
                    {filteredReviewApps.length} match
                    {filteredReviewApps.length === 1 ? '' : 'es'}
                    {filteredReviewApps.length === 0 ? (
                      <>
                        {' · '}
                        <button
                          type="button"
                          className="font-semibold text-navy underline-offset-2 hover:underline"
                          onClick={() => setQueueSearch('')}
                        >
                          Clear search
                        </button>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>{reviewApps.length} in queue</>
                )}
              </p>
            ) : null}
          </div>
          {!appsQuery.isLoading && !appsQuery.error && reviewApps.length > 0 ? (
            <div className="w-full shrink-0 sm:max-w-xs">
              <label htmlFor="eval-queue-search" className="sr-only">
                Search candidates by name or email
              </label>
              <input
                id="eval-queue-search"
                type="search"
                className="app-input !mt-0 py-2 text-sm"
                placeholder="Search name or email…"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}
        </div>
        <QueryPanel
          isLoading={appsQuery.isLoading}
          isError={!!appsQuery.error}
          loadingMessage="Loading queue…"
          errorMessage="Could not load evaluation queue."
        >
          {reviewApps.length === 0 ? (
            <div className="app-card mt-4 py-8 text-center text-slate-600">
              <p className="font-medium text-slate-800">Queue is clear</p>
            </div>
          ) : filteredReviewApps.length === 0 ? (
            <div className="app-card mt-4 py-8 text-center text-slate-600">
              <p className="font-medium text-slate-800">No matching candidates</p>
              <p className="mt-1 text-sm">
                Try another name or email, or{' '}
                <button
                  type="button"
                  className="font-semibold text-navy underline-offset-2 hover:underline"
                  onClick={() => setQueueSearch('')}
                >
                  clear search
                </button>
                .
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {filteredReviewApps.map((app) => {
                    const row = app.evaluatorAssignments?.find(
                      (a) => a.evaluator.id === currentUserId,
                    );
                    const submitted = row?.reviewSubmittedAt != null;
                    const candidate = evaluatorQueueCandidateLines(app.candidate);

                    return (
                      <li key={app.id} className="app-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-lg font-semibold text-slate-900">
                              {candidate.primary}
                            </p>
                            {candidate.secondary ? (
                              <p className="mt-0.5 truncate text-sm text-slate-600">
                                {candidate.secondary}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {app.job?.title}
                            </p>
                            <div className="mt-3">
                              <StatusBadge status={app.status} />
                            </div>
                            {submitted && (
                              <p className="mt-2 text-xs font-medium text-navy">
                                Review submitted
                              </p>
                            )}
                          </div>
                          {app.tests?.[0] && (
                            <Link
                              className="btn-primary btn-sm shrink-0"
                              to={`/eval/tests/${app.tests[0].id}`}
                            >
                              Open review
                            </Link>
                          )}
                        </div>
                      </li>
                    );
              })}
            </ul>
          )}
        </QueryPanel>
      </section>
    </div>
  );
}
