import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { QueryPanel } from '../components/ui/QueryPanel';
import { SiteLogo } from '../components/SiteLogo';
import { useOpenJobs } from '../features/jobs/hooks';

export function JobsPage() {
  const jobsQuery = useOpenJobs();

  return (
    <QueryPanel
      isLoading={jobsQuery.isLoading}
      isError={!!jobsQuery.error}
      loadingMessage="Loading open roles…"
      errorMessage="Could not load jobs."
      errorDetail="Check that the API is running and you are signed in."
    >
      <div>
        <PageHeader
          title="Open positions"
          subtitle="Browse roles, read the job description, and apply with your CV."
          breadcrumb={
            <div className="mb-6">
              <SiteLogo variant="hero" />
            </div>
          }
          className="mb-8"
        />
        {jobsQuery.data?.length === 0 ? (
          <div className="app-card py-12 text-center text-slate-600">
            <p className="font-medium text-slate-800">No jobs yet</p>
            <p className="mt-1 text-sm">
              HR can publish roles from the HR desk when they are ready.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {jobsQuery.data?.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/jobs/${job.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/40 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:border-mint hover:shadow-md hover:shadow-mint/20/50"
                >
                  <span className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-navy">
                    {job.title}
                  </span>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {job.description}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-mint-dark group-hover:text-mint-dark">
                    View role
                    <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </QueryPanel>
  );
}
