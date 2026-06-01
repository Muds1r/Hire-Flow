import { Link } from 'react-router-dom';
import { useApplicationsList } from '../features/applications/hooks';
import { PageHeader } from '../components/ui/PageHeader';
import { QueryPanel } from '../components/ui/QueryPanel';
import { ApplicationListRow } from '../components/hr/ApplicationListRow';
import { getApiErrorMessage } from '../utils/apiError';

export function ApplicationsPage() {
  const { data, isLoading, isError, error } = useApplicationsList({
    refetchOnMount: true,
  });

  return (
    <QueryPanel
      isLoading={isLoading}
      isError={isError}
      loadingMessage="Loading your applications…"
      errorMessage="Could not load your applications."
      errorDetail={error ? getApiErrorMessage(error, 'Request failed.') : undefined}
    >
      <div>
        <PageHeader
          title="My applications"
          subtitle="Track status and open any active technical assessment."
          className="mb-8"
        />
        {!data?.length ? (
          <div className="app-card py-12 text-center">
            <p className="font-medium text-slate-800">No applications yet</p>
            <p className="mt-1 text-sm text-slate-600">
              Browse <Link className="font-semibold text-mint-dark" to="/jobs">open jobs</Link> and apply with your CV.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {data.map((app) => {
              const test = app.tests?.[0];
              return (
                <ApplicationListRow
                  key={app.id}
                  application={app}
                  title={app.job?.title ?? 'Role'}
                  badgeExtra={
                    app.aiStatus && app.aiStatus !== 'COMPLETED' ? (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
                        CV / JD AI: {app.aiStatus}
                      </span>
                    ) : undefined
                  }
                  actions={
                    test && ['SENT', 'IN_PROGRESS'].includes(test.status) ? (
                      <Link className="btn-primary text-center" to={`/tests/${test.id}`}>
                        Take assessment
                      </Link>
                    ) : null
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </QueryPanel>
  );
}
