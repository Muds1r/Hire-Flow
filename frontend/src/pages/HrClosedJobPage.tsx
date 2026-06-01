import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/apiError';
import { getApplicationActions } from '../utils/applicationActions';
import { useHrApplicationsByJob } from '../features/applications/hooks';
import { useJobDetail } from '../features/jobs/hooks';
import { LoadingState } from '../components/LoadingState';
import { ApplicationListRow } from '../components/hr/ApplicationListRow';
import { ErrorCard } from '../components/ui/ErrorCard';

export function HrClosedJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const jobQuery = useJobDetail(jobId);
  const appsQuery = useHrApplicationsByJob(jobId);
  const apps = appsQuery.data ?? [];

  if (jobQuery.isLoading || appsQuery.isLoading) {
    return <LoadingState message="Loading closed job…" />;
  }
  if (appsQuery.isError) {
    return (
      <ErrorCard
        message="Could not load applicants for this job."
        detail={getApiErrorMessage(appsQuery.error, 'Request failed.')}
        backTo="/hr/jobs"
        backLabel="← Job posts"
      />
    );
  }

  if (jobQuery.error || !jobQuery.data) {
    return (
      <div className="app-card text-red-800">
        <p className="font-medium">Job not found or you do not have access.</p>
        <Link className="link-muted mt-3 inline-block" to="/hr/jobs">
          ← Job posts
        </Link>
      </div>
    );
  }

  const job = jobQuery.data;
  const isClosed = job.closedAt != null;

  return (
    <div className="text-left">
      <Link to="/hr/jobs" className="link-muted inline-flex items-center gap-1">
        <span aria-hidden>←</span> Job posts
      </Link>
      <header className="mt-6">
        <h1 className="page-title !text-2xl sm:!text-3xl">{job.title}</h1>
        <p className="page-subtitle !mt-2">
          {isClosed ? 'Closed listing — applicants and results (HR only).' : 'Applicants for this role.'}
        </p>
        {isClosed && job.closedAt && (
          <p className="mt-2 text-sm text-slate-600">
            Closed on{' '}
            <time dateTime={job.closedAt}>
              {new Date(job.closedAt).toLocaleString()}
            </time>
            . This job is hidden from candidates and evaluators.
          </p>
        )}
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">Applicants &amp; results</h2>
        <p className="mt-1 text-sm text-slate-600">
          Open an application to manage tests, or open the assessment when a score exists.
        </p>
        {apps.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No applications for this job.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {apps.map((app) => {
              const test = app.tests?.[0];
              const hrActions = getApplicationActions(
                {
                  status: app.status,
                  sentToEvaluatorsAt: app.sentToEvaluatorsAt,
                  evaluatorAssignmentCount: app.evaluatorAssignments?.length ?? 0,
                },
                test ? { status: test.status } : undefined,
              );
              const showResult = hrActions.showResultVisible;
              return (
                <ApplicationListRow
                  key={app.id}
                  application={app}
                  title={app.candidate?.email ?? 'Candidate'}
                  actions={
                    <>
                      <Link
                        className="btn-secondary shrink-0 text-center"
                        to={`/hr/applications/${app.id}`}
                      >
                        Open application
                      </Link>
                      {showResult && test && (
                        <Link
                          className="btn-primary btn-sm shrink-0 text-center"
                          to={`/hr/tests/${test.id}`}
                        >
                          View result
                        </Link>
                      )}
                    </>
                  }
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
